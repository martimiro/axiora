'use client'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function HowItWorks({ m }: { m: LandingMessages }) {
  const hw = m.howItWorks
  const steps = [
    { step: '01', title: hw?.step1title || 'Connecta el teu Gmail', desc: hw?.step1desc || '', detail: hw?.step1detail || 'Segur · OAuth 2.0' },
    { step: '02', title: hw?.step2title || 'Configura el teu agent', desc: hw?.step2desc || '', detail: hw?.step2detail || 'Sense codi · 2 minuts' },
    { step: '03', title: hw?.step3title || "L'agent treballa", desc: hw?.step3desc || '', detail: hw?.step3detail || 'Automàtic · 24/7' },
  ]

  return (
    <FadeSection id="com-funciona" className="l-section l-section--alt" aria-labelledby="how-heading">
      <div className="l-label">{hw?.label || 'PROCÉS'}</div>
      <h2 id="how-heading" className="l-heading" style={{ marginBottom: '3.5rem' }}>
        {hw?.title || 'Configurat en 3 passos'}
      </h2>
      <div className="landing-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
        {steps.map(item => (
          <div key={item.step} className="card-hover" style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12 }}>
            <div className="l-step-num">{item.step}</div>
            <div className="l-step-title">{item.title}</div>
            <div className="l-step-desc">{item.desc}</div>
            <div className="l-step-detail">{item.detail}</div>
          </div>
        ))}
      </div>
    </FadeSection>
  )
}
