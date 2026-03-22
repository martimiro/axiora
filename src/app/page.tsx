'use client'
import { useState, useEffect, useRef } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'

type Message = { role: string; content: string; createdAt: string }
type Conv = { id: string; status: string; updatedAt: string; messages: Message[] }
type Agent = { id: string; name: string; description: string; prompt: string; conversations: Conv[] }
type Stats = {
  totalAgents: number; totalConversations: number; totalMessages: number
  messagesToday: number; messagesThisWeek: number; autoReplies: number
  openConversations: number; agentStats: { id: string; name: string; conversations: number; messages: number }[]
}
type DashMessages = { dashboard: Record<string, string> }

const AGENT_TEMPLATES = {
  support: { name: 'Support Agent', description: 'Manages tickets and answers frequently asked questions', prompt: `You are a friendly and professional support agent. Your goal is to help customers resolve their issues clearly and concisely. Always respond in the same language as the customer. If you cannot resolve the problem, indicate that you will escalate it to a human agent.` },
  sales: { name: 'Sales Agent', description: 'Qualifies leads and schedules commercial meetings', prompt: `You are a professional sales agent. Your goal is to qualify leads, answer questions about products and services, and schedule meetings with the sales team. Be proactive but not invasive. Always respond in the same language as the customer.` },
  admin: { name: 'Admin Agent', description: 'Processes documents and updates databases', prompt: `You are an efficient administrative assistant. Your goal is to process administrative requests, extract information from documents and coordinate internal tasks. Be precise and methodical in your responses.` }
}

