'use client'
import { useState } from 'react'
import Link from 'next/link'
import LocaleSwitcher from '@/components/LocaleSwitcher'
import type { LandingMessages } from './types'

export default function Navbar({ m, visible }: { m: LandingMessages; visible: boolean }) {
  const [mobileNav, setMobileNav] = useState(false)
  const n = m.nav

  const links: [string, string][] = [
    ['#com-funciona', n?.howItWorks || 'COM FUNCIONA'],
    ['#casos-us', n?.useCases || "CASOS D'ÚS"],
    ['#preus', n?.pricing || 'PREUS'],
    ['#faq', n?.faq || 'FAQ'],
  ]

  return (
    <nav
      className="l-nav landing-nav"
      role="navigation"
      aria-label="Main navigation"
      style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.6s ease' }}
    >
      <div className="l-nav-brand">
        <div className="l-nav-brand-dot" aria-hidden="true" />
        <span className="l-nav-brand-text">AXIORA</span>
      </div>

      <button
        className="landing-hamburger"
        onClick={() => setMobileNav(!mobileNav)}
        aria-expanded={mobileNav}
        aria-controls="nav-links"
        aria-label={mobileNav ? 'Close menu' : 'Open menu'}
        style={{
          background: 'none', border: '1px solid #222', borderRadius: 6,
          color: '#888', fontSize: 18, cursor: 'pointer', width: 36, height: 36,
          alignItems: 'center', justifyContent: 'center'
        }}
      >
        {mobileNav ? '✕' : '☰'}
      </button>

      <div
        id="nav-links"
        className={`landing-nav-links${mobileNav ? ' open' : ''}`}
        style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}
      >
        {links.map(([href, label]) => (
          <a key={href} href={href} className="nav-link l-nav-link" onClick={() => setMobileNav(false)}>
            {label}
          </a>
        ))}
        <Link href="/login" className="nav-link l-nav-link" onClick={() => setMobileNav(false)}>
          {n?.login || 'Entrar'}
        </Link>
        <LocaleSwitcher />
        <Link
          href="/register"
          className="btn-primary"
          onClick={() => setMobileNav(false)}
          style={{
            background: '#7c3aed', color: '#fff', padding: '0.55rem 1.25rem',
            borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500, textAlign: 'center'
          }}
        >
          {n?.startFree || 'Començar gratis'}
        </Link>
      </div>
    </nav>
  )
}
