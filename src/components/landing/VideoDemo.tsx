'use client'
import { FadeSection } from './shared'
import type { LandingMessages } from './types'

export default function VideoDemo({ m }: { m: LandingMessages }) {
  const v = m.videoDemo

  return (
    <FadeSection className="l-section l-section--wide" aria-labelledby="video-heading">
      <div className="l-label">{v?.label || 'DEMOSTRACIÓ'}</div>
      <h2 id="video-heading" className="l-heading">
        {v?.title || 'Veu com funciona en 2 minuts'}
      </h2>
      <div
        className="l-video-container"
        role="img"
        aria-label={v?.playLabel || 'Reproduir demostració'}
      >
        <div className="l-video-bg" aria-hidden="true" />
        {/* Simulated video thumbnail with terminal-style content */}
        <div style={{ position: 'absolute', inset: 0, padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.5 }} />
            ))}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', opacity: 0.3 }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>{v?.line1 || '$ axiora connect --gmail'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7c3aed' }}>{v?.line2 || '✓ Gmail connected successfully'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>{v?.line3 || '$ axiora agent create --template support'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#7c3aed' }}>{v?.line4 || '✓ Agent "Support Agent" is now active'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#555' }}>{v?.line5 || '$ axiora status'}</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: '#22c55e' }}>{v?.line6 || '● 3 agents running · 142 emails processed today'}</div>
          </div>
        </div>
        <div className="l-video-overlay">
          <div className="l-video-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </div>
          <div className="l-video-label">{v?.playLabel || 'Reproduir demostració'} · {v?.duration || '2:14'}</div>
        </div>
      </div>
    </FadeSection>
  )
}