const sans = "'Inter', sans-serif"
const mono = "'IBM Plex Mono', monospace"
const accent = '#7c3aed'
const accentLight = '#8b5cf6'

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [activeConv, setActiveConv] = useState<Conv | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [gmailResult, setGmailResult] = useState<string | null>(null)
  const [autoReply, setAutoReply] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [view, setView] = useState<'dashboard' | 'stats' | 'conversations' | 'agents' | 'new-agent' | 'edit-agent'>('dashboard')
  const [newAgent, setNewAgent] = useState({ name: '', description: '', prompt: '', type: 'support' })
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'resolved'>('all')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [m, setM] = useState<DashMessages | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchData(); fetchConfig(); fetchStats()
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../messages/${locale}.json`).then(mod => setM(mod.default))
  }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const t = m?.dashboard

  async function fetchData() {
    const res = await fetch('/api/conversations')
    if (!res.ok) return
    const data = await res.json()
    if (Array.isArray(data)) {
      setAgents(data)
      if (data.length > 0 && !activeAgentId) setActiveAgentId(data[0].id)
    }
  }

  async function fetchStats() {
    const res = await fetch('/api/stats')
    const data = await res.json()
    setStats(data)
  }

  async function fetchConfig() {
    const res = await fetch('/api/config')
    const data = await res.json()
    setAutoReply(data.autoReply)
  }

  async function toggleAutoReply() {
    const newValue = !autoReply
    setAutoReply(newValue)
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ autoReply: newValue }) })
  }

  async function createAgent() {
    if (!newAgent.name || !newAgent.prompt) return
    setCreating(true)
    try {
      const res = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newAgent) })
      const data = await res.json()
      if (data.id) { await fetchData(); await fetchStats(); setView('agents'); setNewAgent({ name: '', description: '', prompt: '', type: 'support' }) }
    } finally { setCreating(false) }
  }

  async function saveAgent() {
    if (!editingAgent) return
    setSaving(true)
    try {
      await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingAgent.name, description: editingAgent.description, prompt: editingAgent.prompt })
      })
      await fetchData(); setView('agents'); setEditingAgent(null)
    } finally { setSaving(false) }
  }

  async function deleteAgent(id: string) {
    if (!confirm(t?.confirmDelete || 'Eliminar aquest agent?')) return
    await fetch('/api/agents', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    await fetchData(); await fetchStats()
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
    const userMsg = input.trim()
    setInput(''); setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch('/api/agent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId: activeAgentId, message: userMsg }) })
      const data = await res.json()
      if (data.reply) { setMessages(prev => [...prev, { role: 'assistant', content: data.reply, createdAt: new Date().toISOString() }]); fetchData(); fetchStats() }
    } finally { setLoading(false) }
  }

  async function processEmails(agentId: string) {
    setProcessing(true); setGmailResult(null)
    try {
      const res = await fetch('/api/gmail/process', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ agentId }) })
      const data = await res.json()
      setGmailResult(data.error ? (t?.errorPrefix || 'Error: ') + data.error : (t?.processed || 'Processats {count} emails nous').replace('{count}', data.processed))
      if (!data.error) { fetchData(); fetchStats() }
    } finally { setProcessing(false) }
  }

  function copyWidgetCode(agentId: string) {
    const code = `<script>\n  window.AxioraConfig = {\n    agentId: '${agentId}',\n    apiUrl: 'https://calm-smakager-26cab8.netlify.app',\n    title: 'Support',\n    greeting: 'Hi! How can I help you today?'\n  }\n</script>\n<script src="https://calm-smakager-26cab8.netlify.app/widget.js"></script>`
    navigator.clipboard.writeText(code)
    setCopiedId(agentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const allConvs = (Array.isArray(agents) ? agents : []).flatMap(ag => ag.conversations.map(c => ({ ...c, agentName: ag.name, agentId: ag.id })))
  const filteredConvs = allConvs.filter(c => filterStatus === 'all' ? true : c.status === filterStatus)

  const navItems = [
    { key: 'dashboard', label: t?.panel || 'Panel', icon: '▦' },
    { key: 'stats', label: t?.stats || 'Estadístiques', icon: '↗' },
    { key: 'conversations', label: t?.conversations || 'Converses', icon: '◌' },
    { key: 'agents', label: t?.agents || 'Agents', icon: '⬡' },
  ]

  const pageTitle: Record<string, string> = {
    dashboard: t?.panelTitle || 'Panel de control',
    stats: t?.statsTitle || 'Estadístiques',
    conversations: t?.conversationsTitle || 'Converses',
    agents: t?.agentsTitle || 'Agents',
    'new-agent': t?.newAgentTitle || 'Nou agent',
    'edit-agent': t?.editAgentTitle || 'Editar agent',
  }

  const isActive = (key: string) => view === key || (view === 'new-agent' && key === 'agents') || (view === 'edit-agent' && key === 'agents')

  // Styles
  const card: any = { background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12, padding: '1.5rem' }
  const inputStyle: any = { width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 8, padding: '0.7rem 1rem', color: '#e8e4dc', fontSize: 14, fontFamily: sans, outline: 'none', boxSizing: 'border-box', transition: 'border-color .2s' }
  const textareaStyle: any = { ...inputStyle, resize: 'vertical', minHeight: 140, lineHeight: 1.6 }
  const labelStyle: any = { fontSize: 12, color: '#555', marginBottom: '0.5rem', display: 'block', fontWeight: 500 }
  const btnPrimary: any = { background: accent, color: '#fff', border: 'none', borderRadius: 8, padding: '0.7rem 1.5rem', fontSize: 14, fontFamily: sans, fontWeight: 600, cursor: 'pointer', transition: 'opacity .15s, transform .15s' }
  const btnSecondary: any = { background: 'transparent', color: '#666', border: '1px solid #222', borderRadius: 8, padding: '0.7rem 1.5rem', fontSize: 14, fontFamily: sans, cursor: 'pointer', transition: 'border-color .2s, color .2s' }
  const btnOutline: any = { background: 'transparent', color: '#555', border: '1px solid #1a1a1a', borderRadius: 6, padding: '0.4rem 0.875rem', fontSize: 12, fontFamily: sans, cursor: 'pointer', transition: 'all .15s' }
  const btnDanger: any = { ...btnOutline, color: '#ef4444', borderColor: '#ef444422' }
  const badge = (status: string): any => ({ fontSize: 10, letterSpacing: '0.08em', padding: '3px 8px', borderRadius: 6, background: status === 'open' ? '#7c3aed18' : '#1a1a1a', color: status === 'open' ? accentLight : '#444', border: `1px solid ${status === 'open' ? '#7c3aed33' : '#222'}`, fontFamily: mono })

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050505', color: '#e8e4dc', fontFamily: sans }}>

      <style>{`
        @keyframes pulse-accent { 0%,100%{box-shadow:0 0 6px #7c3aed}50%{box-shadow:0 0 16px #7c3aed} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
        .view-enter{animation:fadeSlideIn 0.25s ease forwards}
        .blink{animation:blink 1s infinite}
        .nav-item:hover{background:#0f0f0f!important;color:#e8e4dc!important}
        .card-hover{transition:border-color .2s,transform .2s,box-shadow .2s}
        .card-hover:hover{border-color:#2a2a2a!important;transform:translateY(-1px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
        .conv-row{transition:background .15s,border-color .15s}
        .conv-row:hover{background:#0f0f0f!important;border-color:#222!important}
        .btn-primary:hover{opacity:.88;transform:translateY(-1px)}
        .btn-secondary:hover{border-color:#333!important;color:#e8e4dc!important}
        .btn-outline:hover{border-color:#333!important;color:#e8e4dc!important}
        input:focus,textarea:focus{border-color:#7c3aed!important;box-shadow:0 0 0 3px #7c3aed18}
        .template-btn:hover{border-color:#7c3aed!important;color:#8b5cf6!important}
        .filter-btn:hover{border-color:#333!important;color:#e8e4dc!important}
        .toggle-btn{transition:background .25s}
        .stat-card{animation:fadeSlideIn .4s ease forwards;opacity:0}
        .stat-card:nth-child(2){animation-delay:.07s}
        .stat-card:nth-child(3){animation-delay:.14s}
        .stat-card:nth-child(4){animation-delay:.21s}
      `}</style>

      {/* Sidebar */}
      <aside style={{ width: 240, borderRight: '1px solid #111', display: 'flex', flexDirection: 'column', padding: '1.5rem 0', background: '#070707', flexShrink: 0 }}>
        <div style={{ padding: '0 1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: accent, animation: 'pulse-accent 2s infinite' }} />
          <span style={{ fontSize: 15, letterSpacing: '0.12em', color: '#e8e4dc', fontWeight: 700, fontFamily: mono }}>AXIORA</span>
        </div>

        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <div
              key={item.key}
              className="nav-item"
              onClick={() => setView(item.key as any)}
              style={{
                padding: '0.7rem 1.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                color: isActive(item.key) ? '#e8e4dc' : '#444',
                background: isActive(item.key) ? '#0f0f0f' : 'transparent',
                borderLeft: isActive(item.key) ? `2px solid ${accent}` : '2px solid transparent',
                fontSize: 14, fontWeight: isActive(item.key) ? 500 : 400,
                transition: 'all .15s', marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 12, opacity: 0.6 }}>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </nav>

        <div style={{ padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <LocaleSwitcher />
          <button
            style={{ background: 'transparent', border: 'none', color: '#333', fontSize: 12, fontFamily: sans, cursor: 'pointer', padding: 0, textAlign: 'left', transition: 'color .15s' }}
            onClick={() => { document.cookie = 'token=; Max-Age=0; path=/'; window.location.href = '/login' }}
          >
            {t?.logout || 'Tancar sessió'}
          </button>
          <div style={{ fontSize: 10, color: '#1a1a1a', fontFamily: mono }}>v0.1.0-alpha</div>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Topbar */}
        <div style={{ borderBottom: '1px solid #111', padding: '1.1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#070707' }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#e8e4dc', letterSpacing: '-0.01em' }}>{pageTitle[view]}</span>
          <span style={{ fontSize: 12, color: '#333', fontFamily: mono }}>{new Date().toLocaleDateString('ca', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: 'auto', padding: '2rem' }} key={view} className="view-enter">

          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: t?.activeAgents || 'Agents actius', value: stats?.totalAgents ?? 0, sub: null },
                  { label: t?.openConvs || 'Conv. obertes', value: stats?.openConversations ?? 0, sub: null },
                  { label: t?.messagesToday || 'Missatges avui', value: stats?.messagesToday ?? 0, sub: `${stats?.messagesThisWeek ?? 0} ${t?.thisWeek || 'aquesta setmana'}` },
                ].map((item, i) => (
                  <div key={i} className="card-hover" style={{ ...card }}>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: '0.75rem', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#e8e4dc', letterSpacing: '-0.02em' }}>{item.value}</div>
                    {item.sub && <div style={{ fontSize: 12, color: '#333', marginTop: '0.3rem' }}>{item.sub}</div>}
                  </div>
                ))}
              </div>
              <div style={{ ...card }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #111' }}>{t?.recentActivity || 'Activitat recent'}</div>
                {allConvs.filter(c => c.status === 'open').slice(0, 5).map(c => (
                  <div key={c.id} className="conv-row" onClick={() => { setView('conversations'); setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}
                    style={{ padding: '0.875rem 1rem', border: '1px solid #111', borderRadius: 8, marginBottom: '0.5rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 3, fontWeight: 500 }}>{(c as any).agentName}</div>
                      <div style={{ fontSize: 13, color: '#444' }}>{c.messages[0]?.content?.slice(0, 70) || '...'}...</div>
                    </div>
                    <span style={badge(c.status)}>{c.status.toUpperCase()}</span>
                  </div>
                ))}
                {(stats?.openConversations ?? 0) === 0 && <div style={{ fontSize: 13, color: '#333', textAlign: 'center', padding: '2rem 0' }}>{t?.noOpenConvs || 'Sense converses obertes'}</div>}
              </div>
            </>
          )}

          {/* STATS */}
          {view === 'stats' && stats && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                  { label: t?.messagesToday || 'Missatges avui', value: stats.messagesToday },
                  { label: t?.thisWeek || 'Aquesta setmana', value: stats.messagesThisWeek },
                  { label: t?.aiReplies || 'Respostes IA', value: stats.autoReplies },
                  { label: t?.openConvs || 'Conv. obertes', value: stats.openConversations },
                ].map((item, i) => (
                  <div key={i} className="stat-card card-hover" style={{ ...card }}>
                    <div style={{ fontSize: 12, color: '#555', marginBottom: '0.75rem', fontWeight: 500 }}>{item.label}</div>
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#e8e4dc', letterSpacing: '-0.02em' }}>{item.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#888', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #111' }}>{t?.performanceByAgent || 'Rendiment per agent'}</div>
                {stats.agentStats.map(ag => (
                  <div key={ag.id} className="card-hover" style={{ ...card, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 14, color: '#e8e4dc', marginBottom: 4, fontWeight: 500 }}>{ag.name}</div>
                      <div style={{ fontSize: 12, color: '#555' }}>{ag.conversations} {t?.conversations2 || 'converses'} · {ag.messages} {t?.messages || 'missatges'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 28, fontWeight: 700, color: accentLight, letterSpacing: '-0.02em' }}>{ag.messages}</div>
                      <div style={{ fontSize: 10, color: '#444', fontFamily: mono }}>MISSATGES</div>
                    </div>
                  </div>
                ))}
                {stats.agentStats.length === 0 && <div style={{ fontSize: 13, color: '#333', textAlign: 'center', padding: '2rem 0' }}>{t?.noData || 'Sense dades encara'}</div>}
              </div>
            </>
          )}

          {/* CONVERSATIONS */}
          {view === 'conversations' && (
            <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 130px)' }}>
              <div style={{ width: 300, display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {(['all', 'open', 'resolved'] as const).map(f => (
                    <button key={f} className="filter-btn" onClick={() => setFilterStatus(f)}
                      style={{ flex: 1, padding: '0.5rem', border: `1px solid ${filterStatus === f ? accent : '#1a1a1a'}`, borderRadius: 6, background: filterStatus === f ? '#7c3aed14' : 'transparent', color: filterStatus === f ? accentLight : '#444', fontSize: 11, fontFamily: mono, cursor: 'pointer', transition: 'all .15s' }}>
                      {f === 'all' ? (t?.allConvs || 'TOTES') : f === 'open' ? (t?.openConvsFilter || 'OBERTES') : (t?.resolvedConvs || 'RESOLTES')}
                    </button>
                  ))}
                </div>
                {filteredConvs.map(c => (
                  <div key={c.id} className="conv-row" onClick={() => { setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}
                    style={{ padding: '0.875rem 1rem', border: `1px solid ${activeConv?.id === c.id ? '#7c3aed44' : '#111'}`, borderRadius: 10, cursor: 'pointer', background: activeConv?.id === c.id ? '#7c3aed0a' : '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#666', marginBottom: 3, fontWeight: 500 }}>{(c as any).agentName}</div>
                      <div style={{ fontSize: 11, color: '#333', fontFamily: mono }}>#{c.id.slice(-6).toUpperCase()}</div>
                    </div>
                    <span style={badge(c.status)}>{c.status === 'open' ? (t?.open || 'OBERTA') : (t?.resolved || 'RESOLTA')}</span>
                  </div>
                ))}
                {filteredConvs.length === 0 && <div style={{ fontSize: 13, color: '#333', textAlign: 'center', padding: '2rem 0' }}>{t?.noConversations || 'Sense converses'}</div>}
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', ...card }}>
                {activeConv ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: 13, color: '#666', fontFamily: mono }}>#{activeConv.id.slice(-6).toUpperCase()}</span>
                        <span style={badge(activeConv.status)}>{activeConv.status === 'open' ? (t?.open || 'OBERTA') : (t?.resolved || 'RESOLTA')}</span>
                      </div>
                      {activeConv.status === 'open' ? (
                        <button style={btnOutline} className="btn-outline" onClick={() => closeConversation(activeConv.id)}>{t?.markResolved || 'Marcar resolta'}</button>
                      ) : (
                        <button style={btnOutline} className="btn-outline" onClick={() => reopenConversation(activeConv.id)}>{t?.reopen || 'Reobrir'}</button>
                      )}
                    </div>
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '1rem' }}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#333', fontFamily: mono }}>{msg.role === 'user' ? (t?.client || 'CLIENT') : (t?.agent || 'AGENT')}</span>
                          <div style={{ background: msg.role === 'user' ? '#0f0f0f' : '#7c3aed0a', border: `1px solid ${msg.role === 'user' ? '#1a1a1a' : '#7c3aed22'}`, borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px', padding: '0.75rem 1rem', maxWidth: '72%', fontSize: 14, lineHeight: 1.6, color: '#e0dcd4' }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                          <span style={{ fontSize: 11, color: '#333', fontFamily: mono }}>{t?.agent || 'AGENT'}</span>
                          <div style={{ background: '#7c3aed0a', border: '1px solid #7c3aed22', borderRadius: '12px 12px 12px 4px', padding: '0.75rem 1rem', fontSize: 14, color: '#555' }}>
                            <span>{t?.processing ? t.processing.slice(0, -1) : 'processant'}<span className="blink">_</span></span>
                          </div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                    {activeConv.status === 'open' && (
                      <div style={{ borderTop: '1px solid #111', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t?.replyPlaceholder || 'Respondre manualment...'} style={{ ...inputStyle, flex: 1 }} />
                        <button onClick={sendMessage} disabled={loading} className="btn-primary" style={{ ...btnPrimary, opacity: loading ? 0.5 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>{t?.send || 'Enviar'}</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#2a2a2a', fontSize: 14, fontFamily: mono }}>{t?.selectConversation || 'SELECCIONA UNA CONVERSA'}</div>
                )}
              </div>
            </div>
          )}

          {/* AGENTS */}
          {view === 'agents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#888' }}>{t?.configuredAgents || 'Agents configurats'}</div>
                <button className="btn-primary" style={btnPrimary} onClick={() => setView('new-agent')}>{t?.newAgent || '+ Nou agent'}</button>
              </div>
              {agents.map(ag => (
                <div key={ag.id} className="card-hover" style={{ ...card, marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, color: '#e8e4dc', marginBottom: 6, fontWeight: 600 }}>{ag.name}</div>
                      <div style={{ fontSize: 13, color: '#555', marginBottom: '0.5rem' }}>{ag.description}</div>
                      <div style={{ fontSize: 11, color: '#222', fontFamily: mono }}>ID: {ag.id}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                      <span style={badge('open')}>{t?.active || 'ACTIU'}</span>
                      <div style={{ fontSize: 12, color: '#444' }}>{ag.conversations.length} {t?.conversations2 || 'converses'}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="btn-outline" style={btnOutline} onClick={() => { setEditingAgent(ag); setView('edit-agent') }}>{t?.edit || 'Editar'}</button>
                        <button style={btnDanger} onClick={() => deleteAgent(ag.id)}>{t?.delete || 'Eliminar'}</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #111', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                    <div style={{ fontSize: 12, color: '#444', marginBottom: '1rem', fontWeight: 500, fontFamily: mono, letterSpacing: '0.08em' }}>{t?.gmailIntegration || 'INTEGRACIÓ GMAIL'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '1rem', background: '#080808', borderRadius: 8, border: '1px solid #111' }}>
                      <div>
                        <div style={{ fontSize: 14, color: '#e8e4dc', marginBottom: 4, fontWeight: 500 }}>{t?.autoReply || 'Resposta automàtica'}</div>
                        <div style={{ fontSize: 12, color: '#555' }}>{autoReply ? (t?.autoReplyOn || "L'agent respon emails automàticament") : (t?.autoReplyOff || "L'agent llegeix però no respon")}</div>
                      </div>
                      <button className="toggle-btn" onClick={toggleAutoReply} style={{ width: 44, height: 24, borderRadius: 12, background: autoReply ? accent : '#222', position: 'relative', cursor: 'pointer', border: 'none', outline: 'none' }}>
                        <div style={{ position: 'absolute', top: 3, left: autoReply ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left .25s' }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as any }}>
                      <a href="/api/gmail/auth" className="btn-primary" style={{ ...btnPrimary, textDecoration: 'none', fontSize: 13 }}>{t?.connectGmail || 'Connectar Gmail'}</a>
                      <button onClick={() => processEmails(ag.id)} disabled={processing} className="btn-secondary" style={{ ...btnSecondary, opacity: processing ? 0.5 : 1 }}>
                        {processing ? (t?.processing2 || 'Processant...') : (t?.processEmails || 'Processar emails')}
                      </button>
                    </div>
                    {gmailResult && <div style={{ marginTop: '0.75rem', fontSize: 13, color: gmailResult.startsWith('Error') ? '#ef4444' : accentLight }}>{gmailResult}</div>}
                  </div>

                  <div style={{ borderTop: '1px solid #111', paddingTop: '1.25rem' }}>
                    <div style={{ fontSize: 12, color: '#444', marginBottom: '0.5rem', fontWeight: 500, fontFamily: mono, letterSpacing: '0.08em' }}>{t?.widgetTitle || 'WIDGET'}</div>
                    <div style={{ fontSize: 13, color: '#555', marginBottom: '0.75rem' }}>{t?.widgetDesc || 'Enganxa aquest codi al teu web:'}</div>
                    <div style={{ background: '#080808', border: '1px solid #111', borderRadius: 8, padding: '1rem', fontSize: 11, color: accentLight, fontFamily: mono, lineHeight: 1.8, whiteSpace: 'pre' as any, overflowX: 'auto' as any }}>
                      {`<script>\n  window.AxioraConfig = {\n    agentId: '${ag.id}',\n    apiUrl: 'https://calm-smakager-26cab8.netlify.app'\n  }\n</script>\n<script src="https://calm-smakager-26cab8.netlify.app/widget.js"></script>`}
                    </div>
                    <button onClick={() => copyWidgetCode(ag.id)} className="btn-outline" style={{ ...btnOutline, marginTop: '0.75rem' }}>
                      {copiedId === ag.id ? (t?.copied || 'Copiat ✓') : (t?.copyCode || 'Copiar codi')}
                    </button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div style={{ textAlign: 'center', color: '#2a2a2a', marginTop: '4rem' }}>
                  <div style={{ fontSize: 14, marginBottom: 16 }}>{t?.noAgents || 'No hi ha agents configurats'}</div>
                  <button className="btn-primary" style={btnPrimary} onClick={() => setView('new-agent')}>{t?.createFirst || '+ Crear primer agent'}</button>
                </div>
              )}
            </div>
          )}

          {/* NEW AGENT */}
          {view === 'new-agent' && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ marginBottom: '1.75rem' }}>
                <div style={{ fontSize: 12, color: '#444', marginBottom: '0.875rem', fontWeight: 500, fontFamily: mono, letterSpacing: '0.08em' }}>{t?.template || 'TEMPLATE'}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as any }}>
                  {(['support', 'sales', 'admin'] as const).map(key => (
                    <button key={key} className="template-btn" onClick={() => setNewAgent({ ...AGENT_TEMPLATES[key], type: key })}
                      style={{ padding: '0.6rem 1.25rem', border: `1px solid ${newAgent.type === key ? accent : '#1a1a1a'}`, borderRadius: 8, background: newAgent.type === key ? '#7c3aed14' : '#0a0a0a', color: newAgent.type === key ? accentLight : '#444', fontSize: 13, fontFamily: sans, cursor: 'pointer', transition: 'all .15s', fontWeight: newAgent.type === key ? 500 : 400 }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                  <button className="template-btn" onClick={() => setNewAgent({ name: '', description: '', prompt: '', type: 'custom' })}
                    style={{ padding: '0.6rem 1.25rem', border: `1px solid ${newAgent.type === 'custom' ? accent : '#1a1a1a'}`, borderRadius: 8, background: newAgent.type === 'custom' ? '#7c3aed14' : '#0a0a0a', color: newAgent.type === 'custom' ? accentLight : '#444', fontSize: 13, fontFamily: sans, cursor: 'pointer', transition: 'all .15s' }}>
                    Custom
                  </button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1.25rem' }}>
                <div><label style={labelStyle}>{t?.agentName || 'Nom de l\'agent'}</label><input style={inputStyle} value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder={t?.agentNamePlaceholder || 'e.g. Support Agent'} /></div>
                <div><label style={labelStyle}>{t?.description || 'Descripció'}</label><input style={inputStyle} value={newAgent.description} onChange={e => setNewAgent({ ...newAgent, description: e.target.value })} placeholder={t?.descriptionPlaceholder || 'e.g. Manages tickets and FAQs'} /></div>
                <div><label style={labelStyle}>{t?.instructions || 'Instruccions (prompt)'}</label><textarea style={textareaStyle} value={newAgent.prompt} onChange={e => setNewAgent({ ...newAgent, prompt: e.target.value })} placeholder={t?.instructionsPlaceholder || 'Define how the agent should behave...'} rows={8} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-primary" style={{ ...btnPrimary, opacity: (creating || !newAgent.name || !newAgent.prompt) ? 0.5 : 1, cursor: (creating || !newAgent.name || !newAgent.prompt) ? 'not-allowed' : 'pointer' }} disabled={creating || !newAgent.name || !newAgent.prompt} onClick={createAgent}>
                    {creating ? (t?.creating || 'Creant...') : (t?.createAgent || 'Crear agent')}
                  </button>
                  <button className="btn-secondary" style={btnSecondary} onClick={() => setView('agents')}>{t?.cancel || 'Cancel·lar'}</button>
                </div>
              </div>
            </div>
          )}

          {/* EDIT AGENT */}
          {view === 'edit-agent' && editingAgent && (
            <div style={{ maxWidth: 640 }}>
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1.25rem' }}>
                <div><label style={labelStyle}>{t?.agentName || 'Nom de l\'agent'}</label><input style={inputStyle} value={editingAgent.name} onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })} /></div>
                <div><label style={labelStyle}>{t?.description || 'Descripció'}</label><input style={inputStyle} value={editingAgent.description} onChange={e => setEditingAgent({ ...editingAgent, description: e.target.value })} /></div>
                <div><label style={labelStyle}>{t?.instructions || 'Instruccions (prompt)'}</label><textarea style={textareaStyle} value={editingAgent.prompt} onChange={e => setEditingAgent({ ...editingAgent, prompt: e.target.value })} rows={10} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-primary" style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }} disabled={saving} onClick={saveAgent}>
                    {saving ? (t?.saving || 'Guardant...') : (t?.saveChanges || 'Guardar canvis')}
                  </button>
                  <button className="btn-secondary" style={btnSecondary} onClick={() => { setView('agents'); setEditingAgent(null) }}>{t?.cancel || 'Cancel·lar'}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}