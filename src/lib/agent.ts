import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getAvailability, createEvent } from './calendar'
import { classifyIntent, decide, type ConversationState } from './intent'
import { checkEmailLimit, incrementEmailUsage } from './usage'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function runAgent(agentId: string, userMessage: string, sessionId?: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent) throw new Error(`Agent ${agentId} no trobat`)

  const { allowed, used, limit } = await checkEmailLimit(agent.userId)
  if (!allowed) {
    throw new Error(`Monthly email limit reached (${used}/${limit}). Upgrade your plan for more.`)
  }

  const source = sessionId || 'web'

  let conversation = await prisma.conversation.findFirst({
    where: { agentId, status: 'open', source },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { agentId, source },
      include: { messages: true },
    })
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'user', content: userMessage },
  })

  // --- 1. Intent classification via LLM ---
  const currentState = (conversation.state || 'idle') as ConversationState
  const historyForClassifier = conversation.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))

  const classification = await classifyIntent(userMessage, historyForClassifier, currentState)
  console.log('[agent] intent:', classification.intent, 'confidence:', classification.confidence, 'state:', currentState)

  // --- 2. Decision logic (state + intent → actions) ---
  const decision = decide(currentState, classification.intent, classification.confidence)
  console.log('[agent] decision:', { nextState: decision.nextState, fetchCalendar: decision.fetchCalendar, allowEventCreation: decision.allowEventCreation })

  // --- 3. State update ---
  if (decision.nextState !== currentState) {
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { state: decision.nextState },
    })
  }

  // --- 4. Build context based on decision ---
  let calendarContext = ''
  if (decision.fetchCalendar) {
    try {
      const { freeSlots } = await getAvailability(agent.userId, 7)
      const today = new Date().toISOString().split('T')[0]
      if (freeSlots.length > 0) {
        calendarContext =
          `\n\n=== CALENDAR ACCESS (YOU HAVE DIRECT ACCESS TO THE CALENDAR) ===\n` +
          `You are connected to Google Calendar and can schedule meetings directly. ` +
          `NEVER tell the user to visit a website or scheduling page. Instead, propose these available slots:\n\n` +
          freeSlots
            .slice(0, 5)
            .map((s, i) => `${i + 1}. ${s.label}`)
            .join('\n') +
          `\n\nAsk the user which slot works for them. If they confirm a slot, output the tag:\n` +
          `CREAR_REUNIO:[title]|[start_iso]|[end_iso]|[attendee_email]\n` +
          `IMPORTANT: today is ${today}, use the correct year. ` +
          `If you don't have the user's email, ask for it before creating the event.\n` +
          `=== END CALENDAR ACCESS ===`
      } else {
        calendarContext =
          `\n\nYou have calendar access but there are no free slots in the next 7 days. ` +
          `Let the user know and ask if a later date works.`
      }
    } catch {
      calendarContext = ''
    }
  }

  const systemInstruction =
    agent.prompt + decision.extraSystemContext + calendarContext

  // --- 5. Generate response ---
  const history = conversation.messages.map((m) => ({
    role: m.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: m.content }],
  }))

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  let reply = result.response.text()

  // --- 6. Post-response actions ---
  if (decision.allowEventCreation) {
    const eventMatch = reply.match(
      /CREAR_REUNIO:\[?([^\]|]+)\]?\|\[?([^\]|]+)\]?\|\[?([^\]|]+)\]?\|\[?([^\]\n]*)\]?/
    )
    if (eventMatch) {
      try {
        const [, title, start, end, attendeeEmail] = eventMatch
        await createEvent(agent.userId, {
          title: title.trim(),
          start: start.trim(),
          end: end.trim(),
          attendeeEmail: attendeeEmail?.trim() || undefined,
          description: `Reunió creada per l'agent ${agent.name} d'Axiora`,
        })
        reply = reply.replace(/CREAR_REUNIO:[^\n]+/, '').trim()
        reply += '\n\n He creat la reunió al teu calendari i enviat la invitació.'

        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { state: 'engaged' },
        })
      } catch {
        // Event creation failed
      }
    }
  }

  // --- 7. Persist assistant message & track usage ---
  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'assistant', content: reply },
  })
  await incrementEmailUsage(agent.userId)

  // --- 8. Auto-escalation: create ticket when agent can't handle the task ---
  const escalationPatterns = /\b(escalat|human agent|persona real|agent humà|no puc ajudar|cannot help|can't help|no puedo ayudar|transfer|derivar|supervisor)\b/i
  const shouldEscalate =
    (classification.intent === 'other' && classification.confidence < 0.3) ||
    escalationPatterns.test(reply)

  if (shouldEscalate) {
    try {
      const lastUserMsg = userMessage.slice(0, 120)
      await prisma.ticket.create({
        data: {
          title: `Escalation: ${lastUserMsg}${userMessage.length > 120 ? '…' : ''}`,
          description: `The agent could not handle this request.\n\nCustomer message: "${userMessage}"\n\nAgent reply: "${reply.slice(0, 300)}"`,
          priority: 'high',
          status: 'open',
          agentId,
          conversationId: conversation.id,
          userId: agent.userId,
        },
      })
      console.log('[agent] Ticket created — agent could not handle request')
    } catch (e) {
      console.error('[agent] Failed to create escalation ticket:', e)
    }
  }

  try {
    const userWithEmail = await prisma.user.findUnique({ where: { id: agent.userId } })
    if (userWithEmail?.email && process.env.RESEND_API_KEY) {
      const { notifyOperator } = await import('./notifications')
      await notifyOperator({
        operatorEmail: userWithEmail.email,
        agentName: agent.name,
        conversationId: conversation.id,
        message: userMessage,
        reply,
      })
    }
  } catch (e) {
    console.error('Error enviant notificació:', e)
  }

  return { reply, conversationId: conversation.id }
}
