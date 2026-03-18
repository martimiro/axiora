import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function runAgent(agentId: string, userMessage: string, sessionId?: string) {
  const agent = await prisma.agent.findUnique({ where: { id: agentId } })
  if (!agent) throw new Error(`Agente ${agentId} no encontrado`)

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

  const history = conversation.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: agent.prompt,
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  const reply = result.response.text()

  await prisma.message.create({
    data: { conversationId: conversation.id, role: 'assistant', content: reply },
  })

  return { reply, conversationId: conversation.id }
}
