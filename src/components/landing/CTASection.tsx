'use client'
import Link from 'next/link'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function CTASection({ m }: { m: LandingMessages }) {
  const ct = m.cta
  return (
    <FadeSection className="l-cta" aria-labelledby="cta-heading">
      <div style={{ maxWidth: 580, margin: '0 auto' }}>
        <div className="l-cta-dot" aria-hidden="true" />
        <h2 id="cta-heading" className="l-cta-title">{ct?.title || 'Comença avui, gratis'}</h2>
        <div className="l-cta-desc">
          {ct?.desc1 || 'Sense targeta de crèdit. Sense contractes.'}<br />
          {ct?.desc2 || 'Configura el teu primer agent en 5 minuts.'}
        </div>
        <Link href="/register" className="btn-primary" style={{
          background: '#7c3aed', color: '#fff', padding: '1rem 3rem',
          borderRadius: 10, fontSize: 15, textDecoration: 'none', fontWeight: 600,
          display: 'inline-block'
        }}>
          {ct?.button || 'Crear compte gratis'}
        </Link>
        <div className="l-cta-contact">{ct?.contact || 'Preguntes? Escriu-nos a hola@axiora.ai'}</div>
      </div>
    </FadeSection>
  )
}
