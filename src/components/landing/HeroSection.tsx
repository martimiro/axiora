'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ParticlesCanvas, useReducedMotion } from './shared'
import type { LandingMessages } from './types'

export default function HeroSection({ m, visible }: { m: LandingMessages; visible: boolean }) {
  const reduced = useReducedMotion()
  const fullText = m.hero?.title2 || 'per intel·ligència artificial'
  const [typed, setTyped] = useState('')
  const [cursorOn, setCursorOn] = useState(true)
  const h = m.hero

  useEffect(() => {
    if (reduced) return
    const timer = setInterval(() => setCursorOn(v => !v), 500)
    return () => clearInterval(timer)
  }, [reduced])

  useEffect(() => {
    if (reduced) { setTyped(fullText); return }
    let i = 0
    setTyped('')
    const timer = setInterval(() => {
      i++
      setTyped(fullText.slice(0, i))
      if (i >= fullText.length) clearInterval(timer)
    }, 60)
    return () => clearInterval(timer)
  }, [fullText, reduced])

  const fadeStyle = (delay: number) => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    transition: `opacity 0.8s ease ${delay}s, transform 0.8s ease ${delay}s`
  })

  return (
    <section className="l-hero landing-hero" aria-labelledby="hero-heading">
      <div className="l-hero-glow" aria-hidden="true" />
      <ParticlesCanvas />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={fadeStyle(0.2)}>
          <div className="l-hero-badge">
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'pulse-accent 2s infinite' }} aria-hidden="true" />
            {h?.badge || "AGENTS D'IA PER A EMPRESES"}
          </div>
        </div>
        <div style={fadeStyle(0.35)}>
          <h1 id="hero-heading" className="l-hero-title landing-hero-title">
            {h?.title1 || 'El teu Gmail gestionat'}<br />
            <span className="l-hero-gradient">
              {typed}
              <span style={{ opacity: cursorOn ? 1 : 0, transition: 'opacity 0.1s', WebkitTextFillColor: '#8b5cf6' }} aria-hidden="true">|</span>
            </span>
          </h1>
        </div>
        <div style={fadeStyle(0.5)}>
          <p className="l-hero-desc landing-hero-desc">
            {h?.description || "Axiora connecta agents d'IA a la teva safata d'entrada. Llegeixen, classifiquen i responen emails automàticament."}
          </p>
        </div>
        <div style={fadeStyle(0.65)}>
          <div className="l-hero-cta landing-hero-cta">
            <Link href="/register" className="btn-primary" style={{ background: '#7c3aed', color: '#fff', padding: '0.875rem 2.5rem', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              {h?.ctaPrimary || 'Crear compte gratis'}
            </Link>
            <a href="#com-funciona" className="btn-outline" style={{ background: 'transparent', color: '#888', padding: '0.875rem 2.5rem', borderRadius: 10, fontSize: 14, textDecoration: 'none', border: '1px solid #222' }}>
              {h?.ctaSecondary || 'Veure com funciona'}
            </a>
          </div>
          <div className="l-hero-note">{h?.noCard || 'Sense targeta de crèdit · Configura en 5 minuts'}</div>
        </div>
      </div>
    </section>
  )
}
