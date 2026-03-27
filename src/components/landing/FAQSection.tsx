'use client'
import { useState } from 'react'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

function FAQItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)
  const btnId = `faq-btn-${index}`
  const panelId = `faq-panel-${index}`
  return (
    <div className="l-faq-item" role="listitem">
      <button
        id={btnId}
        className="l-faq-trigger"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="l-faq-question">{question}</span>
        <span className={`l-faq-icon${open ? ' l-faq-icon--open' : ''}`} aria-hidden="true">+</span>
      </button>
      <div
        id={panelId}
        className={`l-faq-answer${open ? ' l-faq-answer--open' : ''}`}
        role="region"
        aria-labelledby={btnId}
      >
        <div className="l-faq-answer-text">{answer}</div>
      </div>
    </div>
  )
}

export default function FAQSection({ m }: { m: LandingMessages }) {
  const fq = m.faq
  const items = [
    { q: fq?.q1 || '', a: fq?.a1 || '' },
    { q: fq?.q2 || '', a: fq?.a2 || '' },
    { q: fq?.q3 || '', a: fq?.a3 || '' },
    { q: fq?.q4 || '', a: fq?.a4 || '' },
    { q: fq?.q5 || '', a: fq?.a5 || '' },
    { q: fq?.q6 || '', a: fq?.a6 || '' },
  ]

  return (
    <FadeSection id="faq" className="l-section l-section--alt" aria-labelledby="faq-heading">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        <div className="l-label">{fq?.label || 'FAQ'}</div>
        <h2 id="faq-heading" className="l-heading" style={{ marginBottom: '3.5rem' }}>
          {fq?.title || 'Preguntes freqüents'}
        </h2>
        <div role="list">
          {items.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} index={i} />
          ))}
        </div>
      </div>
    </FadeSection>
  )
}
