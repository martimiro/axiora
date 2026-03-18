import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { status } = await req.json()
  const conv = await prisma.conversation.findUnique({
    where: { id },
    include: { agent: true }
  })

  if (!conv || conv.agent.userId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const updated = await prisma.conversation.update({
    where: { id },
    data: { status }
  })

  return NextResponse.json(updated)
}
