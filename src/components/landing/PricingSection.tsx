'use client'
import { useState } from 'react'
import Link from 'next/link'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function PricingSection({ m }: { m: LandingMessages }) {
  const [annual, setAnnual] = useState(false)
  const pr = m.pricing
  const prices = { basic: annual ? Math.round(29 * 0.85) : 29, pro: annual ? Math.round(99 * 0.85) : 99, enterprise: annual ? Math.round(399 * 0.85) : 399 }

  const plans = [
    { plan: pr?.basic || 'BÀSIC', price: prices.basic, originalPrice: 29, desc: pr?.basicDesc || 'Per començar', features: pr?.basicFeatures || [], highlighted: false },
    { plan: pr?.pro || 'PRO', price: prices.pro, originalPrice: 99, desc: pr?.proDesc || 'El més popular', features: pr?.proFeatures || [], highlighted: true },
    { plan: pr?.enterprise || 'ENTERPRISE', price: prices.enterprise, originalPrice: 399, desc: pr?.enterpriseDesc || 'Per a grans equips', features: pr?.enterpriseFeatures || [], highlighted: false },
  ]

  return (
    <FadeSection id="preus" className="l-section" aria-labelledby="pricing-heading">
      <div className="l-label">{pr?.label || 'PREUS'}</div>
      <h2 id="pricing-heading" className="l-heading" style={{ marginBottom: '0.75rem' }}>
        {pr?.title || 'Simple i transparent'}
      </h2>
      <div className="l-subheading">{pr?.subtitle || 'Sense permanències · Cancel·la quan vulguis'}</div>

      <div className="l-pricing-toggle" role="group" aria-label="Billing period">
        <span className="l-pricing-toggle-label" style={{ color: !annual ? '#e8e4dc' : '#444' }}>{pr?.monthly || 'Mensual'}</span>
        <button
          onClick={() => setAnnual(!annual)}
          className="l-pricing-toggle-track"
          style={{ background: annual ? '#7c3aed' : '#222' }}
          role="switch"
          aria-checked={annual}
          aria-label="Toggle annual billing"
        >
          <div className="l-pricing-toggle-thumb" style={{ left: annual ? 25 : 3 }} />
        </button>
        <span className="l-pricing-toggle-label" style={{ color: annual ? '#e8e4dc' : '#444' }}>
          {pr?.annual || 'Anual'}
          <span className="l-pricing-discount">{pr?.discount || '-15%'}</span>
        </span>
      </div>

      <div className="landing-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {plans.map(item => (
          <div key={item.plan} className="card-hover l-pricing-card" style={{
            background: item.highlighted ? '#7c3aed0f' : '#0a0a0a',
            border: `1px solid ${item.highlighted ? '#7c3aed55' : '#1a1a1a'}`
          }}>
            {item.highlighted && <div className="l-pricing-popular">{pr?.popular || 'MOST POPULAR'}</div>}
            <div className="l-pricing-name">{item.plan}</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <div className="l-pricing-price">{item.price}€</div>
              {annual && <div className="l-pricing-original">{item.originalPrice}€</div>}
            </div>
            <div style={{ fontSize: 13, color: '#555', marginBottom: annual ? '0.5rem' : '1.75rem' }}>
              {pr?.perMonth || '/ mes'} · {item.desc}
            </div>
            {annual && (
              <div style={{ fontSize: 11, color: '#8b5cf6', marginBottom: '1.5rem' }}>
                {pr?.billedAnnually || 'Facturat anualment'} ({item.price * 12}€/any)
              </div>
            )}
            {(item.features as string[]).map((f: string) => (
              <div key={f} className="l-pricing-feature">
                <span className="l-pricing-check" aria-hidden="true">✓</span> {f}
              </div>
            ))}
            <Link href="/register" className="btn-primary" style={{
              display: 'block', textAlign: 'center', marginTop: '2rem',
              background: item.highlighted ? '#7c3aed' : 'transparent',
              color: item.highlighted ? '#fff' : '#666',
              padding: '0.875rem', borderRadius: 8, fontSize: 13, textDecoration: 'none',
              border: item.highlighted ? 'none' : '1px solid #222',
              fontWeight: item.highlighted ? 600 : 400
            }}>
              {pr?.start || 'Començar'}
            </Link>
          </div>
        ))}
      </div>
    </FadeSection>
  )
}
