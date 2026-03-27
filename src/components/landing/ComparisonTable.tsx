'use client'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function ComparisonTable({ m }: { m: LandingMessages }) {
  const c = m.comparison

  const rows = [
    { feature: c?.row1 || 'Temps de resposta', before: c?.row1before || '2-24 hores', after: c?.row1after || '< 30 segons' },
    { feature: c?.row2 || 'Disponibilitat', before: c?.row2before || 'Horari laboral', after: c?.row2after || '24/7 · 365 dies' },
    { feature: c?.row3 || "Classificació d'emails", before: c?.row3before || 'Manual', after: c?.row3after || 'Automàtica amb IA' },
    { feature: c?.row4 || 'Cost per ticket', before: c?.row4before || '~8€ per ticket', after: c?.row4after || '~0.15€ per ticket' },
    { feature: c?.row5 || 'Escalabilitat', before: c?.row5before || "Limitat per l'equip", after: c?.row5after || 'Il·limitada' },
    { feature: c?.row6 || 'Errors humans', before: c?.row6before || 'Freqüents', after: c?.row6after || 'Quasi zero' },
  ]

  return (
    <FadeSection className="l-section" aria-labelledby="comparison-heading">
      <div className="l-label">{c?.label || 'COMPARACIÓ'}</div>
      <h2 id="comparison-heading" className="l-heading">
        {c?.title || 'Abans vs. Després d\'Axiora'}
      </h2>
      <div className="l-comparison">
        <div style={{ border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden', background: '#0a0a0a' }}>
          <table className="l-comparison-table" role="table">
            <thead>
              <tr>
                <th scope="col">{c?.feature || 'FUNCIONALITAT'}</th>
                <th scope="col">{c?.before || 'SENSE AXIORA'}</th>
                <th scope="col">{c?.after || 'AMB AXIORA'}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td>{row.feature}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="l-check l-check--bad" aria-hidden="true">✕</span>
                      {row.before}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="l-check l-check--good" aria-hidden="true">✓</span>
                      {row.after}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </FadeSection>
  )
}
