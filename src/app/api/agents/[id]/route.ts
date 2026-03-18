import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await context.params
  const { name, description, prompt } = await req.json()
  const agent = await prisma.agent.findUnique({ where: { id } })

  if (!agent || agent.userId !== userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const updated = await prisma.agent.update({
    where: { id },
    data: { name, description, prompt }
  })

  return NextResponse.json(updated)
}
