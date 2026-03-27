export default function LoadingSkeleton() {
  return (
    <div className="l-skeleton" role="status" aria-label="Loading">
      {/* Nav skeleton */}
      <div style={{ width: '100%', padding: '1.1rem 3rem', borderBottom: '1px solid #111', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="l-skeleton-bar" style={{ width: 100, height: 16 }} />
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <div className="l-skeleton-bar" style={{ width: 80, height: 12 }} />
          <div className="l-skeleton-bar" style={{ width: 80, height: 12 }} />
          <div className="l-skeleton-bar" style={{ width: 100, height: 32, borderRadius: 8 }} />
        </div>
      </div>

      {/* Hero skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '6rem 2rem', maxWidth: 700 }}>
        <div className="l-skeleton-bar" style={{ width: 180, height: 24, borderRadius: 20 }} />
        <div className="l-skeleton-bar" style={{ width: '100%', maxWidth: 500, height: 52 }} />
        <div className="l-skeleton-bar" style={{ width: '100%', maxWidth: 440, height: 52 }} />
        <div className="l-skeleton-bar" style={{ width: '80%', height: 16 }} />
        <div className="l-skeleton-bar" style={{ width: '60%', height: 16 }} />
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <div className="l-skeleton-bar" style={{ width: 160, height: 44, borderRadius: 10 }} />
          <div className="l-skeleton-bar" style={{ width: 160, height: 44, borderRadius: 10 }} />
        </div>
      </div>

      {/* Stats skeleton */}
      <div style={{ width: '100%', borderTop: '1px solid #111', padding: '3rem 2rem', display: 'flex', justifyContent: 'center', gap: '4rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
            <div className="l-skeleton-bar" style={{ width: 60, height: 36 }} />
            <div className="l-skeleton-bar" style={{ width: 120, height: 12 }} />
          </div>
        ))}
      </div>

      <span className="sr-only">Loading page content...</span>
    </div>
  )
}
