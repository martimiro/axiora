import 'dotenv/config'
import { NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'
import { getPlanLimits } from '@/lib/plans'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, plan: true, emailsUsedThisMonth: true, emailsResetAt: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const limits = getPlanLimits(user.plan, user.role)
  const agentCount = await prisma.agent.count({ where: { userId } })

  return NextResponse.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    plan: user.role === 'admin' ? 'admin' : user.plan,
    usage: {
      agents: agentCount,
      maxAgents: limits.maxAgents === Infinity ? null : limits.maxAgents,
      emailsUsed: user.emailsUsedThisMonth,
      maxEmails: limits.maxEmailsPerMonth === Infinity ? null : limits.maxEmailsPerMonth,
      emailsResetAt: user.emailsResetAt,
    },
    features: {
      integrations: limits.integrations,
      fullDashboard: limits.hasFullDashboard,
      advancedAnalytics: limits.hasAdvancedAnalytics,
      api: limits.hasApi,
      sla: limits.hasSla,
    },
  })
}
