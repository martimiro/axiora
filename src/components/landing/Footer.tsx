'use client'
import Link from 'next/link'
import type { LandingMessages } from './types'

export default function Footer({ m }: { m: LandingMessages }) {
  const ft = m.footer
  return (
    <footer className="l-footer landing-footer" role="contentinfo">
      <div className="l-footer-top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.75rem' }}>
            <div className="l-footer-brand-dot" aria-hidden="true" />
            <span className="l-footer-brand-text">AXIORA</span>
          </div>
          <div style={{ fontSize: 12, color: '#333', maxWidth: 260, lineHeight: 1.6 }}>
            {ft?.tagline || "Automatitza la teva safata d'entrada amb agents d'IA intel·ligents."}
          </div>
        </div>
        <div className="l-footer-links">
          <div>
            <div className="l-footer-col-title">{ft?.productCol || 'PRODUCTE'}</div>
            <a href="#com-funciona" className="l-footer-link">{ft?.howItWorks || 'Com funciona'}</a>
            <a href="#preus" className="l-footer-link">{ft?.pricing || 'Preus'}</a>
            <a href="#faq" className="l-footer-link">{ft?.faq || 'FAQ'}</a>
          </div>
          <div>
            <div className="l-footer-col-title">{ft?.resourcesCol || 'RECURSOS'}</div>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.blog || 'Blog'}</a>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.docs || 'Documentació'}</a>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.changelog || 'Changelog'}</a>
          </div>
          <div>
            <div className="l-footer-col-title">{ft?.legalCol || 'LEGAL'}</div>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.privacy || 'Privacitat'}</a>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.terms || 'Termes'}</a>
            <a href="#" className="l-footer-link" onClick={e => e.preventDefault()}>{ft?.cookies || 'Cookies'}</a>
          </div>
        </div>
      </div>
      <div className="l-footer-bottom">
        <div className="l-footer-copy">{ft?.rights || '© 2026 Axiora · Tots els drets reservats'}</div>
        <div className="l-footer-bottom-links">
          <Link href="/login" className="l-footer-link">{ft?.login || 'Entrar'}</Link>
          <Link href="/register" className="l-footer-link">{ft?.register || 'Registrar-se'}</Link>
        </div>
      </div>
    </footer>
  )
}
