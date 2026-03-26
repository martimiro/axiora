'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LocaleSwitcher from '@/components/LocaleSwitcher'

type Messages = { auth: Record<string, string> }

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [m, setM] = useState<Messages | null>(null)
  const router = useRouter()

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../../messages/${locale}.json`).then(mod => setM(mod.default))
  }, [])

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
      setError(data.error || 'Error')
      setLoading(false)
    }
  }

  const t = m?.auth

  return (
    <main style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace" }}>
      <div className="auth-card" style={{ width: 360, border: '1px solid #1a1a1a', borderRadius: 4, padding: '2.5rem', background: '#0f0f0f' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
            <span style={{ fontSize: 12, letterSpacing: '0.2em', color: '#888' }}>AXIORA</span>
          </div>
          <LocaleSwitcher />
        </div>
        <div style={{ fontSize: 14, letterSpacing: '0.15em', color: '#d4d0c8', marginBottom: '0.5rem' }}>{t?.loginTitle || 'BENVINGUT'}</div>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', color: '#444', marginBottom: '2rem' }}>{t?.loginSubtitle || 'Inicia sessió al teu compte'}</div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>{t?.email || 'EMAIL'}</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={{ width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box' as any }} />
          </div>
          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>{t?.password || 'CONTRASENYA'}</div>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={{ width: '100%', background: '#080808', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.6rem 0.875rem', color: '#d4d0c8', fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", outline: 'none', boxSizing: 'border-box' as any }} />
          </div>
          {error && <div style={{ fontSize: 11, color: '#ef4444' }}>{error}</div>}
          <button type="submit" disabled={loading} style={{ background: loading ? '#1a1a1a' : '#d4d0c8', color: '#080808', border: 'none', borderRadius: 4, padding: '0.7rem', fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.12em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '0.5rem' }}>
            {loading ? '...' : (t?.loginBtn || 'ENTRAR')}
          </button>
          <div style={{ textAlign: 'center', fontSize: 10, color: '#444', marginTop: '0.5rem' }}>
            {t?.noAccount || 'Sense compte?'}{' '}
            <a href="/register" style={{ color: '#888', textDecoration: 'none' }}>{t?.register || 'REGISTRA\'T'}</a>
          </div>
        </form>
      </div>
    </main>
  )
}