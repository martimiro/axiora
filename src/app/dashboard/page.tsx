'use client'
import { useState, useEffect, useRef } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import AnalyticsView from '@/components/dashboard/AnalyticsView'

type Message = { role: string; content: string; createdAt: string }
type Conv = { id: string; status: string; updatedAt: string; createdAt: string; messages: Message[] }
type Agent = { id: string; name: string; description: string; prompt: string; conversations: Conv[] }
type Ticket = {
  id: string; title: string; description: string; status: string; priority: string
  agentId: string; conversationId: string | null; createdAt: string; updatedAt: string
  agent: { id: string; name: string }
  conversation?: { id: string; messages: Message[] } | null
}
type Stats = {
  totalAgents: number; totalConversations: number; totalMessages: number
  messagesToday: number; messagesThisWeek: number; autoReplies: number
  openConversations: number; totalTickets?: number; openTickets?: number; ticketsToday?: number
  agentStats: { id: string; name: string; conversations: number; messages: number }[]
  sparklines?: { messages: number[]; conversations: number[]; labels: string[] }
  yesterday?: { messages: number; conversations: number }
}
type PlanUsage = {
  agents: number; maxAgents: number | null
  emailsUsed: number; maxEmails: number | null
  emailsResetAt: string
}
type PlanFeatures = {
  integrations: string[]; fullDashboard: boolean
  advancedAnalytics: boolean; api: boolean; sla: boolean
}
type User = {
  id: string; name: string | null; email: string
  role: string; plan: string; usage: PlanUsage; features: PlanFeatures
}
type DashMessages = { dashboard: Record<string, string> }

const AGENT_TEMPLATES = {
  support: { name: 'Support Agent', description: 'Manages tickets and answers frequently asked questions', prompt: `You are a friendly and professional support agent. Your goal is to help customers resolve their issues clearly and concisely. Always respond in the same language as the customer. If you cannot resolve the problem, indicate that you will escalate it to a human agent.` },
  sales: { name: 'Sales Agent', description: 'Qualifies leads and schedules commercial meetings', prompt: `You are a professional sales agent. Your goal is to qualify leads, answer questions about products and services, and schedule meetings with the sales team. Be proactive but not invasive. Always respond in the same language as the customer.` },
  admin: { name: 'Admin Agent', description: 'Processes documents and updates databases', prompt: `You are an efficient administrative assistant. Your goal is to process administrative requests, extract information from documents and coordinate internal tasks. Be precise and methodical in your responses.` }
}

const AGENT_COLORS = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

function getAgentColor(id: string) {
  const sum = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AGENT_COLORS[sum % AGENT_COLORS.length]
}

function Sparkline({ data, color = '#7c3aed' }: { data: number[]; color?: string }) {
  const w = 80, h = 32
  const max = Math.max(...data, 1)
  const min = 0
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 4) - 2}`).join(' ')
  const area = `0,${h} ` + pts + ` ${w},${h}`
  return (
    <svg width={w} height={h} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={`g-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#g-${color.replace('#','')})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.length > 0 && (
        <circle
          cx={(((data.length - 1) / (data.length - 1)) * w)}
          cy={h - ((data[data.length - 1] - min) / range) * (h - 4) - 2}
          r="3" fill={color}
        />
      )}
    </svg>
  )
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return <span style={{ fontSize: 11, color: '#9ca3af' }}>—</span>
  if (previous === 0) return <span style={{ fontSize: 11, color: '#10b981', fontWeight: 500 }}>↑ Nou</span>
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span style={{ fontSize: 11, color: up ? '#10b981' : '#ef4444', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
      {up ? '↑' : '↓'} {Math.abs(pct)}% vs ahir
    </span>
  )
}

