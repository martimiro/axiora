import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getAvailability, createEvent } from './calendar'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function runAgent(agentId: string, userMessage: string, sessionId?: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent) throw new Error(`Agent ${agentId} no trobat`)

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

  // Check calendar availability if message mentions meeting/appointment
  let calendarContext = ''
  const meetingKeywords = ['reunió', 'reunio', 'meeting', 'cita', 'appointment', 'agenda', 'disponibilitat', 'disponibilidad', 'availability', 'quedar', 'trucar', 'llamar', 'call', 'demo', 'visita']
  const wantsMeeting = meetingKeywords.some(k => userMessage.toLowerCase().includes(k))

  if (wantsMeeting) {
    try {
      const { freeSlots } = await getAvailability(agent.userId, 7)
      if (freeSlots.length > 0) {
        calendarContext = `\n\nDISPONIBILITAT DEL CALENDARI (pròxims 7 dies):\n${freeSlots.slice(0, 5).map((s, i) => `${i + 1}. ${s.label}`).join('\n')}\n\nSi l'usuari confirma un horari, indica-ho clarament amb format: CREAR_REUNIO:[títol]|[start_iso]|[end_iso]|[email_convidat_opcional]`
      }
    } catch (e) {
      // Calendar not connected, continue without it
    }
  }

  const history = conversation.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: agent.prompt + calendarContext,
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  let reply = result.response.text()

  // Parse calendar event creation
  const eventMatch = reply.match(/CREAR_REUNIO:([^|]+)\|([^|]+)\|([^|]+)\|?([^\n]*)/)
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
      reply += '\n\n✅ He creat la reunió al teu calendari i enviat la invitació.'
    } catch (e) {
      // Event creation failed silently
    }
  }

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'assistant', content: reply },
  })

  try {
    const userWithEmail = await prisma.user.findUnique({ where: { id: agent.userId } })
    if (userWithEmail?.email && process.env.RESEND_API_KEY) {
      const { notifyOperator } = await import('./notifications')
      await notifyOperator({ operatorEmail: userWithEmail.email, agentName: agent.name, conversationId: conversation.id, message: userMessage, reply })
    }
  } catch (e) { console.error('Error enviant notificació:', e) }

  return { reply, conversationId: conversation.id }
}
