import 'dotenv/config'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client/default'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function runAgent(agentId: string, userMessage: string) {
  // 1. Carga el agente de la base de datos
  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
  })

  if (!agent) throw new Error(`Agente ${agentId} no encontrado`)

  // 2. Busca o crea una conversación abierta para este agente
  let conversation = await prisma.conversation.findFirst({
    where: { agentId, status: 'open' },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  })

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { agentId },
      include: { messages: true },
    })
  }

  // 3. Guarda el mensaje del usuario
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'user',
      content: userMessage,
    },
  })

  // 4. Construye el historial para Gemini
  const history = conversation.messages.map((m) => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  // 5. Llama a Gemini con el prompt del agente como instrucción de sistema
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: agent.prompt,
  })

  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  const reply = result.response.text()

  // 6. Guarda la respuesta del agente
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      role: 'assistant',
      content: reply,
    },
  })

  return { reply, conversationId: conversation.id }
}
