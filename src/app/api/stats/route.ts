import 'dotenv/config'
import { NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - 7)

  const agents = await prisma.agent.findMany({
    where: { userId },
    include: {
      conversations: {
        include: {
          messages: true
        }
      }
    }
  })

  const allConversations = agents.flatMap(a => a.conversations)
  const allMessages = allConversations.flatMap(c => c.messages)

  const msgsToday = allMessages.filter(m => new Date(m.createdAt) >= startOfDay)
  const msgsThisWeek = allMessages.filter(m => new Date(m.createdAt) >= startOfWeek)
  const assistantMsgs = allMessages.filter(m => m.role === 'assistant')
  const openConvs = allConversations.filter(c => c.status === 'open')

  return NextResponse.json({
    totalAgents: agents.length,
    totalConversations: allConversations.length,
    totalMessages: allMessages.length,
    messagesToday: msgsToday.length,
    messagesThisWeek: msgsThisWeek.length,
    autoReplies: assistantMsgs.length,
    openConversations: openConvs.length,
    agentStats: agents.map(a => ({
      id: a.id,
      name: a.name,
      conversations: a.conversations.length,
      messages: a.conversations.flatMap(c => c.messages).length,
    }))
  })
}
