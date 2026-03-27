'use client'
import { FadeSection, AnimatedCounter } from './shared'
import type { LandingMessages } from './types'

export default function StatsSection({ m }: { m: LandingMessages }) {
  const s = m.stats
  const items = [
    { value: 94, suffix: '%', label: s?.s2l || 'Emails resolts automàticament' },
    { value: 3, suffix: 'h', label: s?.s1l || 'Estalvi diari per empresa' },
    { value: 5, suffix: 'min', label: s?.s3l || 'Temps de configuració' },
    { value: 500, suffix: '+', label: s?.s4l || 'Empreses confien en Axiora' },
  ]

  return (
    <FadeSection className="l-stats" aria-label="Key statistics">
      <div className="l-stats-grid social-proof-container">
        {items.map((item, i) => (
          <div key={i} className="social-proof-item" style={{ flex: 1 }}>
            <div className="l-stat-value">
              <AnimatedCounter target={item.value} suffix={item.suffix} />
            </div>
            <div className="l-stat-label">{item.label}</div>
          </div>
        ))}
      </div>
    </FadeSection>
  )
}