function SearchModal({ agents, onClose, onSelect }: { agents: Agent[]; onClose: () => void; onSelect: (view: string, data?: any) => void }) {
  const [q, setQ] = useState('')
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus() }, [])
  const allConvs = agents.flatMap(ag => ag.conversations.map(c => ({ ...c, agentName: ag.name, agentId: ag.id })))
  const results = q.length < 2 ? [] : [
    ...agents.filter(a => a.name.toLowerCase().includes(q.toLowerCase())).map(a => ({ type: 'agent', label: a.name, sub: a.description, data: a })),
    ...allConvs.filter(c => c.id.toLowerCase().includes(q.toLowerCase()) || c.messages[0]?.content?.toLowerCase().includes(q.toLowerCase())).slice(0, 5).map(c => ({ type: 'conv', label: `Conv #${c.id.slice(-6).toUpperCase()}`, sub: c.messages[0]?.content?.slice(0, 60) || '', data: c })),
  ]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '14vh', backdropFilter: 'blur(2px)' }} onClick={onClose}>
      <div className="search-modal-card" style={{ background: '#fff', borderRadius: 12, width: 560, boxShadow: '0 24px 64px rgba(0,0,0,.12)', overflow: 'hidden', border: '1px solid #e5e7eb' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 1rem', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 16, color: '#9ca3af', marginRight: '0.75rem' }}>🔍</span>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca agents, converses..." style={{ flex: 1, border: 'none', outline: 'none', padding: '1rem 0', fontSize: 15, color: '#111', background: 'transparent', fontFamily: "'Inter', sans-serif" }} />
          <kbd style={{ fontSize: 10, color: '#9ca3af', background: '#f3f4f6', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>ESC</kbd>
        </div>
        {results.length > 0 && (
          <div style={{ maxHeight: 320, overflowY: 'auto', padding: '0.5rem' }}>
            {results.map((r, i) => (
              <div key={i} onClick={() => { onSelect(r.type === 'agent' ? 'agents' : 'conversations', r.data); onClose() }}
                style={{ padding: '0.75rem 1rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: r.type === 'agent' ? '#7c3aed14' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                  {r.type === 'agent' ? '⬡' : '◌'}
                </div>
                <div>
                  <div style={{ fontSize: 14, color: '#111', fontWeight: 500 }}>{r.label}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{r.sub}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        {q.length >= 2 && results.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Sense resultats per "{q}"</div>}
        {q.length < 2 && <div style={{ padding: '1.5rem', color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Escriu almenys 2 caràcters per cercar</div>}
      </div>
    </div>
  )
}

function AppDialog({ title, message, type, variant = 'danger', onConfirm, onClose }: {
  title: string; message: string; type: 'confirm' | 'alert'; variant?: 'danger' | 'warning' | 'info'
  onConfirm?: () => void; onClose: () => void
}) {
  const colors = { danger: { accent: '#ef4444', bg: '#fef2f2', border: '#fecaca', icon: '⚠' }, warning: { accent: '#f59e0b', bg: '#fffbeb', border: '#fde68a', icon: '⚠' }, info: { accent: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', icon: 'ℹ' } }
  const c = colors[variant]
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(3px)', animation: 'fadeIn .15s ease' }} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 14, width: 420, maxWidth: '90vw', boxShadow: '0 24px 64px rgba(0,0,0,.16)', overflow: 'hidden', animation: 'fadeIn .2s ease' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '1.5rem 1.5rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: c.bg, border: `1px solid ${c.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: c.accent, flexShrink: 0 }}>{c.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 6 }}>{title}</div>
              <div style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>{message}</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.625rem', padding: '1.25rem 1.5rem', marginTop: '0.5rem' }}>
          {type === 'confirm' ? (
            <>
              <button onClick={onClose} style={{ background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, padding: '0.55rem 1.25rem', fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer', fontWeight: 500, transition: 'background .1s' }} onMouseEnter={e => (e.currentTarget.style.background = '#f9fafb')} onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>Cancelar</button>
              <button onClick={() => { onConfirm?.(); onClose() }} style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0.55rem 1.25rem', fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer', fontWeight: 600, transition: 'opacity .15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>Confirmar</button>
            </>
          ) : (
            <button onClick={onClose} style={{ background: c.accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0.55rem 1.25rem', fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer', fontWeight: 600, transition: 'opacity .15s' }} onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')} onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>Entendido</button>
          )}
        </div>
      </div>
    </div>
  )
}

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'ara mateix'
  if (diff < 3600) return `fa ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `fa ${Math.floor(diff / 3600)}h`
  return `fa ${Math.floor(diff / 86400)}d`
}

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [activeConv, setActiveConv] = useState<Conv | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [gmailResult, setGmailResult] = useState<string | null>(null)
  const [autoReply, setAutoReply] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [view, setView] = useState<'dashboard' | 'stats' | 'conversations' | 'agents' | 'new-agent' | 'edit-agent' | 'calendar' | 'tickets' | 'account'>('dashboard')
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [ticketFilter, setTicketFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [calendarConnected, setCalendarConnected] = useState(false)
  const [newAgent, setNewAgent] = useState({ name: '', description: '', prompt: '', type: 'support' })
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [m, setM] = useState<DashMessages | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string }[]>([])
  const [showNotif, setShowNotif] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dialog, setDialog] = useState<{ type: 'confirm' | 'alert'; title: string; message: string; onConfirm?: () => void; variant?: 'danger' | 'warning' | 'info' } | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData(); fetchConfig(); fetchStats(); fetchUser(); fetchCalendar(); fetchTickets()
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../../messages/${locale}.json`).then(mod => setM(mod.default))
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotif(false); setShowUserMenu(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.cookie.includes('token=')) { fetchStats(); fetchData(); fetchTickets() }
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!autoReply) return
    const poll = async () => {
      try {
        const res = await fetch('/api/gmail/auto-process', { method: 'POST' })
        if (!res.ok) return
        const data = await res.json()
        if (data.processed > 0) {
          fetchData(); fetchStats()
          setNotifications(prev => [{ id: Date.now().toString(), text: `Auto-replied to ${data.processed} email${data.processed !== 1 ? 's' : ''}`, time: new Date().toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 10))
        }
      } catch {}
    }
    poll()
    const interval = setInterval(poll, 60000)
    return () => clearInterval(interval)
  }, [autoReply])

  const t = m?.dashboard

  async function fetchUser() {
    const res = await fetch('/api/me')
    if (res.ok) { const data = await res.json(); setUser(data) }
  }

  async function fetchCalendar() {
    try {
      const res = await fetch('/api/calendar/events')
      if (res.ok) { const data = await res.json(); setCalendarEvents(Array.isArray(data) ? data : []); setCalendarConnected(true) }
    } catch (e) { setCalendarConnected(false) }
  }

  async function fetchData() {
    const res = await fetch('/api/conversations')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) { setAgents(data); if (data.length > 0 && !activeAgentId) setActiveAgentId(data[0].id) }
  }

  async function fetchStats() {
    const res = await fetch('/api/stats')
    if (!res.ok) return
    const data = await res.json()
    setStats(data)
  }

  async function fetchConfig() {
    const res = await fetch('/api/config')
    if (!res.ok) return
    const data = await res.json()
    setAutoReply(data.autoReply)
  }

  async function fetchTickets() {
    try {
      const res = await fetch('/api/tickets')
      if (res.ok) { const data = await res.json(); setTickets(Array.isArray(data) ? data : []) }
    } catch {}
  }

  async function updateTicketStatus(ticketId: string, status: string) {
    await fetch(`/api/tickets/${ticketId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    await fetchTickets(); await fetchStats()
  }

  function deleteTicket(ticketId: string) {
    setDialog({
      type: 'confirm', variant: 'danger',
      title: '¿Eliminar este ticket?',
      message: 'El ticket será eliminado permanentemente. Esta acción no se puede deshacer.',
      onConfirm: async () => {
        await fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' })
        await fetchTickets(); await fetchStats()
      },
    })
  }

  async function toggleAutoReply() {
    const newValue = !autoReply; setAutoReply(newValue)
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoReply: newValue }) })
  }

  async function createAgent() {
    if (!newAgent.name || !newAgent.prompt) return
    setCreating(true)
    try {
      const res = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAgent) })
      const data = await res.json()
      if (res.status === 403) {
        setDialog({
          type: 'alert', variant: 'warning',
          title: 'Límite del plan alcanzado',
          message: data.error || 'Has alcanzado el número máximo de agentes de tu plan. Actualiza tu plan para añadir más agentes.',
        })
        return
      }
      if (data.id) { await fetchData(); await fetchStats(); await fetchUser(); setView('agents'); setNewAgent({ name: '', description: '', prompt: '', type: 'support' }) }
    } finally { setCreating(false) }
  }

  async function saveAgent() {
    if (!editingAgent) return; setSaving(true)
    try {
      await fetch(`/api/agents/${editingAgent.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editingAgent.name, description: editingAgent.description, prompt: editingAgent.prompt }) })
      await fetchData(); setView('agents'); setEditingAgent(null)
    } finally { setSaving(false) }
  }

  function deleteAgent(id: string) {
    setDialog({
      type: 'confirm', variant: 'danger',
      title: t?.confirmDelete || '¿Eliminar este agente?',
      message: 'Esta acción eliminará el agente y todas sus conversaciones asociadas. No se puede deshacer.',
      onConfirm: async () => {
        await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
        await fetchData(); await fetchStats()
      },
    })
  }

  async function closeConversation(convId: string) {
    await fetch(`/api/conversations/${convId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'resolved' }) })
    if (activeConv?.id === convId) setActiveConv({ ...activeConv, status: 'resolved' })
    await fetchData(); await fetchStats()
  }

  async function reopenConversation(convId: string) {
    await fetch(`/api/conversations/${convId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'open' }) })
    if (activeConv?.id === convId) setActiveConv({ ...activeConv, status: 'open' })
    await fetchData(); await fetchStats()
  }

  async function sendMessage() {
    if (!input.trim() || loading || !activeAgentId) return
    const userMsg = input.trim(); setInput(''); setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: activeAgentId, message: userMsg }) })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, createdAt: new Date().toISOString() }])
        setNotifications(prev => [{ id: Date.now().toString(), text: `Agent: ${data.reply.slice(0, 50)}...`, time: new Date().toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }) }, ...prev].slice(0, 10))
        fetchData(); fetchStats()
      }
    } finally { setLoading(false) }
  }

  async function processEmails(agentId: string) {
    setProcessing(true); setGmailResult(null)
    try {
      const res = await fetch('/api/gmail/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId }) })
      const data = await res.json()
      setGmailResult(data.error ? 'Error: ' + data.error : `Processats ${data.processed} emails nous`)
      if (!data.error) { fetchData(); fetchStats() }
    } finally { setProcessing(false) }
  }

  function copyWidgetCode(agentId: string) {
    const code = `<script>\n  window.AxioraConfig = {\n    agentId: '${agentId}',\n    apiUrl: 'https://calm-smakager-26cab8.netlify.app'\n  }\n</script>\n<script src="https://calm-smakager-26cab8.netlify.app/widget.js"></script>`
    navigator.clipboard.writeText(code); setCopiedId(agentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function handleSearchSelect(viewName: string, data?: any) {
    setView(viewName as any)
    if (viewName === 'conversations' && data) { setActiveConv(data); setMessages(data.messages?.slice().reverse() || []) }
  }

  const allConvs = (Array.isArray(agents) ? agents : []).flatMap(ag => ag.conversations.map(c => ({ ...c, agentName: ag.name, agentId: ag.id })))
  const filteredConvs = allConvs.filter(c => filterStatus === 'all' ? true : c.status === filterStatus)

  const hasFullDashboard = user?.features?.fullDashboard ?? false

  const sparkData = stats?.sparklines?.messages || [0, 0, 0, 0, 0, 0, stats?.messagesToday || 0]
  const sparkConvData = stats?.sparklines?.conversations || [0, 0, 0, 0, 0, 0, 0]

  const navItems = hasFullDashboard ? [
    { key: 'dashboard', label: t?.panel || 'Overview', icon: '⊞' },
    { key: 'stats', label: t?.stats || 'Analytics', icon: '↗' },
    { key: 'conversations', label: t?.conversations || 'Conversations', icon: '◌' },
    { key: 'agents', label: t?.agents || 'Agents', icon: '⬡' },
    { key: 'tickets', label: 'Tickets', icon: '⚑' },
    { key: 'calendar', label: 'Calendar', icon: '📅' },
  ] : [
    { key: 'dashboard', label: t?.panel || 'Overview', icon: '⊞' },
    { key: 'conversations', label: t?.conversations || 'Conversations', icon: '◌' },
    { key: 'agents', label: t?.agents || 'Agents', icon: '⬡' },
  ]

  const filteredTickets = tickets.filter(tk => ticketFilter === 'all' ? true : tk.status === ticketFilter)

  const pageTitle: Record<string, string> = {
    dashboard: 'Overview', stats: 'Analytics', conversations: 'Conversations',
    tickets: 'Tickets', agents: 'Agents', 'new-agent': 'New agent', 'edit-agent': 'Edit agent',
    account: 'Account',
  }

  const breadcrumb: Record<string, string[]> = {
    dashboard: ['Overview'], stats: ['Analytics'], conversations: ['Conversations'],
    tickets: ['Tickets'], agents: ['Agents'], 'new-agent': ['Agents', 'New agent'], 'edit-agent': ['Agents', 'Edit agent'],
    account: ['Account'],
  }

  const isActive = (key: string) => view === key || (view === 'new-agent' && key === 'agents') || (view === 'edit-agent' && key === 'agents')
  const unread = notifications.length

  const sans = "'Inter', sans-serif"
  const mono = "'IBM Plex Mono', monospace"
  const accent = '#7c3aed'
  const card: any = { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1.25rem 1.5rem' }
  const inputStyle: any = { width: '100%', background: '#fff', border: '1px solid #d1d5db', borderRadius: 6, padding: '0.65rem 0.875rem', color: '#111', fontSize: 14, fontFamily: sans, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s, box-shadow .15s' }
  const textareaStyle: any = { ...inputStyle, resize: 'vertical' as any, minHeight: 140, lineHeight: 1.6 }
  const labelStyle: any = { fontSize: 13, color: '#374151', marginBottom: '0.4rem', display: 'block', fontWeight: 500 }
  const btnPrimary: any = { background: accent, color: '#fff', border: 'none', borderRadius: 6, padding: '0.6rem 1.25rem', fontSize: 14, fontFamily: sans, fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s' }
  const btnSecondary: any = { background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, padding: '0.6rem 1.25rem', fontSize: 14, fontFamily: sans, cursor: 'pointer', transition: 'background .1s' }
  const btnOutline: any = { background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.4rem 0.875rem', fontSize: 13, fontFamily: sans, cursor: 'pointer' }
  const btnDanger: any = { ...btnOutline, color: '#ef4444', borderColor: '#fecaca' }
  const badge = (status: string): any => ({ fontSize: 11, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: status === 'open' ? '#f0fdf4' : '#f9fafb', color: status === 'open' ? '#16a34a' : '#6b7280', border: `1px solid ${status === 'open' ? '#bbf7d0' : '#e5e7eb'}`, fontFamily: sans })

  const userInitials = user?.name ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() || 'AX'
  const userName = user?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f6f7f8', color: '#111', fontFamily: sans, fontSize: 14 }}>

      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .view-enter{animation:fadeIn .2s ease forwards}
        .blink{animation:blink 1s infinite}
        .nav-item:hover{background:#f3f4f6!important}
        .card-hover{transition:box-shadow .15s,border-color .15s}
        .card-hover:hover{box-shadow:0 4px 16px rgba(0,0,0,.07)!important;border-color:#d1d5db!important}
        .conv-row:hover{background:#f9fafb!important}
        .btn-primary:hover{opacity:.88!important}
        .btn-secondary:hover{background:#f9fafb!important}
        .btn-outline:hover{background:#f9fafb!important}
        input:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px rgba(124,58,237,.1)!important;outline:none!important}
        .notif-panel{animation:slideDown .15s ease}
        .stat-card{animation:fadeIn .35s ease forwards;opacity:0}
        .stat-card:nth-child(2){animation-delay:.07s}
        .stat-card:nth-child(3){animation-delay:.14s}
        .stat-card:nth-child(4){animation-delay:.21s}
        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:2px}
        .progress-bar{transition:width .6s ease}
      `}</style>

      {showSearch && <SearchModal agents={agents} onClose={() => setShowSearch(false)} onSelect={handleSearchSelect} />}
      {dialog && <AppDialog {...dialog} onClose={() => setDialog(null)} />}

      <div className={`dash-overlay${sidebarOpen ? ' open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`dash-sidebar${sidebarOpen ? ' open' : ''}`} style={{ width: 232, borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', background: '#fff', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, fontFamily: mono }}>AX</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#111', letterSpacing: '-0.01em' }}>Axiora</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>Dashboard</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem' }}>
          <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', padding: '0.5rem 0.875rem 0.25rem', fontFamily: mono }}>MAIN</div>
          {navItems.map(item => (
            <div key={item.key} className="nav-item" onClick={() => { setView(item.key as any); setSidebarOpen(false) }}
              style={{ padding: '0.6rem 0.875rem', cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8, color: isActive(item.key) ? accent : '#6b7280', background: isActive(item.key) ? '#7c3aed0f' : 'transparent', fontWeight: isActive(item.key) ? 600 : 400, fontSize: 14, marginBottom: 1, transition: 'all .1s' }}>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{item.icon}</span>
              {item.label}
              {item.key === 'conversations' && (stats?.openConversations ?? 0) > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: accent, color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>{stats?.openConversations}</span>
              )}
              {item.key === 'tickets' && (stats?.openTickets ?? 0) > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>{stats?.openTickets}</span>
              )}
            </div>
          ))}

          {!hasFullDashboard && (
            <div style={{ marginTop: '0.75rem', padding: '0 0.875rem' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.08em', padding: '0.5rem 0 0.25rem', fontFamily: mono }}>PRO FEATURES</div>
              {[
                { label: 'Analytics', icon: '↗' },
                { label: 'Tickets', icon: '⚑' },
                { label: 'Calendar', icon: '📅' },
              ].map(item => (
                <div key={item.label} className="nav-item" onClick={() => { setView('account'); setSidebarOpen(false) }}
                  style={{ padding: '0.6rem 0.875rem', cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8, color: '#d1d5db', fontSize: 14, marginBottom: 1, transition: 'all .1s' }}>
                  <span style={{ fontSize: 13, opacity: 0.5 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: 9, background: '#f3f4f6', color: '#9ca3af', padding: '1px 6px', borderRadius: 4, fontWeight: 600, letterSpacing: '0.04em' }}>PRO</span>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* User profile */}
        <div style={{ padding: '0.875rem', borderTop: '1px solid #f3f4f6' }}>
          {!hasFullDashboard && (
            <button className="btn-primary" onClick={() => { setView('account'); setSidebarOpen(false) }}
              style={{ width: '100%', background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0.6rem', fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: '0.625rem', fontFamily: sans, transition: 'opacity .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.375rem' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              ↗ Upgrade to Pro
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0.75rem', borderRadius: 8, background: '#f9fafb', marginBottom: '0.625rem' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {userInitials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: (user?.role === 'admin' ? '#dc2626' : user?.plan === 'pro' ? accent : user?.plan === 'enterprise' ? '#f59e0b' : '#3b82f6'), background: (user?.role === 'admin' ? '#dc262614' : user?.plan === 'pro' ? '#7c3aed14' : user?.plan === 'enterprise' ? '#f59e0b14' : '#3b82f614'), padding: '1px 5px', borderRadius: 4, textTransform: 'uppercase' as any, flexShrink: 0 }}>{user?.role === 'admin' ? 'ADMIN' : user?.plan || 'basic'}</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || ''}</div>
            </div>
          </div>
          <LocaleSwitcher />
          <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login') }}
            style={{ ...btnOutline, width: '100%', marginTop: '0.5rem', fontSize: 12, textAlign: 'center' }}>
            {t?.logout || 'Sign out'}
          </button>
          <div style={{ fontSize: 10, color: '#d1d5db', marginTop: '0.5rem', fontFamily: mono, textAlign: 'center' }}>v0.1.0-alpha</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Topbar */}
        <div className="dash-topbar" style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0.875rem 1.75rem', display: 'flex', alignItems: 'center', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 }}>
          <button className="dash-hamburger" onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, color: '#374151' }}>☰</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1 }}>
            {(breadcrumb[view] || ['Overview']).map((crumb, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: 14, color: i === arr.length - 1 ? '#111' : '#9ca3af', fontWeight: i === arr.length - 1 ? 600 : 400, cursor: i < arr.length - 1 ? 'pointer' : 'default' }}
                  onClick={() => i < arr.length - 1 && setView('agents')}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <span style={{ color: '#d1d5db' }}>/</span>}
              </span>
            ))}
          </div>

          <button onClick={() => setShowSearch(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 6, padding: '0.45rem 0.875rem', color: '#9ca3af', fontSize: 13, cursor: 'pointer', fontFamily: sans, transition: 'border-color .15s' }}>
            <span>🔍</span><span>Cerca...</span>
            <kbd className="dash-topbar-search-kbd" style={{ fontSize: 10, background: '#e5e7eb', padding: '1px 5px', borderRadius: 3, fontFamily: mono, color: '#6b7280' }}>⌘K</kbd>
          </button>

          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotif(!showNotif)}
              style={{ width: 36, height: 36, borderRadius: 8, background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', transition: 'background .1s' }}>
              <span style={{ fontSize: 16 }}>🔔</span>
              {unread > 0 && <span style={{ position: 'absolute', top: -3, right: -3, width: 16, height: 16, borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '2px solid #fff' }}>{unread > 9 ? '9+' : unread}</span>}
            </button>
            {showNotif && (
              <div className="notif-panel" style={{ position: 'absolute', right: 0, top: '110%', width: 320, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Notificacions</span>
                  {unread > 0 && <button onClick={() => setNotifications([])} style={{ fontSize: 11, color: accent, background: 'none', border: 'none', cursor: 'pointer' }}>Netejar tot</button>}
                </div>
                {notifications.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: '0.5rem' }}>🔔</div>
                    Sense notificacions
                  </div>
                ) : notifications.map(n => (
                  <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #f9fafb', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#374151' }}>{n.text}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{n.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <button onClick={() => { setShowUserMenu(!showUserMenu); setShowNotif(false) }}
              className="dash-topbar-user" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', borderRadius: 8, transition: 'background .1s' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                {userInitials}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' as any }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111', lineHeight: 1.2 }}>{userName}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.2 }}>{user?.role === 'admin' ? 'Admin' : (user?.plan || 'basic').charAt(0).toUpperCase() + (user?.plan || 'basic').slice(1)}</span>
              </div>
              <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 2, transition: 'transform .15s', transform: showUserMenu ? 'rotate(180deg)' : 'none' }}>▾</span>
            </button>
            {showUserMenu && (
              <div className="notif-panel" style={{ position: 'absolute', right: 0, top: '110%', width: 220, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,.1)', zIndex: 50, overflow: 'hidden' }}>
                <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {userInitials}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                  </div>
                </div>
                <div style={{ padding: '0.375rem' }}>
                  <button onClick={() => { setView('account'); setShowUserMenu(false); setSidebarOpen(false) }}
                    className="nav-item" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.55rem 0.75rem', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: sans, textAlign: 'left' as any, transition: 'background .1s' }}>
                    <span style={{ fontSize: 14, opacity: 0.7 }}>⊙</span> Account
                  </button>
                  <button onClick={() => { fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login') }}
                    className="nav-item" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.55rem 0.75rem', background: 'none', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, color: '#ef4444', fontFamily: sans, textAlign: 'left' as any, transition: 'background .1s' }}>
                    <span style={{ fontSize: 14, opacity: 0.7 }}>↗</span> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '1.75rem' }} key={view} className="view-enter dash-content">

          {/* BASIC OVERVIEW — shown to users on the Basic plan */}
          {view === 'dashboard' && !hasFullDashboard && (
            <>
              {/* Welcome */}
              <div style={{ ...card, marginBottom: '1.25rem', background: 'linear-gradient(135deg, #7c3aed06, #3b82f604)', border: '1px solid #7c3aed22' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: '0.375rem', letterSpacing: '-0.01em' }}>
                      Welcome back, {userName}
                    </div>
                    <div style={{ fontSize: 14, color: '#6b7280' }}>Here&apos;s what&apos;s happening with your agents today.</div>
                  </div>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}>
                    {userInitials}
                  </div>
                </div>
              </div>

              {/* Getting Started */}
              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Getting started</span>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>
                    {[(stats?.totalAgents ?? 0) > 0, autoReply, (stats?.totalConversations ?? 0) > 0].filter(Boolean).length}/3 complete
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '0.625rem' }}>
                  {[
                    { step: 1, title: 'Create your first agent', desc: 'Set up an AI agent to handle your emails automatically', done: (stats?.totalAgents ?? 0) > 0, action: () => setView('new-agent') },
                    { step: 2, title: 'Connect Gmail', desc: 'Link your inbox so the agent can process emails', done: autoReply, action: () => { if (agents[0]) window.location.href = '/api/gmail/auth'; else setView('new-agent') } },
                    { step: 3, title: 'See your first conversation', desc: 'Watch the agent respond to incoming messages', done: (stats?.totalConversations ?? 0) > 0, action: () => setView('conversations') },
                  ].map(item => (
                    <div key={item.step} onClick={!item.done ? item.action : undefined}
                      style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 1rem', borderRadius: 8, border: `1px solid ${item.done ? '#bbf7d0' : '#e5e7eb'}`, background: item.done ? '#f0fdf408' : '#fff', cursor: item.done ? 'default' : 'pointer', transition: 'all .15s' }}
                      onMouseEnter={e => { if (!item.done) e.currentTarget.style.borderColor = '#7c3aed44' }}
                      onMouseLeave={e => { if (!item.done) e.currentTarget.style.borderColor = item.done ? '#bbf7d0' : '#e5e7eb' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: item.done ? '#f0fdf4' : '#f9fafb', border: `1.5px solid ${item.done ? '#86efac' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: item.done ? '#16a34a' : '#9ca3af', flexShrink: 0 }}>
                        {item.done ? '✓' : item.step}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: item.done ? '#16a34a' : '#111', marginBottom: 2 }}>{item.title}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.desc}</div>
                      </div>
                      {!item.done && <span style={{ fontSize: 16, color: '#d1d5db', fontWeight: 300 }}>→</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Active agents', value: stats?.totalAgents ?? 0, icon: '⬡', color: '#7c3aed', limit: `/ ${user?.usage?.maxAgents ?? 1}` },
                  { label: 'Conversations', value: stats?.totalConversations ?? 0, icon: '◌', color: '#3b82f6', sub: `${stats?.openConversations ?? 0} open` },
                  { label: 'Messages today', value: stats?.messagesToday ?? 0, icon: '✉', color: '#10b981', sub: `${stats?.messagesThisWeek ?? 0} this week` },
                ].map((item, i) => (
                  <div key={i} className="stat-card card-hover" style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as any }}>{item.label}</div>
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: item.color }}>
                        {item.icon}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem' }}>
                      <span style={{ fontSize: 36, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>{item.value}</span>
                      {item.limit && <span style={{ fontSize: 14, color: '#d1d5db' }}>{item.limit}</span>}
                    </div>
                    {item.sub && <div style={{ fontSize: 12, color: '#9ca3af', marginTop: '0.375rem' }}>{item.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Recent Conversations */}
              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Recent conversations</span>
                  {allConvs.length > 0 && <button className="btn-outline" style={btnOutline} onClick={() => setView('conversations')}>View all →</button>}
                </div>
                {allConvs.slice(0, 4).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 36, marginBottom: '0.75rem', opacity: 0.4 }}>✉️</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No conversations yet</div>
                    <div style={{ fontSize: 13, marginTop: '0.25rem' }}>Create an agent and connect Gmail to get started</div>
                  </div>
                ) : allConvs.slice(0, 4).map(c => {
                  const color = getAgentColor((c as any).agentId || '')
                  return (
                    <div key={c.id} className="conv-row" onClick={() => { setView('conversations'); setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}
                      style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem', borderRadius: 6, transition: 'background .1s', margin: '0 -0.5rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color }}>◌</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages[0]?.content?.slice(0, 60) || '—'}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{(c as any).agentName} · {timeAgo(c.updatedAt || c.createdAt)}</div>
                      </div>
                      <span style={badge(c.status)}>{c.status}</span>
                    </div>
                  )
                })}
              </div>

              {/* Your Agent */}
              {agents.length > 0 && (
                <div style={{ ...card, marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Your agent</span>
                    <button className="btn-outline" style={btnOutline} onClick={() => setView('agents')}>Manage →</button>
                  </div>
                  {(() => {
                    const ag = agents[0]
                    const color = getAgentColor(ag.id)
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0, color }}>⬡</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 3 }}>{ag.name}</div>
                          <div style={{ fontSize: 13, color: '#6b7280' }}>{ag.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{ag.conversations.length} conversations</span>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>·</span>
                            <span style={{ fontSize: 12, color: '#9ca3af' }}>{ag.conversations.reduce((sum, c) => sum + c.messages.length, 0)} messages</span>
                          </div>
                        </div>
                        <span style={badge('open')}>Active</span>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Plan Usage */}
              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>Plan usage</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Agents</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{user?.usage?.agents ?? 0} / {user?.usage?.maxAgents ?? 1}</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ height: '100%', width: `${user?.usage?.maxAgents ? Math.min(((user?.usage?.agents ?? 0) / user.usage.maxAgents) * 100, 100) : 0}%`, background: (user?.usage?.agents ?? 0) >= (user?.usage?.maxAgents ?? 1) ? '#ef4444' : accent, borderRadius: 3 }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: 13, color: '#6b7280' }}>Emails this month</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{(user?.usage?.emailsUsed ?? 0).toLocaleString()} / {(user?.usage?.maxEmails ?? 500).toLocaleString()}</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ height: '100%', width: `${user?.usage?.maxEmails ? Math.min(((user?.usage?.emailsUsed ?? 0) / user.usage.maxEmails) * 100, 100) : 0}%`, background: (user?.usage?.emailsUsed ?? 0) >= (user?.usage?.maxEmails ?? 500) * 0.8 ? '#f59e0b' : '#10b981', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upgrade Banner */}
              <div style={{ ...card, background: 'linear-gradient(135deg, #7c3aed08, #3b82f608)', border: '1px solid #7c3aed22', padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#111', marginBottom: '0.5rem' }}>Unlock the full dashboard</div>
                    <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>
                      Upgrade to Pro for up to 5 agents, 5,000 emails/month, advanced analytics, ticket management, calendar integration, and priority support.
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as any, marginBottom: '1.25rem' }}>
                      {['Advanced Analytics', 'Ticket Management', 'Calendar Integration', 'Slack Integration', '5 Agents'].map((f, i) => (
                        <span key={i} style={{ fontSize: 11, color: accent, background: '#7c3aed0a', border: '1px solid #7c3aed22', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>{f}</span>
                      ))}
                    </div>
                    <button className="btn-primary" style={btnPrimary} onClick={() => setView('account')}>View upgrade options →</button>
                  </div>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: 'linear-gradient(135deg, #7c3aed18, #3b82f618)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, flexShrink: 0 }}>
                    🚀
                  </div>
                </div>
              </div>
            </>
          )}

          {/* FULL OVERVIEW — shown to Pro, Enterprise, and Admin users */}
          {view === 'dashboard' && hasFullDashboard && (
            <>
              {/* Welcome + Plan Banner */}
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ ...card, flex: 1, background: 'linear-gradient(135deg, #7c3aed06, #3b82f604)', border: '1px solid #7c3aed22' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#111', marginBottom: '0.25rem', letterSpacing: '-0.01em' }}>
                        Welcome back, {userName}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280' }}>Here&apos;s your operations overview for today.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ textAlign: 'right' as any }}>
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: user?.role === 'admin' ? '#dc2626' : user?.plan === 'enterprise' ? '#f59e0b' : accent, textTransform: 'uppercase' as any }}>{user?.role === 'admin' ? 'Admin' : user?.plan || 'pro'} plan</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{user?.usage?.agents ?? 0} / {user?.usage?.maxAgents === null ? '∞' : user?.usage?.maxAgents ?? 5} agents</div>
                      </div>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, #a78bfa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, flexShrink: 0, boxShadow: '0 4px 12px rgba(124,58,237,0.25)' }}>
                        {userInitials}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Active agents', value: stats?.totalAgents ?? 0, icon: '⬡', color: '#7c3aed' },
                  { label: 'Open conversations', value: stats?.openConversations ?? 0, icon: '◌', color: '#3b82f6' },
                  { label: 'Messages today', value: stats?.messagesToday ?? 0, icon: '✉', color: '#10b981' },
                  { label: 'Open tickets', value: stats?.openTickets ?? 0, icon: '⚑', color: tickets.filter(tk => tk.priority === 'high' && tk.status === 'open').length > 0 ? '#ef4444' : '#f59e0b' },
                ].map((item, i) => (
                  <div key={i} className="stat-card card-hover" style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as any }}>{item.label}</div>
                      <div style={{ width: 24, height: 24, borderRadius: 6, background: `${item.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: item.color }}>{item.icon}</div>
                    </div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', lineHeight: 1 }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* Sparkline Stats */}
              <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Active agents', value: stats?.totalAgents ?? 0, spark: sparkData, color: '#7c3aed', today: stats?.totalAgents ?? 0, yesterday: stats?.totalAgents ?? 0 },
                  { label: 'Open conversations', value: stats?.openConversations ?? 0, spark: sparkConvData, color: '#3b82f6', today: stats?.openConversations ?? 0, yesterday: stats?.yesterday?.conversations ?? 0 },
                  { label: 'Messages today', value: stats?.messagesToday ?? 0, spark: sparkData, color: '#10b981', today: stats?.messagesToday ?? 0, yesterday: stats?.yesterday?.messages ?? 0 },
                ].map((item, i) => (
                  <div key={i} className="card-hover" style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.6rem', textTransform: 'uppercase' as any }}>{item.label}</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: '0.4rem' }}>{item.value}</div>
                      <TrendBadge current={item.today} previous={item.yesterday} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <Sparkline data={item.spark} color={item.color} />
                      <span style={{ fontSize: 10, color: '#d1d5db', fontFamily: mono }}>7d</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Recent activity</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: '0.5rem' }}>{allConvs.filter(c => c.status === 'open').length} open</span>
                  </div>
                  <button className="btn-outline" style={btnOutline} onClick={() => setView('conversations')}>View all →</button>
                </div>
                {allConvs.filter(c => c.status === 'open').slice(0, 6).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 36, marginBottom: '0.75rem', opacity: 0.5 }}>✉️</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No open conversations</div>
                    <div style={{ fontSize: 13, marginTop: '0.25rem' }}>All caught up!</div>
                  </div>
                ) : allConvs.filter(c => c.status === 'open').slice(0, 6).map(c => {
                  const color = getAgentColor((c as any).agentId || '')
                  return (
                    <div key={c.id} className="conv-row" onClick={() => { setView('conversations'); setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}
                      style={{ padding: '0.875rem 0.5rem', borderBottom: '1px solid #f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem', borderRadius: 6, transition: 'background .1s', margin: '0 -0.5rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, color }}>◌</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2, fontWeight: 500 }}>{(c as any).agentName}</div>
                        <div style={{ fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages[0]?.content?.slice(0, 70) || '—'}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={badge(c.status)}>{c.status}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(c.updatedAt || c.createdAt)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div style={{ ...card, marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 600, color: '#111' }}>Open tickets</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: '0.5rem' }}>{tickets.filter(tk => tk.status !== 'resolved').length} pending</span>
                  </div>
                  <button className="btn-outline" style={btnOutline} onClick={() => setView('tickets')}>View all →</button>
                </div>
                {tickets.filter(tk => tk.status !== 'resolved').slice(0, 4).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 28, marginBottom: '0.5rem', opacity: 0.5 }}>⚑</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No pending tickets</div>
                    <div style={{ fontSize: 13, marginTop: '0.25rem' }}>Agents are handling everything!</div>
                  </div>
                ) : tickets.filter(tk => tk.status !== 'resolved').slice(0, 4).map(tk => {
                  const pc: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#16a34a' }
                  const agentColor = getAgentColor(tk.agentId)
                  return (
                    <div key={tk.id} className="conv-row" onClick={() => setView('tickets')}
                      style={{ padding: '0.75rem 0.5rem', borderBottom: '1px solid #f9fafb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.875rem', borderRadius: 6, transition: 'background .1s', margin: '0 -0.5rem' }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: tk.priority === 'high' ? '#fef2f220' : '#fffbeb20', border: `1px solid ${pc[tk.priority] || pc.medium}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0, color: pc[tk.priority] || pc.medium, fontWeight: 700 }}>
                        {tk.priority === 'high' ? '!!' : '!'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{tk.title}</div>
                        <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 2 }}>
                          <span style={{ color: agentColor }}>{tk.agent.name}</span>
                          <span>·</span>
                          <span>{timeAgo(tk.createdAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as any, alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: pc[tk.priority] === '#dc2626' ? '#fef2f2' : '#fffbeb', color: pc[tk.priority] || pc.medium, border: `1px solid ${pc[tk.priority] || pc.medium}33`, textTransform: 'uppercase' as any }}>{tk.priority}</span>
                        <span style={{ fontSize: 11, color: '#9ca3af' }}>{tk.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* ANALYTICS */}
          {view === 'stats' && (
            <AnalyticsView
              hasAdvancedAnalytics={user?.features?.advancedAnalytics ?? false}
              basicStats={stats ?? undefined}
              t={t ? Object.fromEntries(Object.entries(t).filter(([k]) => k.startsWith('analytics_')).map(([k, v]) => [k.replace('analytics_', ''), v])) : undefined}
            />
          )}

          {/* CONVERSATIONS */}
          {view === 'conversations' && (
            <div className="conv-layout" style={{ display: 'flex', gap: '1.25rem', height: 'calc(100vh - 120px)' }}>
              <div className="conv-sidebar" style={{ width: 300, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {(['all', 'open', 'resolved'] as const).map(f => (
                    <button key={f} onClick={() => setFilterStatus(f)}
                      style={{ flex: 1, padding: '0.45rem', border: `1px solid ${filterStatus === f ? '#7c3aed44' : '#e5e7eb'}`, borderRadius: 6, background: filterStatus === f ? '#7c3aed0f' : '#fff', color: filterStatus === f ? accent : '#6b7280', fontSize: 12, fontWeight: filterStatus === f ? 600 : 400, fontFamily: sans, cursor: 'pointer', transition: 'all .1s' }}>
                      {f === 'all' ? `All (${allConvs.length})` : f === 'open' ? `Open (${allConvs.filter(c=>c.status==='open').length})` : `Resolved (${allConvs.filter(c=>c.status==='resolved').length})`}
                    </button>
                  ))}
                </div>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {filteredConvs.map(c => {
                    const color = getAgentColor((c as any).agentId || '')
                    return (
                      <div key={c.id} className="conv-row" onClick={() => { setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}
                        style={{ padding: '0.875rem 1rem', border: `1px solid ${activeConv?.id === c.id ? '#7c3aed44' : '#e5e7eb'}`, borderRadius: 9, cursor: 'pointer', background: activeConv?.id === c.id ? '#7c3aed08' : '#fff', transition: 'all .1s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color, flexShrink: 0 }}>◌</div>
                          <span style={{ fontSize: 12, color: '#374151', fontWeight: 500, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(c as any).agentName}</span>
                          <span style={badge(c.status)}>{c.status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: mono, marginBottom: 4 }}>#{c.id.slice(-8).toUpperCase()}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{timeAgo(c.updatedAt || c.createdAt)}</div>
                      </div>
                    )
                  })}
                  {filteredConvs.length === 0 && <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af', fontSize: 13 }}>No conversations</div>}
                </div>
              </div>

              <div className="conv-main" style={{ flex: 1, ...card, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {activeConv ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid #f3f4f6', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${getAgentColor((activeConv as any).agentId || '')}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: getAgentColor((activeConv as any).agentId || '') }}>◌</div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>#{activeConv.id.slice(-8).toUpperCase()}</div>
                          <div style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(activeConv.updatedAt || activeConv.createdAt)}</div>
                        </div>
                        <span style={badge(activeConv.status)}>{activeConv.status}</span>
                      </div>
                      {activeConv.status === 'open' ? (
                        <button className="btn-outline" style={btnOutline} onClick={() => closeConversation(activeConv.id)}>✓ Mark resolved</button>
                      ) : (
                        <button className="btn-outline" style={btnOutline} onClick={() => reopenConversation(activeConv.id)}>↺ Reopen</button>
                      )}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, paddingInline: '0.25rem' }}>{msg.role === 'user' ? 'Customer' : 'Agent'} · {timeAgo(msg.createdAt)}</span>
                          <div style={{ background: msg.role === 'user' ? '#f9fafb' : '#7c3aed08', border: `1px solid ${msg.role === 'user' ? '#e5e7eb' : '#7c3aed22'}`, borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '0.75rem 1rem', maxWidth: '74%', fontSize: 14, lineHeight: 1.65, color: '#111' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>Agent</span>
                          <div style={{ background: '#7c3aed08', border: '1px solid #7c3aed22', borderRadius: '12px 12px 12px 4px', padding: '0.75rem 1rem', fontSize: 14, color: '#6b7280', display: 'flex', gap: 4, alignItems: 'center' }}>
                            <span>Typing</span><span className="blink" style={{ letterSpacing: 2 }}>...</span>
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                    {activeConv.status === 'open' && (
                      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Reply manually..." style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={sendMessage} disabled={loading} className="btn-primary" style={{ ...btnPrimary, opacity: loading ? 0.5 : 1, flexShrink: 0 }}>Send</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#9ca3af', gap: '0.75rem' }}>
                    <div style={{ fontSize: 48, opacity: 0.3 }}>◌</div>
                    <div style={{ fontSize: 15, fontWeight: 500 }}>Select a conversation</div>
                    <div style={{ fontSize: 13 }}>Choose one from the list to view messages</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TICKETS */}
          {view === 'tickets' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Tickets</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Tasks the agent couldn't handle — requires human attention</div>
                </div>
              </div>

              <div className="grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: 'Total tickets', value: stats?.totalTickets ?? 0, color: '#7c3aed' },
                  { label: 'Open', value: stats?.openTickets ?? 0, color: '#ef4444' },
                  { label: 'In progress', value: tickets.filter(tk => tk.status === 'in_progress').length, color: '#f59e0b' },
                  { label: 'Resolved', value: tickets.filter(tk => tk.status === 'resolved').length, color: '#10b981' },
                ].map((item, i) => (
                  <div key={i} className="stat-card card-hover" style={{ ...card }}>
                    <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.5rem', textTransform: 'uppercase' as any }}>{item.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: item.color, letterSpacing: '-0.02em' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ ...card }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
                      <button key={f} onClick={() => setTicketFilter(f)}
                        style={{ padding: '0.45rem 0.875rem', border: `1px solid ${ticketFilter === f ? '#7c3aed44' : '#e5e7eb'}`, borderRadius: 6, background: ticketFilter === f ? '#7c3aed0f' : '#fff', color: ticketFilter === f ? accent : '#6b7280', fontSize: 12, fontWeight: ticketFilter === f ? 600 : 400, fontFamily: sans, cursor: 'pointer', transition: 'all .1s' }}>
                        {f === 'all' ? `All (${tickets.length})` : f === 'open' ? `Open (${tickets.filter(tk=>tk.status==='open').length})` : f === 'in_progress' ? `In progress (${tickets.filter(tk=>tk.status==='in_progress').length})` : `Resolved (${tickets.filter(tk=>tk.status==='resolved').length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredTickets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                    <div style={{ fontSize: 36, marginBottom: '0.75rem', opacity: 0.5 }}>⚑</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>No tickets{ticketFilter !== 'all' ? ` with status "${ticketFilter.replace('_', ' ')}"` : ''}</div>
                    <div style={{ fontSize: 13, marginTop: '0.25rem' }}>Tickets are auto-created when agents can't handle a request</div>
                  </div>
                ) : filteredTickets.map(tk => {
                  const priorityColors: Record<string, { bg: string; color: string; border: string }> = {
                    high: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                    medium: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
                    low: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                  }
                  const pc = priorityColors[tk.priority] || priorityColors.medium
                  const statusColors: Record<string, { bg: string; color: string; border: string }> = {
                    open: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                    in_progress: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
                    resolved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                  }
                  const sc = statusColors[tk.status] || statusColors.open
                  const agentColor = getAgentColor(tk.agentId)
                  return (
                    <div key={tk.id} className="conv-row" style={{ padding: '1rem 0.5rem', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderRadius: 6, transition: 'background .1s', margin: '0 -0.5rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${pc.bg}`, border: `1px solid ${pc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, color: pc.color }}>
                        {tk.priority === 'high' ? '!!' : tk.priority === 'medium' ? '!' : '—'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#111' }}>{tk.title}</span>
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any, overflow: 'hidden' }}>{tk.description}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' as any }}>
                          <span style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ width: 16, height: 16, borderRadius: 4, background: `${agentColor}18`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: agentColor }}>⬡</span>
                            <span style={{ color: '#6b7280' }}>{tk.agent.name}</span>
                          </span>
                          <span style={{ fontSize: 11, color: '#d1d5db' }}>·</span>
                          <span style={{ fontSize: 11, color: '#9ca3af' }}>{timeAgo(tk.createdAt)}</span>
                          {tk.conversationId && (
                            <>
                              <span style={{ fontSize: 11, color: '#d1d5db' }}>·</span>
                              <span style={{ fontSize: 11, color: accent, cursor: 'pointer', fontWeight: 500 }} onClick={() => {
                                const conv = allConvs.find(c => c.id === tk.conversationId)
                                if (conv) { setView('conversations'); setActiveConv(conv); setMessages(conv.messages.slice().reverse()); setActiveAgentId((conv as any).agentId) }
                              }}>View conversation →</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as any, alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, textTransform: 'uppercase' as any, letterSpacing: '0.04em' }}>{tk.priority}</span>
                          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{tk.status.replace('_', ' ')}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '0.375rem' }}>
                          {tk.status === 'open' && (
                            <button className="btn-outline" style={{ ...btnOutline, fontSize: 11, padding: '0.3rem 0.625rem' }} onClick={() => updateTicketStatus(tk.id, 'in_progress')}>Start</button>
                          )}
                          {tk.status === 'in_progress' && (
                            <button className="btn-outline" style={{ ...btnOutline, fontSize: 11, padding: '0.3rem 0.625rem', color: '#16a34a', borderColor: '#bbf7d0' }} onClick={() => updateTicketStatus(tk.id, 'resolved')}>Resolve</button>
                          )}
                          {tk.status === 'resolved' && (
                            <button className="btn-outline" style={{ ...btnOutline, fontSize: 11, padding: '0.3rem 0.625rem' }} onClick={() => updateTicketStatus(tk.id, 'open')}>Reopen</button>
                          )}
                          <button style={{ ...btnOutline, fontSize: 11, padding: '0.3rem 0.625rem', color: '#ef4444', borderColor: '#fecaca' }} onClick={() => deleteTicket(tk.id)}>Delete</button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AGENTS */}
          {view === 'agents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Agents</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{agents.length} agent{agents.length !== 1 ? 's' : ''} configured</div>
                </div>
                <button className="btn-primary" style={btnPrimary} onClick={() => setView('new-agent')}>+ New agent</button>
              </div>
              {agents.map(ag => {
                const color = getAgentColor(ag.id)
                const maxConvs = Math.max(...agents.map(a => a.conversations.length), 1)
                const pct = Math.round((ag.conversations.length / maxConvs) * 100)
                return (
                  <div key={ag.id} className="card-hover" style={{ ...card, marginBottom: '1rem' }}>
                    <div className="agent-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 11, background: `${color}18`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0, color }}>⬡</div>
                        <div>
                          <div style={{ fontSize: 15, color: '#111', fontWeight: 600, marginBottom: 3 }}>{ag.name}</div>
                          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{ag.description}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ flex: 1, width: 120, height: 4, background: '#f3f4f6', borderRadius: 2, overflow: 'hidden' }}>
                              <div className="progress-bar" style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                            </div>
                            <span style={{ fontSize: 11, color: '#9ca3af' }}>{ag.conversations.length} conversations</span>
                          </div>
                          <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: mono, marginTop: 4 }}>ID: {ag.id}</div>
                        </div>
                      </div>
                      <div className="agent-card-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                        <span style={badge('open')}>Active</span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-outline" style={btnOutline} onClick={() => { setEditingAgent(ag); setView('edit-agent') }}>Edit</button>
                          <button style={btnDanger} onClick={() => deleteAgent(ag.id)}>Delete</button>
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: '0.875rem', fontWeight: 600, letterSpacing: '0.07em', fontFamily: mono }}>GMAIL INTEGRATION</div>
                      <div className="agent-gmail-toggle" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.875rem', padding: '0.875rem 1rem', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                        <div>
                          <div style={{ fontSize: 14, color: '#111', fontWeight: 500, marginBottom: 2 }}>Auto-reply</div>
                          <div style={{ fontSize: 12, color: '#6b7280' }}>{autoReply ? 'Agent replies to emails automatically' : 'Agent reads but does not reply'}</div>
                        </div>
                        <button onClick={toggleAutoReply} style={{ width: 44, height: 24, borderRadius: 12, background: autoReply ? accent : '#d1d5db', position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', transition: 'background .2s', flexShrink: 0 }}>
                          <div style={{ position: 'absolute', top: 3, left: autoReply ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.15)' }} />
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as any }}>
                        <a href="/api/gmail/auth" className="btn-primary" style={{ ...btnPrimary, textDecoration: 'none', fontSize: 13 }}>Connect Gmail</a>
                        <button onClick={() => processEmails(ag.id)} disabled={processing} className="btn-secondary" style={{ ...btnSecondary, opacity: processing ? 0.5 : 1, fontSize: 13 }}>
                          {processing ? 'Processing...' : 'Process emails'}
                        </button>
                      </div>
                      {gmailResult && (
                        <div style={{ marginTop: '0.75rem', fontSize: 13, padding: '0.5rem 0.875rem', borderRadius: 6, background: gmailResult.startsWith('Error') ? '#fef2f2' : '#f0fdf4', color: gmailResult.startsWith('Error') ? '#ef4444' : '#16a34a', border: `1px solid ${gmailResult.startsWith('Error') ? '#fecaca' : '#bbf7d0'}` }}>
                          {gmailResult}
                        </div>
                      )}
                    </div>

                    <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '1.25rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: '0.5rem', fontWeight: 600, letterSpacing: '0.07em', fontFamily: mono }}>EMBED WIDGET</div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '0.75rem' }}>Paste this code into your website to add the chat widget:</div>
                      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '1rem', fontSize: 12, color: '#374151', fontFamily: mono, lineHeight: 1.8, whiteSpace: 'pre' as any, overflowX: 'auto' as any }}>
                        {`<script>\n  window.AxioraConfig = {\n    agentId: '${ag.id}',\n    apiUrl: 'https://calm-smakager-26cab8.netlify.app'\n  }\n</script>\n<script src="https://calm-smakager-26cab8.netlify.app/widget.js"></script>`}
                      </div>
                      <button onClick={() => copyWidgetCode(ag.id)} className="btn-secondary" style={{ ...btnSecondary, marginTop: '0.75rem', fontSize: 13 }}>
                        {copiedId === ag.id ? '✓ Copied!' : 'Copy code'}
                      </button>
                    </div>
                  </div>
                )
              })}
              {agents.length === 0 && (
                <div style={{ ...card, textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem', opacity: 0.3 }}>⬡</div>
                  <div style={{ fontSize: 16, color: '#111', fontWeight: 600, marginBottom: '0.5rem' }}>No agents yet</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '1.5rem' }}>Create your first agent to start automating emails</div>
                  <button className="btn-primary" style={btnPrimary} onClick={() => setView('new-agent')}>+ Create your first agent</button>
                </div>
              )}
            </div>
          )}

          {/* NEW AGENT */}
          {view === 'new-agent' && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ ...card, marginBottom: '1.25rem' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.07em', marginBottom: '0.875rem', fontFamily: mono }}>START FROM A TEMPLATE</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as any }}>
                  {(['support', 'sales', 'admin'] as const).map(key => {
                    const color = getAgentColor(key)
                    return (
                      <button key={key} onClick={() => setNewAgent({ ...AGENT_TEMPLATES[key], type: key })}
                        style={{ padding: '0.625rem 1.25rem', border: `1px solid ${newAgent.type === key ? '#7c3aed44' : '#e5e7eb'}`, borderRadius: 7, background: newAgent.type === key ? '#7c3aed08' : '#fff', color: newAgent.type === key ? accent : '#374151', fontSize: 13, fontFamily: sans, cursor: 'pointer', fontWeight: newAgent.type === key ? 600 : 400, transition: 'all .1s', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color }}>{key === 'support' ? '🎧' : key === 'sales' ? '📈' : '⚙️'}</span>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </button>
                    )
                  })}
                  <button onClick={() => setNewAgent({ name: '', description: '', prompt: '', type: 'custom' })}
                    style={{ padding: '0.625rem 1.25rem', border: `1px solid ${newAgent.type === 'custom' ? '#7c3aed44' : '#e5e7eb'}`, borderRadius: 7, background: newAgent.type === 'custom' ? '#7c3aed08' : '#fff', color: newAgent.type === 'custom' ? accent : '#374151', fontSize: 13, fontFamily: sans, cursor: 'pointer', transition: 'all .1s' }}>
                    ✏️ Custom
                  </button>
                </div>
              </div>
              <div style={{ ...card }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>Agent details</div>
                <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1.25rem' }}>
                  <div><label style={labelStyle}>Name</label><input style={inputStyle} value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder="e.g. Support Agent" /></div>
                  <div><label style={labelStyle}>Description</label><input style={inputStyle} value={newAgent.description} onChange={e => setNewAgent({ ...newAgent, description: e.target.value })} placeholder="e.g. Handles customer support tickets" /></div>
                  <div>
                    <label style={labelStyle}>Instructions (system prompt)</label>
                    <textarea style={textareaStyle} value={newAgent.prompt} onChange={e => setNewAgent({ ...newAgent, prompt: e.target.value })} placeholder="Define how the agent should behave, what tone to use, what topics to cover..." rows={8} />
                    <div style={{ fontSize: 12, color: '#9ca3af', marginTop: '0.4rem' }}>This is the agent's personality and instructions. Be specific for best results.</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                    <button className="btn-primary" style={{ ...btnPrimary, opacity: (creating || !newAgent.name || !newAgent.prompt) ? 0.5 : 1, cursor: (creating || !newAgent.name || !newAgent.prompt) ? 'not-allowed' : 'pointer' }} disabled={creating || !newAgent.name || !newAgent.prompt} onClick={createAgent}>
                      {creating ? 'Creating...' : 'Create agent'}
                    </button>
                    <button className="btn-secondary" style={btnSecondary} onClick={() => setView('agents')}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT AGENT */}
          {view === 'edit-agent' && editingAgent && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ ...card }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>Edit agent</div>
                <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1.25rem' }}>
                  <div><label style={labelStyle}>Name</label><input style={inputStyle} value={editingAgent.name} onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })} /></div>
                  <div><label style={labelStyle}>Description</label><input style={inputStyle} value={editingAgent.description} onChange={e => setEditingAgent({ ...editingAgent, description: e.target.value })} /></div>
                  <div><label style={labelStyle}>Instructions (system prompt)</label><textarea style={textareaStyle} value={editingAgent.prompt} onChange={e => setEditingAgent({ ...editingAgent, prompt: e.target.value })} rows={10} /></div>
                  <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6' }}>
                    <button className="btn-primary" style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }} disabled={saving} onClick={saveAgent}>
                      {saving ? 'Saving...' : 'Save changes'}
                    </button>
                    <button className="btn-secondary" style={btnSecondary} onClick={() => { setView('agents'); setEditingAgent(null) }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT */}
          {view === 'account' && user && (() => {
            const isAdminUser = user.role === 'admin'
            const plan = isAdminUser ? 'admin' : (user.plan || 'basic')
            const u = user.usage
            const f = user.features
            const planColors: Record<string, string> = { basic: '#3b82f6', pro: '#7c3aed', enterprise: '#f59e0b', admin: '#dc2626' }
            const planColor = planColors[plan] || '#3b82f6'
            const planPrices: Record<string, string> = { basic: '29', pro: '99', enterprise: '399', admin: '—' }
            const agentPct = u?.maxAgents ? Math.min((u.agents / u.maxAgents) * 100, 100) : 0
            const emailPct = u?.maxEmails ? Math.min((u.emailsUsed / u.maxEmails) * 100, 100) : 0
            const agentNearLimit = !isAdminUser && u?.maxAgents ? u.agents >= u.maxAgents : false
            const emailNearLimit = !isAdminUser && u?.maxEmails ? u.emailsUsed >= u.maxEmails * 0.8 : false

            const allPlans = [
              { id: 'basic', name: 'Basic', price: '29', agents: '1', emails: '500', features: ['Gmail', 'Basic dashboard', 'Email support'] },
              { id: 'pro', name: 'Pro', price: '99', agents: '5', emails: '5,000', features: ['Gmail + Slack', 'Full dashboard', 'Advanced analytics', 'Priority support'], popular: true },
              { id: 'enterprise', name: 'Enterprise', price: '399', agents: 'Unlimited', emails: 'Unlimited', features: ['All integrations', 'Own API', 'Guaranteed SLA', 'Dedicated support'] },
            ]

            return (
              <div style={{ maxWidth: 900 }}>
                {/* Current plan header */}
                <div style={{ ...card, marginBottom: '1.25rem', background: `linear-gradient(135deg, ${planColor}08, ${planColor}04)`, border: `1px solid ${planColor}33` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: planColor, background: `${planColor}18`, padding: '3px 10px', borderRadius: 20, border: `1px solid ${planColor}33`, textTransform: 'uppercase' as any }}>{plan}</span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>Current plan</span>
                      </div>
                      {isAdminUser ? (
                        <div style={{ fontSize: 14, color: '#6b7280', marginTop: '0.25rem' }}>Unlimited access — no billing</div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                          <span style={{ fontSize: 36, fontWeight: 800, color: '#111', letterSpacing: '-0.03em' }}>{planPrices[plan] || '29'}€</span>
                          <span style={{ fontSize: 14, color: '#9ca3af' }}>/ month</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg, ${planColor}, ${planColor}aa)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
                        {isAdminUser ? 'A' : plan === 'basic' ? 'B' : plan === 'pro' ? 'P' : 'E'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Usage */}
                <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  <div className="card-hover" style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as any }}>Active agents</div>
                      {agentNearLimit && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600, background: '#fef2f2', padding: '2px 8px', borderRadius: 10, border: '1px solid #fecaca' }}>LIMIT REACHED</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.875rem' }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: agentNearLimit ? '#ef4444' : '#111', letterSpacing: '-0.02em' }}>{u?.agents ?? 0}</span>
                      <span style={{ fontSize: 14, color: '#9ca3af' }}>/ {u?.maxAgents ?? '∞'}</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ height: '100%', width: u?.maxAgents ? `${agentPct}%` : '0%', background: agentNearLimit ? '#ef4444' : accent, borderRadius: 3 }} />
                    </div>
                  </div>

                  <div className="card-hover" style={{ ...card }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as any }}>Emails this month</div>
                      {emailNearLimit && <span style={{ fontSize: 10, color: u.emailsUsed >= (u.maxEmails ?? Infinity) ? '#ef4444' : '#f59e0b', fontWeight: 600, background: u.emailsUsed >= (u.maxEmails ?? Infinity) ? '#fef2f2' : '#fffbeb', padding: '2px 8px', borderRadius: 10, border: `1px solid ${u.emailsUsed >= (u.maxEmails ?? Infinity) ? '#fecaca' : '#fde68a'}` }}>{u.emailsUsed >= (u.maxEmails ?? Infinity) ? 'LIMIT REACHED' : 'NEAR LIMIT'}</span>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.375rem', marginBottom: '0.875rem' }}>
                      <span style={{ fontSize: 32, fontWeight: 700, color: u?.maxEmails && u.emailsUsed >= u.maxEmails ? '#ef4444' : '#111', letterSpacing: '-0.02em' }}>{u?.emailsUsed?.toLocaleString() ?? 0}</span>
                      <span style={{ fontSize: 14, color: '#9ca3af' }}>/ {u?.maxEmails?.toLocaleString() ?? '∞'}</span>
                    </div>
                    <div style={{ height: 6, background: '#f3f4f6', borderRadius: 3, overflow: 'hidden' }}>
                      <div className="progress-bar" style={{ height: '100%', width: u?.maxEmails ? `${emailPct}%` : '0%', background: emailNearLimit ? (u.emailsUsed >= (u.maxEmails ?? Infinity) ? '#ef4444' : '#f59e0b') : '#10b981', borderRadius: 3 }} />
                    </div>
                    {u?.emailsResetAt && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: '0.5rem' }}>Resets {new Date(new Date(u.emailsResetAt).getFullYear(), new Date(u.emailsResetAt).getMonth() + 1, 1).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</div>}
                  </div>
                </div>

                {/* Features */}
                <div style={{ ...card, marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1.25rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>Plan features</div>
                  <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem' }}>
                    {[
                      { label: 'Gmail integration', enabled: f?.integrations?.includes('gmail') },
                      { label: 'Slack integration', enabled: f?.integrations?.includes('slack') },
                      { label: 'All integrations', enabled: f?.integrations?.includes('all') },
                      { label: 'Full dashboard', enabled: f?.fullDashboard },
                      { label: 'Advanced analytics', enabled: f?.advancedAnalytics },
                      { label: 'Own API access', enabled: f?.api },
                      { label: 'Guaranteed SLA', enabled: f?.sla },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0' }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: item.enabled ? '#f0fdf4' : '#f9fafb', border: `1px solid ${item.enabled ? '#bbf7d0' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0 }}>
                          <span style={{ color: item.enabled ? '#16a34a' : '#d1d5db', fontWeight: 700 }}>{item.enabled ? '✓' : '—'}</span>
                        </div>
                        <span style={{ fontSize: 14, color: item.enabled ? '#111' : '#9ca3af' }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan comparison */}
                {!isAdminUser && plan !== 'enterprise' && (
                  <div style={{ ...card }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '0.375rem' }}>Upgrade your plan</div>
                    <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '1.25rem' }}>Get more agents, higher email limits, and premium features.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${allPlans.length}, 1fr)`, gap: '1rem' }}>
                      {allPlans.map(p => {
                        const isCurrent = p.id === plan
                        const pc = planColors[p.id] || '#3b82f6'
                        return (
                          <div key={p.id} style={{ border: `1px solid ${isCurrent ? pc + '55' : p.popular ? pc + '44' : '#e5e7eb'}`, borderRadius: 10, padding: '1.25rem', background: isCurrent ? `${pc}06` : '#fff', position: 'relative' as any, transition: 'border-color .15s' }}>
                            {p.popular && !isCurrent && <div style={{ position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: '#fff', background: accent, padding: '2px 10px', borderRadius: 10 }}>MOST POPULAR</div>}
                            <div style={{ fontSize: 12, fontWeight: 700, color: pc, letterSpacing: '0.06em', marginBottom: '0.5rem', textTransform: 'uppercase' as any }}>{p.name}</div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.125rem', marginBottom: '1rem' }}>
                              <span style={{ fontSize: 28, fontWeight: 800, color: '#111' }}>{p.price}€</span>
                              <span style={{ fontSize: 12, color: '#9ca3af' }}>/mo</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '0.25rem' }}>{p.agents} agent{p.agents !== '1' ? 's' : ''}</div>
                            <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '0.875rem' }}>{p.emails} emails/mo</div>
                            {p.features.map((feat, i) => (
                              <div key={i} style={{ fontSize: 12, color: '#374151', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.375rem' }}>
                                <span style={{ color: '#16a34a', fontSize: 10, fontWeight: 700 }}>✓</span>{feat}
                              </div>
                            ))}
                            <button style={{ ...(isCurrent ? btnOutline : btnPrimary), width: '100%', marginTop: '1rem', fontSize: 13, background: isCurrent ? 'transparent' : pc, borderColor: isCurrent ? '#e5e7eb' : pc }} disabled={isCurrent}>
                              {isCurrent ? 'Current plan' : 'Upgrade'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Account info */}
                <div style={{ ...card, marginTop: '1.25rem' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: '1rem', paddingBottom: '0.875rem', borderBottom: '1px solid #f3f4f6' }}>Account details</div>
                  <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '0.75rem' }}>
                    {[
                      { label: 'Name', value: user.name || '—' },
                      { label: 'Email', value: user.email },
                      { label: 'Role', value: user.role === 'admin' ? 'Administrator' : 'User' },
                      { label: 'User ID', value: user.id, mono: true },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 3 ? '1px solid #f9fafb' : 'none' }}>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                        <span style={{ fontSize: 13, color: '#111', fontWeight: 500, fontFamily: item.mono ? mono : sans }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* CALENDAR */}
          {view === 'calendar' && console.log('CALENDAR VIEW', calendarConnected) as any}
          {view === 'calendar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>Calendar</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                    {calendarConnected ? `${calendarEvents.length} upcoming events` : 'Connect your Google Calendar to get started'}
                  </div>
                </div>
                {!calendarConnected && (
                  <a href="/api/calendar/auth" className="btn-primary" style={{ ...btnPrimary, textDecoration: 'none', fontSize: 13 }}>
                    Connect Google Calendar
                  </a>
                )}
              </div>

              {!calendarConnected ? (
                <div style={{ ...card, textAlign: 'center', padding: '4rem 2rem' }}>
                  <div style={{ fontSize: 48, marginBottom: '1rem' }}>📅</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: '0.5rem' }}>No calendar connected</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginBottom: '1.5rem', maxWidth: 400, margin: '0 auto 1.5rem' }}>
                    Connect your Google Calendar so agents can check availability and schedule meetings automatically.
                  </div>
                  <a href="/api/calendar/auth" className="btn-primary" style={{ ...btnPrimary, textDecoration: 'none' }}>
                    Connect Google Calendar
                  </a>
                </div>
              ) : (
                <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.25rem' }}>
                  {/* Events list */}
                  <div style={{ ...card }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
                      Upcoming events
                    </div>
                    {calendarEvents.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '3rem 0', color: '#9ca3af' }}>
                        <div style={{ fontSize: 36, marginBottom: '0.75rem', opacity: 0.4 }}>📭</div>
                        <div style={{ fontSize: 14 }}>No upcoming events</div>
                      </div>
                    ) : calendarEvents.map((event: any, i: number) => {
                      const start = event.start?.dateTime || event.start?.date
                      const end = event.end?.dateTime || event.end?.date
                      const startDate = start ? new Date(start) : null
                      const isAllDay = !event.start?.dateTime
                      const hasAttendees = event.attendees && event.attendees.length > 0
                      return (
                        <div key={event.id || i} style={{ display: 'flex', gap: '1rem', padding: '0.875rem 0', borderBottom: i < calendarEvents.length - 1 ? '1px solid #f9fafb' : 'none', alignItems: 'flex-start' }}>
                          <div style={{ width: 44, flexShrink: 0, textAlign: 'center', background: '#7c3aed08', border: '1px solid #7c3aed22', borderRadius: 8, padding: '0.4rem 0.25rem' }}>
                            <div style={{ fontSize: 10, color: '#7c3aed', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' as any }}>
                              {startDate ? startDate.toLocaleDateString('ca', { month: 'short' }) : '—'}
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 700, color: '#111', lineHeight: 1.1 }}>
                              {startDate ? startDate.getDate() : '—'}
                            </div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {event.summary || 'Untitled event'}
                            </div>
                            <div style={{ fontSize: 12, color: '#6b7280', marginBottom: hasAttendees ? 4 : 0 }}>
                              {isAllDay ? 'All day' : startDate ? startDate.toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }) + (end ? ' – ' + new Date(end).toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }) : '') : ''}
                              {event.location ? ` · ${event.location}` : ''}
                            </div>
                            {hasAttendees && (
                              <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' as any }}>
                                {event.attendees.slice(0, 3).map((a: any, j: number) => (
                                  <span key={j} style={{ fontSize: 10, background: '#f3f4f6', color: '#6b7280', padding: '1px 6px', borderRadius: 10 }}>
                                    {a.email?.split('@')[0]}
                                  </span>
                                ))}
                                {event.attendees.length > 3 && <span style={{ fontSize: 10, color: '#9ca3af' }}>+{event.attendees.length - 3}</span>}
                              </div>
                            )}
                          </div>
                          <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 20, background: event.status === 'confirmed' ? '#f0fdf4' : '#f9fafb', color: event.status === 'confirmed' ? '#16a34a' : '#6b7280', border: `1px solid ${event.status === 'confirmed' ? '#bbf7d0' : '#e5e7eb'}`, flexShrink: 0, fontFamily: sans }}>
                            {event.status || 'confirmed'}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Sidebar info */}
                  <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1rem' }}>
                    <div style={{ ...card }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: '0.875rem' }}>Agent integration</div>
                      <div style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>
                        Your agents can now check your availability and schedule meetings automatically when clients request them via email or chat.
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '0.625rem' }}>
                        {[
                          { icon: '✓', text: 'Check real-time availability' },
                          { icon: '✓', text: 'Create events automatically' },
                          { icon: '✓', text: 'Send invites to attendees' },
                          { icon: '✓', text: 'Email reminders 24h before' },
                        ].map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
                            <span style={{ color: '#16a34a', fontSize: 12, fontWeight: 700 }}>{item.icon}</span>
                            <span style={{ fontSize: 13, color: '#374151' }}>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ ...card }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: '0.875rem' }}>Quick stats</div>
                      {[
                        { label: 'Events this month', value: calendarEvents.filter((e: any) => { const d = new Date(e.start?.dateTime || e.start?.date); return d.getMonth() === new Date().getMonth() }).length },
                        { label: 'Total upcoming', value: calendarEvents.length },
                        { label: 'With attendees', value: calendarEvents.filter((e: any) => e.attendees?.length > 0).length },
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: i < 2 ? '1px solid #f9fafb' : 'none' }}>
                          <span style={{ fontSize: 13, color: '#6b7280' }}>{item.label}</span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: '#7c3aed' }}>{item.value}</span>
                        </div>
                      ))}
                    </div>

                    <a href="/api/calendar/auth" style={{ ...btnSecondary, textDecoration: 'none', textAlign: 'center', display: 'block', fontSize: 13 }}>
                      Reconnect calendar
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* CALENDAR */}
          
        </div>
      </main>
    </div>
  )
}