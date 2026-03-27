'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { LandingMessages } from './types'

export default function CookieConsent({ m }: { m: LandingMessages }) {
  const [visible, setVisible] = useState(false)
  const c = m.cookieConsent
  const acceptRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (visible) acceptRef.current?.focus()
  }, [visible])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, a[href]')
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookie-consent', 'accepted')
    setVisible(false)
  }

  const handleDecline = () => {
    localStorage.setItem('cookie-consent', 'declined')
    setVisible(false)
  }

  return (
    <div
      ref={dialogRef}
      className={`l-cookie${visible ? ' l-cookie--visible' : ''}`}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal={visible ? 'true' : undefined}
      onKeyDown={handleKeyDown}
    >
      <p className="l-cookie-text">
        {c?.text || 'Utilitzem cookies per millorar la teva experiència. Consulta la nostra'}{' '}
        <a href="#" onClick={e => e.preventDefault()}>{c?.policyLink || 'política de cookies'}</a>.
      </p>
      <div className="l-cookie-actions">
        <button className="l-cookie-btn l-cookie-btn--decline" onClick={handleDecline}>
          {c?.decline || 'Rebutjar'}
        </button>
        <button ref={acceptRef} className="l-cookie-btn l-cookie-btn--accept" onClick={handleAccept}>
          {c?.accept || 'Acceptar'}
        </button>
      </div>
    </div>
  )
}
