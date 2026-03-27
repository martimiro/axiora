'use client'
import { useState, useEffect, useCallback } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

type AnalyticsData = {
  overview: {
    totalMessages: number; totalConversations: number; totalTickets: number
    resolutionRate: number; avgResponseTime: number; avgFirstReplyTime: number; avgResolutionTime: number
    comparison: {
      messages: { current: number; previous: number; change: number }
      conversations: { current: number; previous: number; change: number }
      tickets: { current: number; previous: number; change: number }
      responseTime: { current: number; previous: number; change: number }
      resolutionRate: { current: number; previous: number; change: number }
    }
  }
  timeseries: { labels: string[]; messages: number[]; conversations: number[]; tickets: number[]; responseTime: number[] }
  agentPerformance: { id: string; name: string; conversations: number; messages: number; avgResponseTime: number; resolutionRate: number; msgsPerConversation: number }[]
  ticketAnalytics: { byPriority: Record<string, number>; byStatus: Record<string, number>; avgResolutionTime: number }
  sourceDistribution: Record<string, number>
  hourlyDistribution: number[]
}

type BasicStats = {
  totalAgents: number; totalConversations: number; totalMessages: number
  messagesToday: number; messagesThisWeek: number; autoReplies: number
  openConversations: number; totalTickets?: number; openTickets?: number; ticketsToday?: number
  agentStats: { id: string; name: string; conversations: number; messages: number }[]
  yesterday?: { messages: number; conversations: number }
}

type Props = {
  hasAdvancedAnalytics: boolean
  basicStats?: BasicStats
  t?: Record<string, string>
}

const SANS = "'Inter', sans-serif"
const MONO = "'IBM Plex Mono', monospace"
const ACCENT = '#7c3aed'
const COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4']
const CARD: React.CSSProperties = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem 1.5rem' }

const PRESETS = [
  { key: 'today', label: 'Today', days: 0 },
  { key: '7d', label: '7 days', days: 7 },
  { key: '30d', label: '30 days', days: 30 },
  { key: '90d', label: '90 days', days: 90 },
] as const

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function formatLabel(label: string | undefined): string {
  if (!label) return ''
  if (label.includes('-W')) return label
  if (label.length === 7) return label
  const d = new Date(label + 'T00:00:00')
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

function TrendIndicator({ change, suffix = '%' }: { change: number; suffix?: string }) {
  if (change === 0) return <span style={{ fontSize: 11, color: '#9ca3af' }}>--</span>
  const up = change > 0
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: up ? '#10b981' : '#ef4444', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {up ? '↑' : '↓'} {Math.abs(change)}{suffix}
    </span>
  )
}

function TrendIndicatorInverse({ change, suffix = '%' }: { change: number; suffix?: string }) {
  if (change === 0) return <span style={{ fontSize: 11, color: '#9ca3af' }}>--</span>
  const up = change > 0
  return (
    <span style={{ fontSize: 11, fontWeight: 600, color: up ? '#ef4444' : '#10b981', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {up ? '↑' : '↓'} {Math.abs(change)}{suffix}
    </span>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.625rem 0.875rem', boxShadow: '0 4px 12px rgba(0,0,0,.08)', fontSize: 12 }}>
      <div style={{ color: '#6b7280', marginBottom: 4, fontWeight: 600 }}>{formatLabel(label)}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ color: '#374151' }}>{p.name}: <strong>{typeof p.value === 'number' && p.name?.toLowerCase().includes('time') ? formatDuration(p.value) : p.value}</strong></span>
        </div>
      ))}
    </div>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) return <span style={{ color: '#d1d5db', fontSize: 10, marginLeft: 2 }}>⇅</span>
  return <span style={{ color: ACCENT, fontSize: 10, marginLeft: 2 }}>{dir === 'asc' ? '↑' : '↓'}</span>
}

