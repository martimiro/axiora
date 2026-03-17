import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { processNewEmails } from '@/lib/gmail'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const agents = await prisma.agent.findMany()
    const results = []

    for (const agent of agents) {
      const processed = await processNewEmails(agent.id)
      results.push({ agentId: agent.id, processed: processed.length })
    }

    return NextResponse.json({ ok: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
