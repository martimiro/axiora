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
      await fetchData()
      setView('agents')
      setEditingAgent(null)
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

  const s = {
    app: { display: 'flex', minHeight: '100vh', background: '#080808', color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace", fontSize: 13 } as any,
    sidebar: { width: 220, borderRight: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' } as any,
    logo: { padding: '0 1.5rem 2rem', display: 'flex', alignItems: 'center', gap: 8 } as any,
    dot: { width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' } as any,
    logoText: { fontSize: 12, letterSpacing: '0.2em', color: '#888' } as any,
    navItem: (active: boolean) => ({ padding: '0.6rem 1.5rem', cursor: 'pointer', color: active ? '#d4d0c8' : '#444', borderLeft: active ? '2px solid #d4d0c8' : '2px solid transparent', fontSize: 11, letterSpacing: '0.12em', transition: 'all 0.15s' }) as any,
    main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' } as any,
    topbar: { borderBottom: '1px solid #1a1a1a', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any,
    pageTitle: { fontSize: 11, letterSpacing: '0.2em', color: '#555' } as any,
    content: { flex: 1, overflow: 'auto', padding: '2rem' } as any,
    grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' } as any,
    grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' } as any,
    card: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '1.25rem 1.5rem' } as any,
    cardLabel: { fontSize: 10, letterSpacing: '0.18em', color: '#444', marginBottom: '0.5rem' } as any,
    cardValue: { fontSize: 28, fontWeight: 500, color: '#d4d0c8' } as any,
    cardSub: { fontSize: 10, color: '#2a2a2a', marginTop: '0.25rem' } as any,
    section: { marginBottom: '2rem' } as any,
    sectionTitle: { fontSize: 10, letterSpacing: '0.18em', color: '#444', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #111' } as any,
    convRow: (active: boolean) => ({ padding: '0.75rem 1rem', border: '1px solid #1a1a1a', borderRadius: 4, marginBottom: '0.5rem', cursor: 'pointer', background: active ? '#141414' : '#0f0f0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any,
    badge: (status: string) => ({ fontSize: 9, letterSpacing: '0.12em', padding: '2px 6px', borderRadius: 2, background: status === 'open' ? '#0d2010' : '#1a1a1a', color: status === 'open' ? '#4ade80' : '#444' }) as any,
    chatWrap: { display: 'flex', gap: '2rem', height: 'calc(100vh - 130px)' } as any,
    convList: { width: 300, borderRight: '1px solid #1a1a1a', overflowY: 'auto', paddingRight: '1rem' } as any,
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' } as any,
    msgArea: { flex: 1, overflowY: 'auto', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' } as any,
    inputRow: { borderTop: '1px solid #1a1a1a', paddingTop: '1rem', display: 'flex', gap: '0.75rem' } as any,
    input: { flex: 1, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' } as any,
    textarea: { width: '100%', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', resize: 'vertical' as any, minHeight: 120, boxSizing: 'border-box' as any } as any,
    fieldInput: { width: '100%', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box' as any } as any,
    label: { fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem', display: 'block' } as any,
    btn: (disabled: boolean) => ({ background: disabled ? '#1a1a1a' : '#d4d0c8', color: '#080808', border: 'none', borderRadius: 4, padding: '0.6rem 1.25rem', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: disabled ? 'not-allowed' : 'pointer' }) as any,
    btnGreen: { background: '#4ade80', color: '#080808', border: 'none', borderRadius: 4, padding: '0.6rem 1.25rem', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' } as any,
    btnDanger: { background: 'transparent', color: '#444', border: '1px solid #222', borderRadius: 4, padding: '0.4rem 0.875rem', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' } as any,
    btnOutline: { background: 'transparent', color: '#888', border: '1px solid #222', borderRadius: 4, padding: '0.4rem 0.875rem', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' } as any,
    toggle: (active: boolean) => ({ width: 40, height: 22, borderRadius: 11, background: active ? '#4ade80' : '#222', position: 'relative' as any, cursor: 'pointer', transition: 'background 0.2s', border: 'none', outline: 'none' }) as any,
    toggleDot: (active: boolean) => ({ position: 'absolute' as any, top: 3, left: active ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }) as any,
    templateBtn: (active: boolean) => ({ padding: '0.5rem 1rem', border: `1px solid ${active ? '#4ade80' : '#222'}`, borderRadius: 4, background: active ? '#0d2010' : '#0f0f0f', color: active ? '#4ade80' : '#444', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' }) as any,
    filterBtn: (active: boolean) => ({ padding: '0.4rem 0.875rem', border: `1px solid ${active ? '#d4d0c8' : '#222'}`, borderRadius: 4, background: 'transparent', color: active ? '#d4d0c8' : '#444', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer' }) as any,
  }

  const navItems = [
    { key: 'dashboard', label: t?.panel || 'PANEL' },
    { key: 'stats', label: t?.stats || 'ESTADÍSTIQUES' },
    { key: 'conversations', label: t?.conversations || 'CONVERSES' },
    { key: 'agents', label: t?.agents || 'AGENTS' },
  ]

  const pageTitle: Record<string, string> = {
    dashboard: t?.panelTitle || 'PANELL DE CONTROL',
    stats: t?.statsTitle || 'ESTADÍSTIQUES',
    conversations: t?.conversationsTitle || 'CONVERSES',
    agents: t?.agentsTitle || 'AGENTS',
    'new-agent': t?.newAgentTitle || 'NOU AGENT',
    'edit-agent': t?.editAgentTitle || 'EDITAR AGENT',
  }

  return (
    <div style={s.app}>
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.dot} className="dot-pulse" />
          <span style={s.logoText}>AXIORA</span>
        </div>
        {navItems.map(item => (
          <div key={item.key} style={s.navItem(view === item.key || (view === 'new-agent' && item.key === 'agents') || (view === 'edit-agent' && item.key === 'agents'))} onClick={() => setView(item.key as any)}>
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '0 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <LocaleSwitcher />
          <button style={{ background: 'transparent', border: 'none', color: '#2a2a2a', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => { document.cookie = 'token=; Max-Age=0; path=/'; window.location.href = '/login' }}>
            {t?.logout || 'TANCAR SESSIÓ'}
          </button>
          <div style={{ fontSize: 9, color: '#1a1a1a', letterSpacing: '0.1em' }}>v0.1.0-alpha</div>
        </div>
      </aside>

      <main style={s.main}>
        <div style={s.topbar}>
          <span style={s.pageTitle}>{pageTitle[view]}</span>
          <span style={{ fontSize: 10, color: '#2a2a2a' }}>{new Date().toLocaleDateString('ca', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        </div>

<div style={s.content} key={view} className="view-enter">
          {view === 'dashboard' && (
            <>
              <div style={s.grid}>
                <div style={s.card}>
                  <div style={s.cardLabel}>{t?.activeAgents || 'AGENTS ACTIUS'}</div>
                  <div style={s.cardValue}>{stats?.totalAgents ?? 0}</div>
                </div>
                <div style={s.card}>
                  <div style={s.cardLabel}>{t?.openConvs || 'CONV. OBERTES'}</div>
                  <div style={s.cardValue}>{stats?.openConversations ?? 0}</div>
                </div>
                <div style={s.card}>
                  <div style={s.cardLabel}>{t?.messagesToday || 'MISSATGES AVUI'}</div>
                  <div style={s.cardValue}>{stats?.messagesToday ?? 0}</div>
                  <div style={s.cardSub}>{stats?.messagesThisWeek ?? 0} {t?.thisWeek || 'aquesta setmana'}</div>
                </div>
              </div>
              <div style={s.section}>
                <div style={s.sectionTitle}>{t?.recentActivity || 'ACTIVITAT RECENT'}</div>
                {allConvs.filter(c => c.status === 'open').slice(0, 5).map(c => (
                  <div key={c.id} style={s.convRow(false)} className="card-transition" onClick={() => { setView('conversations'); setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{(c as any).agentName}</div>
                      <div style={{ color: '#555', fontSize: 11 }}>{c.messages[0]?.content?.slice(0, 60) || '...'}...</div>
                    </div>
                    <span style={s.badge(c.status)}>{c.status.toUpperCase()}</span>
                  </div>
                ))}
                {(stats?.openConversations ?? 0) === 0 && <div style={{ color: '#2a2a2a', fontSize: 11 }}>{t?.noOpenConvs || 'Sense converses obertes'}</div>}
              </div>
            </>
          )}

          {view === 'stats' && stats && (
            <>
              <div style={s.grid4}>
                <div style={s.card} className="stat-card"><div style={s.cardLabel}>{t?.messagesToday || 'MISSATGES AVUI'}</div><div style={s.cardValue}>{stats.messagesToday}</div></div>
                <div style={s.card} className="stat-card"><div style={s.cardLabel}>{t?.thisWeek || 'AQUESTA SETMANA'}</div><div style={s.cardValue}>{stats.messagesThisWeek}</div></div>
                <div style={s.card} className="stat-card"><div style={s.cardLabel}>{t?.aiReplies || 'RESPOSTES IA'}</div><div style={s.cardValue}>{stats.autoReplies}</div></div>
                <div style={s.card} className="stat-card"><div style={s.cardLabel}>{t?.openConvs || 'CONV. OBERTES'}</div><div style={s.cardValue}>{stats.openConversations}</div></div>
              </div>
              <div style={s.section}>
                <div style={s.sectionTitle}>{t?.performanceByAgent || 'RENDIMENT PER AGENT'}</div>
                {stats.agentStats.map(ag => (
                  <div key={ag.id} style={{ ...s.card, marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, color: '#d4d0c8', marginBottom: 4 }}>{ag.name}</div>
                      <div style={{ fontSize: 10, color: '#444' }}>{ag.conversations} {t?.conversations2 || 'converses'} · {ag.messages} {t?.messages || 'missatges'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 20, fontWeight: 500, color: '#4ade80' }}>{ag.messages}</div>
                      <div style={{ fontSize: 9, color: '#444', letterSpacing: '0.1em' }}>{t?.messages?.toUpperCase() || 'MISSATGES'}</div>
                    </div>
                  </div>
                ))}
                {stats.agentStats.length === 0 && <div style={{ color: '#2a2a2a', fontSize: 11 }}>{t?.noData || 'Sense dades encara'}</div>}
              </div>
            </>
          )}

          {view === 'conversations' && (
            <div style={s.chatWrap}>
              <div style={s.convList}>
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem' }}>
                  {(['all', 'open', 'resolved'] as const).map(f => (
                    <button key={f} style={s.filterBtn(filterStatus === f)} onClick={() => setFilterStatus(f)}>
                      {f === 'all' ? (t?.allConvs || 'TOTES') : f === 'open' ? (t?.openConvsFilter || 'OBERTES') : (t?.resolvedConvs || 'RESOLTES')}
                    </button>
                  ))}
                </div>
                {filteredConvs.map(c => (
                  <div key={c.id} style={s.convRow(activeConv?.id === c.id)} className="card-transition" onClick={() => { setActiveConv(c); setMessages(c.messages.slice().reverse()); setActiveAgentId((c as any).agentId) }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{(c as any).agentName}</div>
                      <div style={{ fontSize: 10, color: '#333' }}>#{c.id.slice(-6).toUpperCase()}</div>
                    </div>
                    <span style={s.badge(c.status)}>{c.status === 'open' ? (t?.open || 'OBERTA') : (t?.resolved || 'RESOLTA')}</span>
                  </div>
                ))}
                {filteredConvs.length === 0 && <div style={{ color: '#2a2a2a', fontSize: 11 }}>{t?.noConversations || 'Sense converses'}</div>}
              </div>
              <div style={s.chatArea}>
                {activeConv ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111' }}>
                      <div>
                        <span style={{ fontSize: 10, color: '#444', letterSpacing: '0.1em' }}>CONV #{activeConv.id.slice(-6).toUpperCase()}</span>
                        <span style={{ ...s.badge(activeConv.status), marginLeft: '0.75rem' }}>{activeConv.status === 'open' ? (t?.open || 'OBERTA') : (t?.resolved || 'RESOLTA')}</span>
                      </div>
                      {activeConv.status === 'open' ? (
                        <button style={s.btnOutline} onClick={() => closeConversation(activeConv.id)}>{t?.markResolved || 'MARCAR RESOLTA'}</button>
                      ) : (
                        <button style={s.btnOutline} onClick={() => reopenConversation(activeConv.id)}>{t?.reopen || 'REOBRIR'}</button>
                      )}
                    </div>
                    <div style={s.msgArea}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                          <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em' }}>{msg.role === 'user' ? (t?.client || 'CLIENT') : (t?.agent || 'AGENT')}</span>
                          <div style={{ background: msg.role === 'user' ? '#141414' : '#0f0f0f', border: `1px solid ${msg.role === 'user' ? '#222' : '#1a1a1a'}`, borderRadius: 4, padding: '0.6rem 0.875rem', maxWidth: '70%', fontSize: 12, lineHeight: 1.6 }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                          <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em' }}>{t?.agent || 'AGENT'}</span>
                          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', fontSize: 12, color: '#444' }}><span>{t?.processing ? t.processing.slice(0,-1) : 'processant'}<span className='blink'>_</span></span></div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                    {activeConv.status === 'open' && (
                      <div style={s.inputRow}>
                        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder={t?.replyPlaceholder || 'Respondre manualment...'} style={s.input} />
                        <button onClick={sendMessage} disabled={loading} style={s.btn(loading)}>{t?.send || 'ENVIAR'}</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#2a2a2a', fontSize: 11, letterSpacing: '0.15em' }}>
                    {t?.selectConversation || 'SELECCIONA UNA CONVERSA'}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'agents' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={s.sectionTitle}>{t?.configuredAgents || 'AGENTS CONFIGURATS'}</div>
                <button style={s.btnGreen} onClick={() => setView('new-agent')}>{t?.newAgent || '+ NOU AGENT'}</button>
              </div>
              {agents.map(ag => (
                <div key={ag.id} style={{ ...s.card, marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#d4d0c8', marginBottom: 4 }}>{ag.name}</div>
                      <div style={{ fontSize: 11, color: '#444', marginBottom: '0.75rem' }}>{ag.description}</div>
                      <div style={{ fontSize: 10, color: '#1a1a1a', fontFamily: 'monospace' }}>ID: {ag.id}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' as any, alignItems: 'flex-end', gap: 8 }}>
                      <span style={s.badge('open')}>{t?.active || 'ACTIU'}</span>
                      <div style={{ fontSize: 10, color: '#444' }}>{ag.conversations.length} {t?.conversations2 || 'converses'}</div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button style={s.btnOutline} onClick={() => { setEditingAgent(ag); setView('edit-agent') }}>{t?.edit || 'EDITAR'}</button>
                        <button style={s.btnDanger} onClick={() => deleteAgent(ag.id)}>{t?.delete || 'ELIMINAR'}</button>
                      </div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '1rem', paddingTop: '1rem' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '1rem' }}>{t?.gmailIntegration || 'INTEGRACIÓ GMAIL'}</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '0.75rem 1rem', background: '#111', borderRadius: 4, border: '1px solid #1a1a1a' }}>
                      <div>
                        <div style={{ fontSize: 12, color: '#d4d0c8', marginBottom: 2 }}>{t?.autoReply || 'Resposta automàtica'}</div>
                        <div style={{ fontSize: 10, color: '#444' }}>{autoReply ? (t?.autoReplyOn || "L'agent respon emails automàticament") : (t?.autoReplyOff || "L'agent llegeix però no respon")}</div>
                      </div>
                      <button style={s.toggle(autoReply)} onClick={toggleAutoReply}>
                        <div style={s.toggleDot(autoReply)} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' as any }}>
                      <a href="/api/gmail/auth" style={s.btnGreen}>{t?.connectGmail || 'CONNECTAR GMAIL'}</a>
                      <button onClick={() => processEmails(ag.id)} disabled={processing} style={s.btn(processing)}>
                        {processing ? (t?.processing2 || 'PROCESSANT...') : (t?.processEmails || 'PROCESSAR EMAILS')}
                      </button>
                    </div>
                    {gmailResult && <div style={{ marginTop: '0.75rem', fontSize: 11, color: gmailResult.startsWith('Error') ? '#ef4444' : '#4ade80' }}>{gmailResult}</div>}
                  </div>

                  <div style={{ borderTop: '1px solid #1a1a1a', marginTop: '1rem', paddingTop: '1rem' }}>
                    <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.75rem' }}>{t?.widgetTitle || 'WIDGET EMBEBIBLE'}</div>
                    <div style={{ fontSize: 11, color: '#555', marginBottom: '0.75rem' }}>{t?.widgetDesc || 'Enganxa aquest codi al teu web per afegir el xat:'}</div>
                    <div style={{ background: '#080808', border: '1px solid #111', borderRadius: 4, padding: '0.875rem', fontSize: 10, color: '#4ade80', fontFamily: 'monospace', lineHeight: 1.8, whiteSpace: 'pre' as any, overflowX: 'auto' as any }}>
                      {`<script>\n  window.AxioraConfig = {\n    agentId: '${ag.id}',\n    apiUrl: 'https://calm-smakager-26cab8.netlify.app'\n  }\n</script>\n<script src="https://calm-smakager-26cab8.netlify.app/widget.js"></script>`}
                    </div>
                    <button onClick={() => copyWidgetCode(ag.id)} style={{ ...s.btnOutline, marginTop: '0.5rem', fontSize: 10 }}>
                      {copiedId === ag.id ? (t?.copied || 'COPIAT') : (t?.copyCode || 'COPIAR CODI')}
                    </button>
                  </div>
                </div>
              ))}
              {agents.length === 0 && (
                <div style={{ textAlign: 'center', color: '#2a2a2a', marginTop: '3rem' }}>
                  <div style={{ fontSize: 11, marginBottom: 8 }}>{t?.noAgents || 'No hi ha agents configurats'}</div>
                  <button style={s.btnGreen} onClick={() => setView('new-agent')}>{t?.createFirst || '+ CREAR PRIMER AGENT'}</button>
                </div>
              )}
            </div>
          )}

          {view === 'new-agent' && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={s.sectionTitle}>{t?.template || 'TEMPLATE'}</div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' as any }}>
                  {(['support', 'sales', 'admin'] as const).map(key => (
                    <button key={key} style={s.templateBtn(newAgent.type === key)} onClick={() => setNewAgent({ ...AGENT_TEMPLATES[key], type: key })}>{key.toUpperCase()}</button>
                  ))}
                  <button style={s.templateBtn(newAgent.type === 'custom')} onClick={() => setNewAgent({ name: '', description: '', prompt: '', type: 'custom' })}>CUSTOM</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1rem' }}>
                <div><label style={s.label}>{t?.agentName || 'AGENT NAME'}</label><input style={s.fieldInput} value={newAgent.name} onChange={e => setNewAgent({ ...newAgent, name: e.target.value })} placeholder={t?.agentNamePlaceholder || 'e.g. Support Agent'} /></div>
                <div><label style={s.label}>{t?.description || 'DESCRIPTION'}</label><input style={s.fieldInput} value={newAgent.description} onChange={e => setNewAgent({ ...newAgent, description: e.target.value })} placeholder={t?.descriptionPlaceholder || 'e.g. Manages tickets and FAQs'} /></div>
                <div><label style={s.label}>{t?.instructions || 'AGENT INSTRUCTIONS (PROMPT)'}</label><textarea style={s.textarea} value={newAgent.prompt} onChange={e => setNewAgent({ ...newAgent, prompt: e.target.value })} placeholder={t?.instructionsPlaceholder || 'Define how the agent should behave...'} rows={8} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button style={s.btn(creating || !newAgent.name || !newAgent.prompt)} disabled={creating || !newAgent.name || !newAgent.prompt} onClick={createAgent}>{creating ? (t?.creating || 'CREATING...') : (t?.createAgent || 'CREATE AGENT')}</button>
                  <button style={{ ...s.btn(false), background: 'transparent', color: '#444', border: '1px solid #222' }} onClick={() => setView('agents')}>{t?.cancel || 'CANCEL'}</button>
                </div>
              </div>
            </div>
          )}

          {view === 'edit-agent' && editingAgent && (
            <div style={{ maxWidth: 600 }}>
              <div style={{ display: 'flex', flexDirection: 'column' as any, gap: '1rem' }}>
                <div><label style={s.label}>{t?.agentName || 'AGENT NAME'}</label><input style={s.fieldInput} value={editingAgent.name} onChange={e => setEditingAgent({ ...editingAgent, name: e.target.value })} /></div>
                <div><label style={s.label}>{t?.description || 'DESCRIPTION'}</label><input style={s.fieldInput} value={editingAgent.description} onChange={e => setEditingAgent({ ...editingAgent, description: e.target.value })} /></div>
                <div><label style={s.label}>{t?.instructions || 'AGENT INSTRUCTIONS (PROMPT)'}</label><textarea style={s.textarea} value={editingAgent.prompt} onChange={e => setEditingAgent({ ...editingAgent, prompt: e.target.value })} rows={10} /></div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button style={s.btn(saving)} disabled={saving} onClick={saveAgent}>{saving ? (t?.saving || 'SAVING...') : (t?.saveChanges || 'SAVE CHANGES')}</button>
                  <button style={{ ...s.btn(false), background: 'transparent', color: '#444', border: '1px solid #222' }} onClick={() => { setView('agents'); setEditingAgent(null) }}>{t?.cancel || 'CANCEL'}</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
