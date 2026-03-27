import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ autoReply: false })

  const config = await prisma.config.findFirst({
    where: { key: `gmail_auto_reply_${userId}`, userId }
  })
  return NextResponse.json({ autoReply: config?.value === 'true' })
}

export async function POST(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { autoReply } = await req.json()
  await prisma.config.upsert({
    where: { key: `gmail_auto_reply_${userId}` },
    update: { value: autoReply ? 'true' : 'false' },
    create: { key: `gmail_auto_reply_${userId}`, value: autoReply ? 'true' : 'false', userId }
  })
  return NextResponse.json({ ok: true, autoReply })
}
