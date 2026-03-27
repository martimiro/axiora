'use client'
import { useState } from 'react'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function UseCaseTabs({ m }: { m: LandingMessages }) {
  const [active, setActive] = useState(0)
  const at = m.agentTypes

  const cases = [
    {
      label: at?.support || 'SUPORT',
      title: at?.supportTitle || 'Agent de suport',
      items: (at?.supportItems || []) as string[],
      example: {
        from: 'client@empresa.com', subject: 'Problema amb la comanda #1234',
        body: 'Hola, he rebut un producte defectuós i necessito una substitució urgent...',
        reply: "Hola! Lamento l'inconvenient. He creat el tiquet #5678 i processem la substitució immediatament. Rebràs el nou producte en 24-48h sense cost addicional."
      }
    },
    {
      label: at?.sales || 'VENDES',
      title: at?.salesTitle || 'Agent de vendes',
      items: (at?.salesItems || []) as string[],
      example: {
        from: 'lead@startup.io', subject: 'Interessat en els vostres plans',
        body: "Hola, som una startup de 15 persones i m'agradaria saber més sobre el pla Pro...",
        reply: "Hola! El pla Pro és perfecte per al vostre equip — 5 agents i 5.000 emails/mes. Et proposo una demo de 20 min aquesta setmana. Quan t'aniria bé?"
      }
    },
    {
      label: at?.admin || 'ADMIN',
      title: at?.adminTitle || 'Agent administratiu',
      items: (at?.adminItems || []) as string[],
      example: {
        from: 'rrhh@empresa.com', subject: 'Sol·licitud de vacances - Juny',
        body: 'Bon dia, voldria sol·licitar vacances del 10 al 20 de juny per motius personals...',
        reply: "Sol·licitud registrada ✓ Dates: 10-20 juny (8 dies laborables). He actualitzat el calendari d'equip, notificat al responsable i enviat confirmació per email."
      }
    },
  ]
  const current = cases[active]

  return (
    <FadeSection id="casos-us" className="l-section" aria-labelledby="usecases-heading">
      <div className="l-label">{at?.useCasesLabel || "CASOS D'ÚS"}</div>
      <h2 id="usecases-heading" className="l-heading">{at?.useCasesTitle || 'Veu-ho en acció'}</h2>

      <div role="tablist" aria-label="Use case types" style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
        {cases.map((c, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={active === i}
            aria-controls={`tabpanel-${i}`}
            onClick={() => setActive(i)}
            className={`l-tab-btn${active === i ? ' l-tab-btn--active' : ''}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`tabpanel-${active}`} aria-label={current.title} className="landing-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 20, color: '#e8e4dc', fontWeight: 600, marginBottom: '1.5rem' }}>{current.title}</div>
          {current.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div className="l-tab-feature-check" aria-hidden="true">
                <span style={{ color: '#8b5cf6', fontSize: 10 }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: '#666', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
        <div className="l-tab-email-window">
          <div className="l-tab-email-bar">
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
            <span style={{ fontSize: 10, color: '#333', marginLeft: '0.5rem', fontFamily: 'var(--mono)' }}>Gmail</span>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: 11, color: '#444', marginBottom: '0.25rem' }}>De: <span style={{ color: '#666' }}>{current.example.from}</span></div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: '1rem', fontWeight: 500 }}>{current.example.subject}</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111' }}>{current.example.body}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div className="l-tab-agent-dot" aria-hidden="true" />
              <span className="l-tab-agent-label">{at?.agentResponding || 'AGENT RESPONENT'}</span>
            </div>
            <div className="l-tab-reply">{current.example.reply}</div>
          </div>
        </div>
      </div>
    </FadeSection>
  )
}
