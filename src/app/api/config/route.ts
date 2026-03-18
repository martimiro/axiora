import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const config = await prisma.config.findUnique({ where: { key: 'gmail_auto_reply' } })
  return NextResponse.json({ autoReply: config?.value === 'true' })
}

export async function POST(req: NextRequest) {
  const { autoReply } = await req.json()
  await prisma.config.upsert({
    where: { key: 'gmail_auto_reply' },
    update: { value: autoReply ? 'true' : 'false' },
    create: { key: 'gmail_auto_reply', value: autoReply ? 'true' : 'false' }
  })
  return NextResponse.json({ ok: true, autoReply })
}
