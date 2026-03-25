import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { name, description, prompt, type } = await req.json()
  if (!name || !prompt) {
    return NextResponse.json({ error: 'name y prompt son requeridos' }, { status: 400 })
  }
  const agent = await prisma.agent.create({
    data: { name, description: description || '', prompt, type: type || 'support', userId }
  })
  return NextResponse.json(agent)
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await req.json()
  const agent = await prisma.agent.findUnique({ where: { id } })
  if (!agent || agent.userId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  // Delete in cascade: messages -> conversations -> agent
  const conversations = await prisma.conversation.findMany({ where: { agentId: id } })
  for (const conv of conversations) {
    await prisma.message.deleteMany({ where: { conversationId: conv.id } })
  }
  await prisma.conversation.deleteMany({ where: { agentId: id } })
  await prisma.agent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
