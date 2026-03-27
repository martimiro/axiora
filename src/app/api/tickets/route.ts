import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const tickets = await prisma.ticket.findMany({
    where: { userId },
    include: {
      agent: { select: { id: true, name: true } },
      conversation: {
        select: { id: true, messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { title, description, priority, agentId, conversationId } = await req.json()
  if (!title || !agentId) {
    return NextResponse.json({ error: 'Title and agentId are required' }, { status: 400 })
  }

  const agent = await prisma.agent.findFirst({ where: { id: agentId, userId } })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const ticket = await prisma.ticket.create({
    data: {
      title,
      description: description || '',
      priority: priority || 'medium',
      agentId,
      conversationId: conversationId || null,
      userId,
    },
  })

  return NextResponse.json(ticket)
}
