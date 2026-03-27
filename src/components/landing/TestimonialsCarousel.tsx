'use client'
import { FadeSection, useReducedMotion } from './shared'
import type { LandingMessages } from './types'

type Testimonial = { quote: string; name: string; role: string; initial: string }

function CarouselTrack({ testimonials, paused }: { testimonials: Testimonial[]; paused: boolean }) {
  const doubled = [...testimonials, ...testimonials]
  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '1.5rem', animation: 'scroll-logos 40s linear infinite', animationPlayState: paused ? 'paused' : 'running', width: 'max-content', alignItems: 'stretch' }} aria-hidden="true">
        {doubled.map((t, i) => (
          <div key={i} className="l-testimonial-card">
            <div className="l-testimonial-quote-mark" aria-hidden="true">&ldquo;</div>
            <div className="l-testimonial-text">{t.quote}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="l-testimonial-avatar">{t.initial}</div>
              <div>
                <div className="l-testimonial-name">{t.name}</div>
                <div className="l-testimonial-role">{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TestimonialsCarousel({ m }: { m: LandingMessages }) {
  const reduced = useReducedMotion()
  const t = m.testimonials

  const data: Testimonial[] = [
    { quote: t?.t1quote || '', name: t?.t1name || 'Carlos M.', role: t?.t1role || 'CEO · E-commerce', initial: 'C' },
    { quote: t?.t2quote || '', name: t?.t2name || 'Laura G.', role: t?.t2role || "Directora d'Operacions", initial: 'L' },
    { quote: t?.t3quote || '', name: t?.t3name || 'Miquel T.', role: t?.t3role || 'Sales Manager', initial: 'M' },
    { quote: t?.t4quote || '', name: t?.t4name || 'Marc R.', role: t?.t4role || 'CTO · SaaS', initial: 'M' },
    { quote: t?.t5quote || '', name: t?.t5name || 'Sofia P.', role: t?.t5role || 'Fundadora · E-learning', initial: 'S' },
    { quote: t?.t6quote || '', name: t?.t6name || 'Joan V.', role: t?.t6role || 'Operations Manager', initial: 'J' },
  ]

  return (
    <FadeSection className="l-testimonials" aria-label="Customer testimonials">
      <div className="l-testimonials-label">{t?.label || 'EL QUE DIUEN ELS NOSTRES CLIENTS'}</div>
      <CarouselTrack testimonials={data} paused={reduced} />
      {/* Screen reader accessible list */}
      <div className="sr-only" role="list">
        {data.map((item, i) => (
          <div key={i} role="listitem">{item.quote} — {item.name}, {item.role}</div>
        ))}
      </div>
    </FadeSection>
  )
}
