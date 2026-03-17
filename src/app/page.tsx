'use client'
import { useState, useEffect, useRef } from 'react'

const AGENT_ID = 'cmmuturpi00001gai8kn1b46h'
type Message = { role: string; content: string; createdAt: string }
type Conv = { id: string; status: string; updatedAt: string; messages: Message[] }
type Agent = { id: string; name: string; description: string; conversations: Conv[] }

export default function Dashboard() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [activeConv, setActiveConv] = useState<Conv | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'dashboard' | 'conversations' | 'agents'>('dashboard')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchData() }, [])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function fetchData() {
    const res = await fetch('/api/conversations')
    const data = await res.json()
    setAgents(data)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date().toISOString() }])
    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: AGENT_ID, message: userMsg }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply, createdAt: new Date().toISOString() }])
        fetchData()
      }
    } finally {
      setLoading(false)
    }
  }

  const totalConvs = agents.reduce((a, ag) => a + ag.conversations.length, 0)
  const totalMsgs = agents.reduce((a, ag) => a + ag.conversations.reduce((b, c) => b + c.messages.length, 0), 0)
  const openConvs = agents.reduce((a, ag) => a + ag.conversations.filter(c => c.status === 'open').length, 0)

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
    card: { background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '1.25rem 1.5rem' } as any,
    cardLabel: { fontSize: 10, letterSpacing: '0.18em', color: '#444', marginBottom: '0.5rem' } as any,
    cardValue: { fontSize: 28, fontWeight: 500, color: '#d4d0c8' } as any,
    section: { marginBottom: '2rem' } as any,
    sectionTitle: { fontSize: 10, letterSpacing: '0.18em', color: '#444', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #111' } as any,
    convRow: (active: boolean) => ({ padding: '0.75rem 1rem', border: '1px solid #1a1a1a', borderRadius: 4, marginBottom: '0.5rem', cursor: 'pointer', background: active ? '#141414' : '#0f0f0f', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }) as any,
    badge: (status: string) => ({ fontSize: 9, letterSpacing: '0.12em', padding: '2px 6px', borderRadius: 2, background: status === 'open' ? '#0d2010' : '#1a1a1a', color: status === 'open' ? '#4ade80' : '#444' }) as any,
    chatWrap: { display: 'flex', gap: '2rem', height: 'calc(100vh - 130px)' } as any,
    convList: { width: 280, borderRight: '1px solid #1a1a1a', overflowY: 'auto', paddingRight: '1rem' } as any,
    chatArea: { flex: 1, display: 'flex', flexDirection: 'column' } as any,
    msgArea: { flex: 1, overflowY: 'auto', paddingBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' } as any,
    inputRow: { borderTop: '1px solid #1a1a1a', paddingTop: '1rem', display: 'flex', gap: '0.75rem' } as any,
    input: { flex: 1, background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none' } as any,
    btn: (disabled: boolean) => ({ background: disabled ? '#1a1a1a' : '#d4d0c8', color: '#080808', border: 'none', borderRadius: 4, padding: '0.6rem 1.25rem', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', cursor: disabled ? 'not-allowed' : 'pointer' }) as any,
  }

  return (
    <div style={s.app}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.dot} />
          <span style={s.logoText}>AXIORA</span>
        </div>
        {[
          { key: 'dashboard', label: 'PANEL' },
          { key: 'conversations', label: 'CONVERSACIONES' },
          { key: 'agents', label: 'AGENTES' },
        ].map(item => (
          <div key={item.key} style={s.navItem(view === item.key)} onClick={() => setView(item.key as any)}>
            {item.label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: '0 1.5rem' }}>
          <div style={{ fontSize: 9, color: '#2a2a2a', letterSpacing: '0.1em' }}>v0.1.0-alpha</div>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        <div style={s.topbar}>
          <span style={s.pageTitle}>{view === 'dashboard' ? 'PANEL DE CONTROL' : view === 'conversations' ? 'CONVERSACIONES' : 'AGENTES'}</span>
          <span style={{ fontSize: 10, color: '#2a2a2a' }}>{new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
        </div>

        <div style={s.content}>

          {/* DASHBOARD */}
          {view === 'dashboard' && (
            <>
              <div style={s.grid}>
                <div style={s.card}>
                  <div style={s.cardLabel}>AGENTES ACTIVOS</div>
                  <div style={s.cardValue}>{agents.length}</div>
                </div>
                <div style={s.card}>
                  <div style={s.cardLabel}>CONVERSACIONES</div>
                  <div style={s.cardValue}>{totalConvs}</div>
                </div>
                <div style={s.card}>
                  <div style={s.cardLabel}>MENSAJES TOTALES</div>
                  <div style={s.cardValue}>{totalMsgs}</div>
                </div>
              </div>

              <div style={s.section}>
                <div style={s.sectionTitle}>ACTIVIDAD RECIENTE</div>
                {agents.flatMap(ag => ag.conversations.map(c => ({ ...c, agentName: ag.name }))).slice(0, 5).map(c => (
                  <div key={c.id} style={s.convRow(false)} onClick={() => { setView('conversations'); setActiveConv(c); setMessages(c.messages.slice().reverse()) }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#888', marginBottom: 2 }}>{(c as any).agentName}</div>
                      <div style={{ color: '#555', fontSize: 11 }}>{c.messages[0]?.content?.slice(0, 60) || 'Sin mensajes'}...</div>
                    </div>
                    <span style={s.badge(c.status)}>{c.status.toUpperCase()}</span>
                  </div>
                ))}
                {totalConvs === 0 && <div style={{ color: '#2a2a2a', fontSize: 11 }}>Sin actividad aún</div>}
              </div>
            </>
          )}

          {/* CONVERSATIONS */}
          {view === 'conversations' && (
            <div style={s.chatWrap}>
              <div style={s.convList}>
                <div style={s.sectionTitle}>TODAS LAS CONVERSACIONES</div>
                {agents.flatMap(ag => ag.conversations.map(c => ({ ...c, agentName: ag.name }))).map(c => (
                  <div key={c.id} style={s.convRow(activeConv?.id === c.id)} onClick={() => { setActiveConv(c); setMessages(c.messages.slice().reverse()) }}>
                    <div>
                      <div style={{ fontSize: 10, color: '#555', marginBottom: 2 }}>{(c as any).agentName}</div>
                      <div style={{ fontSize: 10, color: '#333' }}>#{c.id.slice(-6).toUpperCase()}</div>
                    </div>
                    <span style={s.badge(c.status)}>{c.status.toUpperCase()}</span>
                  </div>
                ))}
                {totalConvs === 0 && <div style={{ color: '#2a2a2a', fontSize: 11 }}>Sin conversaciones</div>}
              </div>

              <div style={s.chatArea}>
                {activeConv ? (
                  <>
                    <div style={s.msgArea}>
                      {messages.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 3 }}>
                          <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em' }}>{msg.role === 'user' ? 'OPERADOR' : 'AGENTE'}</span>
                          <div style={{ background: msg.role === 'user' ? '#141414' : '#0f0f0f', border: `1px solid ${msg.role === 'user' ? '#222' : '#1a1a1a'}`, borderRadius: 4, padding: '0.6rem 0.875rem', maxWidth: '70%', fontSize: 12, lineHeight: 1.6 }}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3 }}>
                          <span style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em' }}>AGENTE</span>
                          <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', fontSize: 12, color: '#444' }}>procesando_</div>
                        </div>
                      )}
                      <div ref={bottomRef} />
                    </div>
                    <div style={s.inputRow}>
                      <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Escribe un mensaje..." style={s.input} />
                      <button onClick={sendMessage} disabled={loading} style={s.btn(loading)}>ENVIAR</button>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#2a2a2a', fontSize: 11, letterSpacing: '0.15em' }}>
                    SELECCIONA UNA CONVERSACIÓN
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AGENTS */}
          {view === 'agents' && (
            <div>
              <div style={s.sectionTitle}>AGENTES CONFIGURADOS</div>
              {agents.map(ag => (
                <div key={ag.id} style={{ ...s.card, marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 13, color: '#d4d0c8', marginBottom: 4 }}>{ag.name}</div>
                      <div style={{ fontSize: 11, color: '#444', marginBottom: '0.75rem' }}>{ag.description}</div>
                      <div style={{ fontSize: 10, color: '#2a2a2a' }}>ID: {ag.id}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, color: '#444', marginBottom: 4 }}>{ag.conversations.length} CONVERSACIONES</div>
                      <span style={s.badge('open')}>ACTIVO</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}
