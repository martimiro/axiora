'use client'
import { FadeSection, useReducedMotion } from './shared'
import type { LandingMessages } from './types'

const logos = ['Gmail', 'Slack', 'Notion', 'HubSpot', 'Salesforce', 'Stripe', 'Shopify', 'Intercom', 'Zendesk', 'Pipedrive']

export default function LogoCarousel({ m }: { m: LandingMessages }) {
  const reduced = useReducedMotion()
  const lc = m.logoCarousel
  const doubled = [...logos, ...logos]
  return (
    <FadeSection className="l-logos" aria-label="Integrations">
      <div className="l-logos-label">{lc?.label || 'INTEGRA AMB LES EINES QUE JA USES'}</div>
      <div className="l-logos-track">
        <div className="l-logos-inner" aria-hidden="true" style={reduced ? { animationPlayState: 'paused' } : undefined}>
          {doubled.map((logo, i) => (
            <div key={i} className="l-logo-chip">{logo}</div>
          ))}
        </div>
      </div>
    </FadeSection>
  )
}
