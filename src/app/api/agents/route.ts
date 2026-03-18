import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  const { name, description, prompt, type } = await req.json()
  if (!name || !prompt) {
    return NextResponse.json({ error: 'name y prompt son requeridos' }, { status: 400 })
  }
  const agent = await prisma.agent.create({
    data: { name, description: description || '', prompt, type: type || 'support' }
  })
  return NextResponse.json(agent)
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  await prisma.agent.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
