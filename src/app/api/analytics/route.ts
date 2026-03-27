import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'
import { getPlanLimits } from '@/lib/plans'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

type MsgRow = { role: string; createdAt: Date; conversationId: string }
type ConvRow = { id: string; status: string; source: string; createdAt: Date; updatedAt: Date; agentId: string; messages: MsgRow[] }
type AgentRow = { id: string; name: string; conversations: ConvRow[] }

function dayKey(d: Date) { return d.toISOString().slice(0, 10) }
function weekKey(d: Date) {
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`
}
function monthKey(d: Date) { return d.toISOString().slice(0, 7) }

function groupKey(d: Date, period: string) {
  if (period === 'week') return weekKey(d)
  if (period === 'month') return monthKey(d)
  return dayKey(d)
}

function generateLabels(from: Date, to: Date, period: string): string[] {
  const labels: string[] = []
  const cur = new Date(from)
  const seen = new Set<string>()
  while (cur <= to) {
    const k = groupKey(cur, period)
    if (!seen.has(k)) { seen.add(k); labels.push(k) }
    cur.setDate(cur.getDate() + 1)
  }
  return labels
}

function computeResponseTimes(messages: MsgRow[]): { responseTimes: number[]; firstReplyTimes: number[] } {
  const byConv = new Map<string, MsgRow[]>()
  for (const m of messages) {
    const arr = byConv.get(m.conversationId) || []
    arr.push(m)
    byConv.set(m.conversationId, arr)
  }

  const responseTimes: number[] = []
  const firstReplyTimes: number[] = []

  for (const [, msgs] of byConv) {
    const sorted = msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    let foundFirst = false
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].role === 'user' && sorted[i + 1].role === 'assistant') {
        const delta = (sorted[i + 1].createdAt.getTime() - sorted[i].createdAt.getTime()) / 1000
        if (delta >= 0 && delta < 86400) {
          responseTimes.push(delta)
          if (!foundFirst) { firstReplyTimes.push(delta); foundFirst = true }
        }
      }
    }
  }

  return { responseTimes, firstReplyTimes }
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}

export async function GET(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const limits = getPlanLimits(user.plan, user.role)
  if (!limits.hasAdvancedAnalytics) {
    return NextResponse.json({ error: 'Advanced analytics requires Pro or Enterprise plan' }, { status: 403 })
  }

  const params = req.nextUrl.searchParams
  const now = new Date()
  const toDate = params.get('to') ? new Date(params.get('to')! + 'T23:59:59.999Z') : now
  const fromDate = params.get('from') ? new Date(params.get('from')! + 'T00:00:00.000Z') : new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29)
  const period = params.get('period') || 'day'

  const rangeDuration = toDate.getTime() - fromDate.getTime()
  const prevFrom = new Date(fromDate.getTime() - rangeDuration)
  const prevTo = new Date(fromDate.getTime() - 1)

  try {
    const agents: AgentRow[] = await prisma.agent.findMany({
      where: { userId },
      include: {
        conversations: {
          include: { messages: { select: { role: true, createdAt: true, conversationId: true } } }
        }
      }
    })

    const allConvs = agents.flatMap(a => a.conversations.map(c => ({ ...c, agentId: a.id, agentName: a.name })))
    const allMessages = allConvs.flatMap(c => c.messages)

    const rangeConvs = allConvs.filter(c => c.createdAt >= fromDate && c.createdAt <= toDate)
    const rangeMsgs = allMessages.filter(m => m.createdAt >= fromDate && m.createdAt <= toDate)
    const prevConvs = allConvs.filter(c => c.createdAt >= prevFrom && c.createdAt <= prevTo)
    const prevMsgs = allMessages.filter(m => m.createdAt >= prevFrom && m.createdAt <= prevTo)

    const tickets = await prisma.ticket.findMany({ where: { userId } })
    const rangeTickets = tickets.filter(t => t.createdAt >= fromDate && t.createdAt <= toDate)
    const prevTickets = tickets.filter(t => t.createdAt >= prevFrom && t.createdAt <= prevTo)

    const resolvedConvs = rangeConvs.filter(c => c.status === 'resolved')
    const resolutionRate = rangeConvs.length > 0 ? resolvedConvs.length / rangeConvs.length : 0
    const prevResolved = prevConvs.filter(c => c.status === 'resolved')
    const prevResolutionRate = prevConvs.length > 0 ? prevResolved.length / prevConvs.length : 0

    const { responseTimes, firstReplyTimes } = computeResponseTimes(rangeMsgs)
    const prevRT = computeResponseTimes(prevMsgs)
    const avgResponseTime = avg(responseTimes)
    const avgFirstReply = avg(firstReplyTimes)
    const prevAvgResponseTime = avg(prevRT.responseTimes)

    const resolutionTimes = resolvedConvs.map(c => (c.updatedAt.getTime() - c.createdAt.getTime()) / 1000)
    const avgResolutionTime = avg(resolutionTimes)

    const labels = generateLabels(fromDate, toDate, period)
    const msgsByPeriod = new Map<string, number>()
    const convsByPeriod = new Map<string, number>()
    const ticketsByPeriod = new Map<string, number>()
    const rtByPeriod = new Map<string, number[]>()
    for (const l of labels) { msgsByPeriod.set(l, 0); convsByPeriod.set(l, 0); ticketsByPeriod.set(l, 0); rtByPeriod.set(l, []) }

    for (const m of rangeMsgs) {
      const k = groupKey(m.createdAt, period)
      msgsByPeriod.set(k, (msgsByPeriod.get(k) || 0) + 1)
    }
    for (const c of rangeConvs) {
      const k = groupKey(c.createdAt, period)
      convsByPeriod.set(k, (convsByPeriod.get(k) || 0) + 1)
    }
    for (const t of rangeTickets) {
      const k = groupKey(t.createdAt, period)
      ticketsByPeriod.set(k, (ticketsByPeriod.get(k) || 0) + 1)
    }

    const byConvForRT = new Map<string, MsgRow[]>()
    for (const m of rangeMsgs) {
      const arr = byConvForRT.get(m.conversationId) || []
      arr.push(m)
      byConvForRT.set(m.conversationId, arr)
    }
    for (const [, msgs] of byConvForRT) {
      const sorted = msgs.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].role === 'user' && sorted[i + 1].role === 'assistant') {
          const delta = (sorted[i + 1].createdAt.getTime() - sorted[i].createdAt.getTime()) / 1000
          if (delta >= 0 && delta < 86400) {
            const k = groupKey(sorted[i + 1].createdAt, period)
            const arr = rtByPeriod.get(k) || []
            arr.push(delta)
            rtByPeriod.set(k, arr)
          }
        }
      }
    }

    const hourlyDistribution = new Array(24).fill(0)
    for (const m of rangeMsgs) {
      hourlyDistribution[m.createdAt.getHours()]++
    }

    const agentPerformance = agents.map(a => {
      const aConvs = rangeConvs.filter(c => c.agentId === a.id)
      const aMsgs = rangeMsgs.filter(m => aConvs.some(c => c.id === m.conversationId))
      const aResolved = aConvs.filter(c => c.status === 'resolved')
      const { responseTimes: art } = computeResponseTimes(aMsgs)
      return {
        id: a.id,
        name: a.name,
        conversations: aConvs.length,
        messages: aMsgs.length,
        avgResponseTime: avg(art),
        resolutionRate: aConvs.length > 0 ? aResolved.length / aConvs.length : 0,
        msgsPerConversation: aConvs.length > 0 ? aMsgs.length / aConvs.length : 0,
      }
    })

    const sourceDistribution: Record<string, number> = {}
    for (const c of rangeConvs) {
      sourceDistribution[c.source] = (sourceDistribution[c.source] || 0) + 1
    }

    const ticketsByPriority: Record<string, number> = {}
    const ticketsByStatus: Record<string, number> = {}
    for (const t of rangeTickets) {
      ticketsByPriority[t.priority] = (ticketsByPriority[t.priority] || 0) + 1
      ticketsByStatus[t.status] = (ticketsByStatus[t.status] || 0) + 1
    }
    const resolvedTickets = rangeTickets.filter(t => t.status === 'resolved')
    const ticketResolutionTimes = resolvedTickets.map(t => (t.updatedAt.getTime() - t.createdAt.getTime()) / 1000)

    return NextResponse.json({
      overview: {
        totalMessages: rangeMsgs.length,
        totalConversations: rangeConvs.length,
        totalTickets: rangeTickets.length,
        resolutionRate: Math.round(resolutionRate * 100),
        avgResponseTime: Math.round(avgResponseTime),
        avgFirstReplyTime: Math.round(avgFirstReply),
        avgResolutionTime: Math.round(avgResolutionTime),
        comparison: {
          messages: { current: rangeMsgs.length, previous: prevMsgs.length, change: pctChange(rangeMsgs.length, prevMsgs.length) },
          conversations: { current: rangeConvs.length, previous: prevConvs.length, change: pctChange(rangeConvs.length, prevConvs.length) },
          tickets: { current: rangeTickets.length, previous: prevTickets.length, change: pctChange(rangeTickets.length, prevTickets.length) },
          responseTime: { current: Math.round(avgResponseTime), previous: Math.round(prevAvgResponseTime), change: pctChange(avgResponseTime, prevAvgResponseTime) },
          resolutionRate: { current: Math.round(resolutionRate * 100), previous: Math.round(prevResolutionRate * 100), change: Math.round(resolutionRate * 100) - Math.round(prevResolutionRate * 100) },
        }
      },
      timeseries: {
        labels,
        messages: labels.map(l => msgsByPeriod.get(l) || 0),
        conversations: labels.map(l => convsByPeriod.get(l) || 0),
        tickets: labels.map(l => ticketsByPeriod.get(l) || 0),
        responseTime: labels.map(l => { const arr = rtByPeriod.get(l) || []; return arr.length > 0 ? Math.round(avg(arr)) : 0 }),
      },
      agentPerformance,
      ticketAnalytics: {
        byPriority: ticketsByPriority,
        byStatus: ticketsByStatus,
        avgResolutionTime: Math.round(avg(ticketResolutionTimes)),
      },
      sourceDistribution,
      hourlyDistribution,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 })
  }
}
