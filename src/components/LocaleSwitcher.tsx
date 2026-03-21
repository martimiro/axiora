'use client'
import { useLocale } from '@/lib/useLocale'

export default function LocaleSwitcher() {
  const { locale, setLocale } = useLocale()

  return (
    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
      {(['ca', 'es', 'en'] as const).map(l => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          style={{
            background: 'transparent',
            border: `1px solid ${locale === l ? '#4ade80' : '#222'}`,
            color: locale === l ? '#4ade80' : '#444',
            padding: '2px 8px',
            borderRadius: 2,
            fontSize: 9,
            fontFamily: "'IBM Plex Mono', monospace",
            letterSpacing: '0.1em',
            cursor: 'pointer'
          }}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
