'use client'
import { useState, useRef } from 'react'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

const mono = "'IBM Plex Mono', monospace"

export default function DashboardPreview({ m }: { m: LandingMessages }) {
  const dp = m.dashboardPreview
  const sidebarItems = (dp?.sidebar as string[] | undefined) || ['PANEL', 'ESTADÍSTIQUES', 'CONVERSES', 'AGENTS']
  const dashboardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = dashboardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 10
    const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -10
    setTilt({ x: rotateX, y: rotateY })
  }

  return (
    <FadeSection className="l-section l-section--wide" aria-label="Dashboard preview">
      <div
        ref={dashboardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        className="l-preview-window"
        style={{ transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.01)` }}
      >
        <div className="l-preview-titlebar">
          {['#ef4444','#f59e0b','#22c55e'].map(c => (
            <div key={c} className="l-preview-dot" style={{ background: c }} />
          ))}
          <span className="l-preview-url">axiora.app</span>
        </div>

        <div style={{ display: 'flex', minHeight: 380 }}>
          <div className="landing-preview-sidebar" style={{ width: 200, borderRight: '1px solid #111', padding: '1.5rem 0', background: '#060606' }}>
            <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-accent 2s infinite' }} />
              <span style={{ fontSize: 13, letterSpacing: '0.1em', color: '#555', fontFamily: mono, fontWeight: 500 }}>AXIORA</span>
            </div>
            {sidebarItems.map((item, i) => (
              <div key={item} className="l-preview-sidebar-item" style={{
                color: i === 0 ? '#e8e4dc' : '#333',
                borderLeft: i === 0 ? '2px solid #7c3aed' : '2px solid transparent',
                fontWeight: i === 0 ? 500 : 400
              }}>
                {item}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, padding: '1.75rem' }}>
            <div className="landing-preview-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
              {[[dp?.activeAgents || 'AGENTS ACTIUS','3'],[dp?.conversations || 'CONVERSES','142'],[dp?.messagesToday || 'MISSATGES AVUI','28']].map(([label, value]) => (
                <div key={label} className="l-preview-stat">
                  <div className="l-preview-stat-label">{label}</div>
                  <div className="l-preview-stat-value">{value}</div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#333', marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid #0f0f0f', fontFamily: mono }}>
              {dp?.recentActivity || 'ACTIVITAT RECENT'}
            </div>

            {[
              { agent: dp?.conv1agent || 'Support Agent', msg: dp?.conv1msg || 'Hi, I have a problem with my order...', status: 'OPEN' },
              { agent: dp?.conv2agent || 'Sales Agent', msg: dp?.conv2msg || "I'm interested in your Pro plan...", status: 'OPEN' },
              { agent: dp?.conv3agent || 'Support Agent', msg: dp?.conv3msg || 'When will my shipment arrive?', status: 'OPEN' },
            ].map((conv, i) => (
              <div key={i} className="l-preview-conv">
                <div>
                  <div className="l-preview-conv-agent">{conv.agent}</div>
                  <div className="l-preview-conv-msg">{conv.msg}</div>
                </div>
                <div className="l-preview-conv-badge">{conv.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: '#2a2a2a', fontFamily: mono }}>
        {dp?.caption || "Dashboard real d'Axiora"}
      </div>
    </FadeSection>
  )
}
