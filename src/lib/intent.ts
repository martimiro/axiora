import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const INTENTS = [
  'greeting',
  'general_inquiry',
  'schedule_meeting',
  'confirm_meeting',
  'provide_info',
  'cancel',
  'farewell',
  'other',
] as const

export type Intent = (typeof INTENTS)[number]

export const STATES = ['idle', 'engaged', 'scheduling', 'confirming'] as const
export type ConversationState = (typeof STATES)[number]

export interface ClassificationResult {
  intent: Intent
  confidence: number
  entities: {
    date?: string | null
    time?: string | null
    email?: string | null
    name?: string | null
  }
}

export interface Decision {
  nextState: ConversationState
  fetchCalendar: boolean
  allowEventCreation: boolean
  extraSystemContext: string
}

const classifierModel = genAI.getGenerativeModel({
  model: 'gemini-2.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: SchemaType.OBJECT,
      properties: {
        intent: {
          type: SchemaType.STRING,
          format: 'enum',
          enum: [...INTENTS],
        },
        confidence: { type: SchemaType.NUMBER },
        entities: {
          type: SchemaType.OBJECT,
          properties: {
            date: { type: SchemaType.STRING, nullable: true },
            time: { type: SchemaType.STRING, nullable: true },
            email: { type: SchemaType.STRING, nullable: true },
            name: { type: SchemaType.STRING, nullable: true },
          },
        },
      },
      required: ['intent', 'confidence'],
    },
  },
})

export async function classifyIntent(
  message: string,
  history: { role: string; content: string }[],
  currentState: ConversationState
): Promise<ClassificationResult> {
  const recent = history
    .slice(-6)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n')

  const prompt = `You are an intent classifier for a multilingual business assistant (Catalan, Spanish, English).

Conversation state: ${currentState}

Recent history:
${recent || '(new conversation)'}

User message: "${message}"

Classify the intent:
- greeting: Hello, hola, bon dia, etc.
- general_inquiry: Questions about products, services, pricing, info
- schedule_meeting: Wants to schedule a meeting, call, demo, appointment (reunió, cita, quedar, trucar, llamar, demo, visita)
- confirm_meeting: Confirming a proposed time/slot (ok, perfecte, d'acord, sí, confirmo, va bé)
- provide_info: Sharing email, name, phone, or other personal data
- cancel: Wants to cancel or go back
- farewell: Goodbye, adéu, fins aviat
- other: Anything else

Extract entities if present (date, time, email, name). Set confidence 0-1.`

  try {
    const result = await classifierModel.generateContent(prompt)
    const parsed = JSON.parse(result.response.text())
    return {
      intent: INTENTS.includes(parsed.intent) ? parsed.intent : 'other',
      confidence: Math.min(1, Math.max(0, parsed.confidence ?? 0.5)),
      entities: parsed.entities ?? {},
    }
  } catch (e) {
    console.error('[intent] Classification failed, using keyword fallback:', e)
    return keywordFallback(message, currentState)
  }
}

const SCHEDULING_KEYWORDS = /\b(schedule|meeting|demo|appointment|call|reunió|cita|quedar|trucar|llamar|visita|agendar|reservar|programar|book|slot)\b/i
const CONFIRM_KEYWORDS = /\b(ok|perfect[eo]?|d'acord|sí|si|yes|confirm[oa]?|va bé|sounds good|that works|agreed)\b/i
const GREETING_KEYWORDS = /\b(hello|hi|hola|bon dia|buenos días|hey|good morning|good afternoon)\b/i
const FAREWELL_KEYWORDS = /\b(bye|goodbye|adéu|fins aviat|adiós|hasta luego|gràcies|gracias|thank)\b/i

function keywordFallback(message: string, state: ConversationState): ClassificationResult {
  const lower = message.toLowerCase()

  if (state === 'scheduling' && CONFIRM_KEYWORDS.test(lower)) {
    return { intent: 'confirm_meeting', confidence: 0.7, entities: {} }
  }
  if (SCHEDULING_KEYWORDS.test(lower)) {
    return { intent: 'schedule_meeting', confidence: 0.7, entities: {} }
  }
  if (GREETING_KEYWORDS.test(lower)) {
    return { intent: 'greeting', confidence: 0.6, entities: {} }
  }
  if (FAREWELL_KEYWORDS.test(lower)) {
    return { intent: 'farewell', confidence: 0.6, entities: {} }
  }
  return { intent: 'other', confidence: 0, entities: {} }
}

const TRANSITIONS: Record<ConversationState, Partial<Record<Intent, ConversationState>>> = {
  idle: {
    greeting: 'engaged',
    general_inquiry: 'engaged',
    schedule_meeting: 'scheduling',
    provide_info: 'engaged',
    other: 'engaged',
  },
  engaged: {
    schedule_meeting: 'scheduling',
    farewell: 'idle',
    cancel: 'idle',
  },
  scheduling: {
    confirm_meeting: 'confirming',
    provide_info: 'scheduling',
    cancel: 'engaged',
    farewell: 'idle',
    general_inquiry: 'engaged',
  },
  confirming: {
    confirm_meeting: 'confirming',
    schedule_meeting: 'scheduling',
    cancel: 'engaged',
    farewell: 'idle',
    general_inquiry: 'engaged',
  },
}

export function resolveState(current: ConversationState, intent: Intent): ConversationState {
  return TRANSITIONS[current]?.[intent] ?? current
}

export function decide(
  currentState: ConversationState,
  intent: Intent,
  confidence: number
): Decision {
  const nextState = resolveState(currentState, intent)
  const isSchedulingFlow = nextState === 'scheduling' || nextState === 'confirming'

  const fetchCalendar = isSchedulingFlow && confidence > 0.4
  const allowEventCreation = nextState === 'confirming'

  let extraSystemContext = ''
  if (nextState === 'scheduling') {
    extraSystemContext =
      "\n\nThe user wants to schedule a meeting. You MUST propose specific available time slots from the calendar data below. " +
      "Do NOT redirect to any website or scheduling page — you have direct calendar access. " +
      "Ask for their email if you don't have it yet. Be concise and professional. " +
      "Respond in the same language as the user."
  } else if (nextState === 'confirming') {
    extraSystemContext =
      "\n\nThe user is confirming a time slot. If you have all the info (date, time, email), " +
      "create the meeting by outputting: CREAR_REUNIO:[title]|[start_iso]|[end_iso]|[email]. " +
      "If any info is missing, ask for it before creating. Respond in the same language as the user."
  }

  return { nextState, fetchCalendar, allowEventCreation, extraSystemContext }
}
