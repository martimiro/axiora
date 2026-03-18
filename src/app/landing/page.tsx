import Link from 'next/link'

export default function Landing() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace" }}>
      
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1a1a1a', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
          <span style={{ fontSize: 12, letterSpacing: '0.2em', color: '#888' }}>AXIORA</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>ENTRAR</Link>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '0.5rem 1rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em' }}>EMPEZAR GRATIS</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 800, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#4ade80', marginBottom: '1.5rem' }}>AGENTES DE IA PARA EMPRESAS</div>
        <h1 style={{ fontSize: 48, fontWeight: 500, lineHeight: 1.15, marginBottom: '1.5rem', color: '#e8e4dc' }}>
          Tu bandeja de entrada,<br />gestionada por IA
        </h1>
        <p style={{ fontSize: 16, color: '#555', lineHeight: 1.8, marginBottom: '2.5rem', maxWidth: 560, margin: '0 auto 2.5rem' }}>
          Axiora conecta agentes de inteligencia artificial a tu Gmail. Leen, clasifican y responden emails automáticamente — sin que tengas que hacer nada.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as any }}>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '0.875rem 2rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em' }}>
            CREAR CUENTA GRATIS
          </Link>
          <Link href="/login" style={{ background: 'transparent', color: '#888', padding: '0.875rem 2rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', border: '1px solid #222' }}>
            VER DEMO
          </Link>
        </div>
      </section>

      {/* Como funciona */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem', borderTop: '1px solid #111' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '3rem' }}>CÓMO FUNCIONA</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { step: '01', title: 'Conecta tu Gmail', desc: 'En un clic autorizas el acceso. Sin configuraciones complejas.' },
            { step: '02', title: 'Configura tu agente', desc: 'Elige el tipo de agente y define cómo debe responder a tus clientes.' },
            { step: '03', title: 'El agente trabaja', desc: 'Lee emails entrantes, genera respuestas y las envía automáticamente.' },
          ].map(item => (
            <div key={item.step} style={{ padding: '1.5rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
              <div style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '0.75rem' }}>{item.step}</div>
              <div style={{ fontSize: 14, color: '#d4d0c8', marginBottom: '0.5rem', fontWeight: 500 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Casos de uso */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem', borderTop: '1px solid #111' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '3rem' }}>TIPOS DE AGENTES</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { type: 'SOPORTE', title: 'Agente de soporte', items: ['Responde preguntas frecuentes', 'Gestiona tickets automáticamente', 'Escala casos complejos al equipo'] },
            { type: 'VENTAS', title: 'Agente de ventas', items: ['Cualifica leads entrantes', 'Responde consultas de precio', 'Agenda reuniones automáticamente'] },
            { type: 'ADMIN', title: 'Agente administrativo', items: ['Procesa solicitudes internas', 'Extrae datos de documentos', 'Coordina tareas entre equipos'] },
          ].map(item => (
            <div key={item.type} style={{ padding: '1.5rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '0.75rem', background: '#0d2010', display: 'inline-block', padding: '2px 8px', borderRadius: 2 }}>{item.type}</div>
              <div style={{ fontSize: 14, color: '#d4d0c8', marginBottom: '1rem', fontWeight: 500 }}>{item.title}</div>
              {item.items.map(i => (
                <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#4ade80' }}>—</span> {i}
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '4rem 2rem', borderTop: '1px solid #111' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '3rem' }}>PRECIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { plan: 'BÁSICO', price: '29', desc: 'Para empezar', features: ['1 agente activo', '500 emails/mes', 'Gmail', 'Soporte email'] },
            { plan: 'PRO', price: '99', desc: 'Para crecer', features: ['5 agentes activos', '5.000 emails/mes', 'Gmail + Slack', 'Soporte prioritario'], highlighted: true },
            { plan: 'ENTERPRISE', price: '399', desc: 'Para escalar', features: ['Agentes ilimitados', 'Emails ilimitados', 'Todas las integraciones', 'Soporte dedicado'] },
          ].map(item => (
            <div key={item.plan} style={{ padding: '2rem', background: item.highlighted ? '#0d2010' : '#0f0f0f', border: `1px solid ${item.highlighted ? '#4ade80' : '#1a1a1a'}`, borderRadius: 4 }}>
              <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '1rem' }}>{item.plan}</div>
              <div style={{ fontSize: 36, color: '#d4d0c8', fontWeight: 500, marginBottom: '0.25rem' }}>{item.price}€</div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: '1.5rem' }}>/ mes · {item.desc}</div>
              {item.features.map(f => (
                <div key={f} style={{ fontSize: 11, color: '#555', marginBottom: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <span style={{ color: '#4ade80' }}>✓</span> {f}
                </div>
              ))}
              <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', background: item.highlighted ? '#4ade80' : 'transparent', color: item.highlighted ? '#080808' : '#888', padding: '0.75rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', border: item.highlighted ? 'none' : '1px solid #222' }}>
                EMPEZAR
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section style={{ maxWidth: 600, margin: '0 auto', padding: '4rem 2rem 6rem', textAlign: 'center', borderTop: '1px solid #111' }}>
        <div style={{ fontSize: 28, color: '#e8e4dc', fontWeight: 500, marginBottom: '1rem' }}>Empieza hoy</div>
        <div style={{ fontSize: 13, color: '#555', marginBottom: '2rem' }}>Configura tu primer agente en menos de 5 minutos.</div>
        <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '0.875rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em' }}>
          CREAR CUENTA GRATIS
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #111', padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: '#2a2a2a', letterSpacing: '0.1em' }}>AXIORA · 2025 · Todos los derechos reservados</div>
      </footer>

    </main>
  )
}
