'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (res.ok) {
      router.push('/')
    } else {
      const data = await res.json()
      setError(data.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div style={{ width: 360, border: '1px solid #1a1a1a', borderRadius: 4, padding: '2.5rem', background: '#0f0f0f' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '2rem' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ fontSize: 12, letterSpacing: '0.2em', color: '#888' }}>AXIORA</span>
        </div>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#444', marginBottom: '2rem' }}>ACCESO AL SISTEMA</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>EMAIL</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box' as any }} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>CONTRASEÑA</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box' as any }} />
          </div>
          {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? '#1a1a1a' : '#d4d0c8', color: '#080808', border: 'none', borderRadius: 4, padding: '0.7rem', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.12em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
            {loading ? 'VERIFICANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </main>
  )
}
