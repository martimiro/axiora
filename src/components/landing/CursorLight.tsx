'use client'
import { useState, useEffect } from 'react'
import { useReducedMotion } from './shared'

export default function CursorLight() {
  const reduced = useReducedMotion()
  const [pos, setPos] = useState({ x: -500, y: -500 })
  useEffect(() => {
    if (reduced) return
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [reduced])

  if (reduced) return null

  return (
    <div
      className="l-cursor-light"
      aria-hidden="true"
      style={{ background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(124,58,237,0.07) 0%, transparent 60%)` }}
    />
  )
}