function exportCSV(data: AnalyticsData, from: string, to: string) {
  const lines: string[] = []

  lines.push('Axiora Advanced Analytics Report')
  lines.push(`Period: ${from} to ${to}`)
  lines.push('')

  lines.push('Overview')
  lines.push('Metric,Value,Previous,Change %')
  const o = data.overview
  const c = o.comparison
  lines.push(`Total Messages,${o.totalMessages},${c.messages.previous},${c.messages.change}%`)
  lines.push(`Total Conversations,${o.totalConversations},${c.conversations.previous},${c.conversations.change}%`)
  lines.push(`Total Tickets,${o.totalTickets},${c.tickets.previous},${c.tickets.change}%`)
  lines.push(`Resolution Rate,${o.resolutionRate}%,${c.resolutionRate.previous}%,${c.resolutionRate.change}pp`)
  lines.push(`Avg Response Time,${formatDuration(o.avgResponseTime)},${formatDuration(c.responseTime.previous)},${c.responseTime.change}%`)
  lines.push(`Avg First Reply,${formatDuration(o.avgFirstReplyTime)},,`)
  lines.push('')

  lines.push('Time Series')
  lines.push('Date,Messages,Conversations,Tickets,Avg Response Time (s)')
  data.timeseries.labels.forEach((l, i) => {
    lines.push(`${l},${data.timeseries.messages[i]},${data.timeseries.conversations[i]},${data.timeseries.tickets[i]},${data.timeseries.responseTime[i]}`)
  })
  lines.push('')

  lines.push('Agent Performance')
  lines.push('Agent,Conversations,Messages,Avg Response Time,Resolution Rate,Msgs/Conv')
  data.agentPerformance.forEach(a => {
    lines.push(`${a.name},${a.conversations},${a.messages},${formatDuration(a.avgResponseTime)},${Math.round(a.resolutionRate * 100)}%,${a.msgsPerConversation.toFixed(1)}`)
  })
  lines.push('')

  lines.push('Hourly Distribution')
  lines.push('Hour,Messages')
  data.hourlyDistribution.forEach((v, i) => {
    lines.push(`${String(i).padStart(2, '0')}:00,${v}`)
  })

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `axiora-analytics-${from}-${to}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function AnalyticsView({ hasAdvancedAnalytics, basicStats, t }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [preset, setPreset] = useState<string>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [sortCol, setSortCol] = useState<string>('messages')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const getDateRange = useCallback((): { from: string; to: string; period: string } => {
    const now = new Date()
    const to = now.toISOString().slice(0, 10)

    if (preset === 'custom' && customFrom && customTo) {
      const diffDays = (new Date(customTo).getTime() - new Date(customFrom).getTime()) / 86400000
      const period = diffDays > 180 ? 'month' : diffDays > 60 ? 'week' : 'day'
      return { from: customFrom, to: customTo, period }
    }

    const p = PRESETS.find(p => p.key === preset)
    const days = p?.days ?? 30
    if (days === 0) return { from: to, to, period: 'day' }
    const from = new Date(now)
    from.setDate(from.getDate() - days)
    const period = days > 180 ? 'month' : days > 60 ? 'week' : 'day'
    return { from: from.toISOString().slice(0, 10), to, period }
  }, [preset, customFrom, customTo])

  const fetchAnalytics = useCallback(async () => {
    if (!hasAdvancedAnalytics) { setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const { from, to, period } = getDateRange()
      const res = await fetch(`/api/analytics?from=${from}&to=${to}&period=${period}`)
      if (!res.ok) { setError('Failed to load analytics'); return }
      setData(await res.json())
    } catch { setError('Network error') } finally { setLoading(false) }
  }, [hasAdvancedAnalytics, getDateRange])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  function toggleSort(col: string) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  if (!hasAdvancedAnalytics) {
    const s = basicStats
    const basicKpis = [
      { label: t?.basicMsgToday || 'Messages today', value: s?.messagesToday ?? 0, color: '#7c3aed' },
      { label: t?.basicThisWeek || 'This week', value: s?.messagesThisWeek ?? 0, color: '#3b82f6' },
      { label: t?.basicAutoReplies || 'AI replies', value: s?.autoReplies ?? 0, color: '#10b981' },
      { label: t?.basicOpenConvs || 'Open conversations', value: s?.openConversations ?? 0, color: '#f59e0b' },
    ]
    const maxAgentMsgs = Math.max(...(s?.agentStats?.map(a => a.messages) ?? []), 1)

    return (
      <>
        {/* Real basic stats */}
        <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {basicKpis.map((kpi, i) => (
            <div key={i} className="stat-card card-hover" style={{ ...CARD }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.5rem', textTransform: 'uppercase', fontFamily: SANS }}>{kpi.label}</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        {/* Basic agent performance */}
        {s?.agentStats && s.agentStats.length > 0 && (
          <div style={{ ...CARD, marginBottom: '1.5rem' }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
              {t?.basicAgentPerf || 'Performance by agent'}
            </div>
            {s.agentStats.map((ag, i) => {
              const color = COLORS[i % COLORS.length]
              const pct = Math.round((ag.messages / maxAgentMsgs) * 100)
              return (
                <div key={ag.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: i < s.agentStats.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color }}>⬡</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: '#111', fontWeight: 500, marginBottom: 3 }}>{ag.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .3s' }} />
                      </div>
                      <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{pct}%</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{ag.conversations} convs · {ag.messages} msgs</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: '-0.02em' }}>{ag.messages}</div>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: MONO }}>MESSAGES</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Blurred advanced section with upgrade CTA */}
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ filter: 'blur(6px)', pointerEvents: 'none', opacity: 0.4 }}>
            <div style={{ ...CARD, height: 280, marginBottom: '1.25rem' }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ ...CARD, height: 220 }} />
              <div style={{ ...CARD, height: 220 }} />
            </div>
            <div style={{ ...CARD, height: 200 }} />
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '2rem 2.5rem', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,.08)', maxWidth: 400 }}>
              <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', marginBottom: '0.4rem', fontFamily: SANS }}>
                {t?.upgradeTitle || 'Advanced Analytics'}
              </div>
              <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: '1.25rem', fontFamily: SANS }}>
                {t?.upgradeDesc || 'Unlock detailed charts, response time metrics, agent comparisons, and CSV exports. Available on Pro and Enterprise plans.'}
              </div>
              <button style={{ background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, padding: '0.65rem 1.75rem', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: SANS, transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                {t?.upgradeCta || 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>
      </>
    )
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: '#9ca3af', gap: '0.75rem' }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${ACCENT}33`, borderTop: `2px solid ${ACCENT}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <span style={{ fontSize: 14, fontFamily: SANS }}>{t?.loading || 'Loading analytics...'}</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 0', color: '#9ca3af' }}>
        <div style={{ fontSize: 36, marginBottom: '0.75rem' }}>⚠</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>{error || 'No data available'}</div>
        <button onClick={fetchAnalytics} style={{ marginTop: '1rem', background: 'none', border: `1px solid #e5e7eb`, borderRadius: 6, padding: '0.4rem 1rem', fontSize: 13, cursor: 'pointer', color: '#6b7280', fontFamily: SANS }}>
          Retry
        </button>
      </div>
    )
  }

  const { from: currentFrom, to: currentTo } = getDateRange()
  const o = data.overview
  const comp = o.comparison
  const ts = data.timeseries

  const chartData = ts.labels.map((label, i) => ({
    name: formatLabel(label),
    messages: ts.messages[i],
    conversations: ts.conversations[i],
    tickets: ts.tickets[i],
    responseTime: ts.responseTime[i],
  }))

  const hourlyData = data.hourlyDistribution.map((v, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    messages: v,
  }))

  const priorityData = Object.entries(data.ticketAnalytics.byPriority).map(([name, value]) => ({ name, value }))
  const statusData = Object.entries(data.ticketAnalytics.byStatus).map(([name, value]) => ({ name: name.replace('_', ' '), value }))
  const sourceData = Object.entries(data.sourceDistribution).map(([name, value]) => ({ name, value }))

  const sortedAgents = [...data.agentPerformance].sort((a, b) => {
    const av = (a as any)[sortCol] ?? 0
    const bv = (b as any)[sortCol] ?? 0
    return sortDir === 'asc' ? av - bv : bv - av
  })

  const maxAgentMsgs = Math.max(...data.agentPerformance.map(a => a.messages), 1)

  const pillBtn = (active: boolean): React.CSSProperties => ({
    padding: '0.4rem 0.875rem', border: `1px solid ${active ? ACCENT + '44' : '#e5e7eb'}`,
    borderRadius: 6, background: active ? ACCENT + '0f' : '#fff', color: active ? ACCENT : '#6b7280',
    fontSize: 12, fontWeight: active ? 600 : 400, fontFamily: SANS, cursor: 'pointer', transition: 'all .15s',
  })

  const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }
  const thStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.625rem 0.75rem', textAlign: 'left', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', fontFamily: SANS, borderBottom: '1px solid #f3f4f6' }
  const tdStyle: React.CSSProperties = { fontSize: 13, color: '#374151', padding: '0.75rem', borderBottom: '1px solid #f9fafb', fontFamily: SANS }

  return (
    <>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {PRESETS.map(p => (
            <button key={p.key} onClick={() => setPreset(p.key)} style={pillBtn(preset === p.key)}>
              {t?.[`range_${p.key}`] || p.label}
            </button>
          ))}
          <button onClick={() => setPreset('custom')} style={pillBtn(preset === 'custom')}>
            {t?.rangeCustom || 'Custom'}
          </button>
          {preset === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginLeft: '0.25rem' }}>
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '0.35rem 0.625rem', fontSize: 12, color: '#374151', fontFamily: SANS, outline: 'none' }} />
              <span style={{ color: '#9ca3af', fontSize: 12 }}>→</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                style={{ border: '1px solid #d1d5db', borderRadius: 6, padding: '0.35rem 0.625rem', fontSize: 12, color: '#374151', fontFamily: SANS, outline: 'none' }} />
            </div>
          )}
        </div>
        <button onClick={() => exportCSV(data, currentFrom, currentTo)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.45rem 0.875rem', fontSize: 12, color: '#6b7280', cursor: 'pointer', fontFamily: SANS, fontWeight: 500, transition: 'border-color .15s' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#d1d5db')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e7eb')}>
          <span style={{ fontSize: 14 }}>↓</span> {t?.export || 'Export CSV'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: t?.totalMessages || 'Total messages', value: o.totalMessages, trend: comp.messages.change, color: '#7c3aed', sparkKey: 'messages' as const },
          { label: t?.activeConvs || 'Conversations', value: o.totalConversations, trend: comp.conversations.change, color: '#3b82f6', sparkKey: 'conversations' as const },
          { label: t?.avgResponse || 'Avg response time', value: formatDuration(o.avgResponseTime), trend: comp.responseTime.change, color: '#10b981', sparkKey: 'responseTime' as const, inverse: true },
          { label: t?.resolutionRate || 'Resolution rate', value: `${o.resolutionRate}%`, trend: comp.resolutionRate.change, color: '#f59e0b', sparkKey: 'messages' as const, suffix: 'pp' },
        ].map((kpi, i) => (
          <div key={i} className="stat-card card-hover" style={{ ...CARD }}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.5rem', textTransform: 'uppercase', fontFamily: SANS }}>{kpi.label}</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: kpi.color, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>{kpi.value}</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {kpi.inverse
                ? <TrendIndicatorInverse change={kpi.trend} suffix={kpi.suffix || '%'} />
                : <TrendIndicator change={kpi.trend} suffix={kpi.suffix || '%'} />}
              <span style={{ fontSize: 10, color: '#d1d5db', fontFamily: MONO }}>vs prev</span>
            </div>
            <div style={{ marginTop: '0.5rem', height: 36 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData.slice(-7)}>
                  <defs>
                    <linearGradient id={`g-kpi-${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={kpi.color} stopOpacity={0.15} />
                      <stop offset="100%" stopColor={kpi.color} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey={kpi.sparkKey} stroke={kpi.color} fill={`url(#g-kpi-${i})`} strokeWidth={1.5} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

      {/* Message & Conversation Volume Chart */}
      <div style={{ ...CARD, marginBottom: '1.25rem' }}>
        <div style={sectionTitle}>{t?.volumeChart || 'Message & conversation volume'}</div>
        <div style={{ height: 320 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gMessages" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gConversations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.12} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={40} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: SANS }} />
              <Area type="monotone" dataKey="messages" name="Messages" stroke="#7c3aed" fill="url(#gMessages)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#7c3aed' }} />
              <Area type="monotone" dataKey="conversations" name="Conversations" stroke="#3b82f6" fill="url(#gConversations)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Response Time + Hourly Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="grid-2-resp">
        <div style={CARD}>
          <div style={sectionTitle}>{t?.responseTimeChart || 'Average response time'}</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={40}
                  tickFormatter={(v: number) => v < 60 ? `${v}s` : `${Math.round(v / 60)}m`} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="responseTime" name="Avg Response Time" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={CARD}>
          <div style={sectionTitle}>{t?.hourlyChart || 'Hourly activity'}</div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} interval={2} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messages" name="Messages" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Agent Performance */}
      <div style={{ ...CARD, marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...sectionTitle }}>
          <span>{t?.agentPerformance || 'Agent performance'}</span>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: MONO }}>{data.agentPerformance.length} agents</span>
          </div>
        </div>
        {data.agentPerformance.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af', fontSize: 14 }}>{t?.noAgentData || 'No agent data for this period'}</div>
        ) : (
          <>
            <div style={{ height: 220, marginBottom: '1.25rem' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.agentPerformance} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: '#374151' }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12, fontFamily: SANS }} />
                  <Bar dataKey="messages" name="Messages" fill="#7c3aed" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="conversations" name="Conversations" fill="#3b82f6" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle} onClick={() => toggleSort('name')}>Agent <SortIcon active={sortCol === 'name'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('conversations')}>Convs <SortIcon active={sortCol === 'conversations'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('messages')}>Msgs <SortIcon active={sortCol === 'messages'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('avgResponseTime')}>Avg Response <SortIcon active={sortCol === 'avgResponseTime'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('resolutionRate')}>Resolution <SortIcon active={sortCol === 'resolutionRate'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => toggleSort('msgsPerConversation')}>Msgs/Conv <SortIcon active={sortCol === 'msgsPerConversation'} dir={sortDir} /></th>
                    <th style={{ ...thStyle, width: 100 }}>Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAgents.map((ag, idx) => {
                    const color = COLORS[idx % COLORS.length]
                    const pct = Math.round((ag.messages / maxAgentMsgs) * 100)
                    return (
                      <tr key={ag.id} style={{ transition: 'background .1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: 24, height: 24, borderRadius: 6, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color, flexShrink: 0 }}>⬡</div>
                            <span style={{ fontWeight: 500, color: '#111' }}>{ag.name}</span>
                          </div>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, fontSize: 13 }}>{ag.conversations}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, fontSize: 13, fontWeight: 600, color }}>{ag.messages}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, fontSize: 12 }}>{formatDuration(ag.avgResponseTime)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: ag.resolutionRate >= 0.8 ? '#f0fdf4' : ag.resolutionRate >= 0.5 ? '#fffbeb' : '#fef2f2', color: ag.resolutionRate >= 0.8 ? '#16a34a' : ag.resolutionRate >= 0.5 ? '#d97706' : '#dc2626' }}>
                            {Math.round(ag.resolutionRate * 100)}%
                          </span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontFamily: MONO, fontSize: 12 }}>{ag.msgsPerConversation.toFixed(1)}</td>
                        <td style={{ ...tdStyle }}>
                          <div style={{ height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .3s' }} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Tickets + Sources */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }} className="grid-2-resp">
        <div style={CARD}>
          <div style={sectionTitle}>{t?.ticketsByPriority || 'Tickets by priority'}</div>
          {priorityData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af', fontSize: 14 }}>{t?.noTicketData || 'No tickets in this period'}</div>
          ) : (
            <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" nameKey="name" label={(props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}
                    style={{ fontSize: 11, fontFamily: SANS }}>
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={['#ef4444', '#f59e0b', '#10b981', '#3b82f6'][i % 4]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          {data.ticketAnalytics.avgResolutionTime > 0 && (
            <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: 12, color: '#6b7280' }}>
              {t?.avgTicketResolution || 'Avg resolution time'}: <strong style={{ color: '#111' }}>{formatDuration(data.ticketAnalytics.avgResolutionTime)}</strong>
            </div>
          )}
        </div>

        <div style={CARD}>
          <div style={sectionTitle}>{t?.ticketsByStatus || 'Tickets by status'}</div>
          {statusData.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af', fontSize: 14 }}>{t?.noTicketData || 'No tickets in this period'}</div>
          ) : (
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={{ stroke: '#f3f4f6' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={['#ef4444', '#f59e0b', '#10b981', '#3b82f6'][i % 4]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Conversation Sources */}
      {sourceData.length > 0 && (
        <div style={{ ...CARD, marginBottom: '1.25rem' }}>
          <div style={sectionTitle}>{t?.convSources || 'Conversation sources'}</div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ width: 180, height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4} dataKey="value" nameKey="name">
                    {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {sourceData.map((s, i) => (
                <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: COLORS[i % COLORS.length] }} />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontSize: 12, color: '#9ca3af', fontFamily: MONO }}>{s.value}</span>
                  <span style={{ fontSize: 11, color: '#d1d5db' }}>
                    ({Math.round((s.value / sourceData.reduce((a, b) => a + b.value, 0)) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Summary footer */}
      <div style={{ textAlign: 'center', padding: '1rem 0', fontSize: 11, color: '#d1d5db', fontFamily: MONO }}>
        {t?.periodLabel || 'Period'}: {currentFrom} → {currentTo} · {t?.avgFirstReply || 'Avg first reply'}: {formatDuration(o.avgFirstReplyTime)} · {t?.avgResolution || 'Avg resolution'}: {formatDuration(o.avgResolutionTime)}
      </div>
    </>
  )
}
