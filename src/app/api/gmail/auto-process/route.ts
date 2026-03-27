import 'dotenv/config'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/session'
import { processNewEmails } from '@/lib/gmail'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function POST() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const config = await prisma.config.findFirst({ where: { key: `gmail_auto_reply_${userId}`, userId } })
  if (config?.value !== 'true') {
    return NextResponse.json({ skipped: true, reason: 'auto-reply disabled' })
  }

  const gmailIntegration = await prisma.gmailIntegration.findUnique({ where: { userId } })
  if (!gmailIntegration) {
    return NextResponse.json({ skipped: true, reason: 'gmail not connected' })
  }

  const agents = await prisma.agent.findMany({ where: { userId }, select: { id: true } })
  if (agents.length === 0) {
    return NextResponse.json({ skipped: true, reason: 'no agents' })
  }

  try {
    const allResults = []
    for (const agent of agents) {
      const results = await processNewEmails(agent.id)
      allResults.push(...results)
    }
    return NextResponse.json({ processed: allResults.length, results: allResults })
  } catch (error: any) {
    console.error('Auto-process error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
