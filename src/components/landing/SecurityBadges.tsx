'use client'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function SecurityBadges({ m }: { m: LandingMessages }) {
  const s = m.security

  const badges = [
    { icon: '🔐', title: s?.badge1title || 'OAuth 2.0', desc: s?.badge1desc || "Autenticació segura de Google sense emmagatzemar contrasenyes" },
    { icon: '🔒', title: s?.badge2title || 'Xifrat TLS', desc: s?.badge2desc || 'Totes les comunicacions xifrades en trànsit i en repòs' },
    { icon: '🛡️', title: s?.badge3title || 'RGPD', desc: s?.badge3desc || 'Compliment total del Reglament General de Protecció de Dades' },
    { icon: '⚡', title: s?.badge4title || '99.9% Uptime', desc: s?.badge4desc || 'Infraestructura redundant amb garantia de disponibilitat' },
  ]

  return (
    <FadeSection className="l-section" aria-labelledby="security-heading">
      <div className="l-label">{s?.label || 'SEGURETAT'}</div>
      <h2 id="security-heading" className="l-heading">
        {s?.title || 'Les teves dades, sempre protegides'}
      </h2>
      <div className="l-security-grid" role="list">
        {badges.map((badge, i) => (
          <div key={i} className="l-security-badge" role="listitem">
            <div className="l-security-icon" aria-hidden="true">{badge.icon}</div>
            <div className="l-security-title">{badge.title}</div>
            <div className="l-security-desc">{badge.desc}</div>
          </div>
        ))}
      </div>
    </FadeSection>
  )
}
