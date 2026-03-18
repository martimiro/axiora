import Link from 'next/link'

export default function Landing() {
  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #111', padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.25em', color: '#888', fontWeight: 500 }}>AXIORA</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#como-funciona" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>CÓMO FUNCIONA</a>
          <a href="#precios" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>PRECIOS</a>
          <a href="#faq" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>FAQ</a>
          <Link href="/login" style={{ fontSize: 11, color: '#666', textDecoration: 'none', letterSpacing: '0.1em' }}>ENTRAR</Link>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '0.5rem 1.25rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>EMPEZAR GRATIS</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '7rem 2rem 5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.3em', color: '#4ade80', background: '#0d2010', padding: '4px 14px', borderRadius: 2, marginBottom: '2rem', border: '1px solid #1a4a1a' }}>
          AGENTES DE IA PARA EMPRESAS
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 500, lineHeight: 1.1, marginBottom: '1.5rem', color: '#e8e4dc', letterSpacing: '-0.02em' }}>
          Tu Gmail gestionado<br />
          <span style={{ color: '#4ade80' }}>por inteligencia artificial</span>
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: '3rem', maxWidth: 580, margin: '0 auto 3rem' }}>
          Axiora conecta agentes de IA a tu bandeja de entrada. Leen, clasifican y responden emails automáticamente — ahorrando horas cada semana.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as any, marginBottom: '1.5rem' }}>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
            CREAR CUENTA GRATIS
          </Link>
          <a href="#como-funciona" style={{ background: 'transparent', color: '#888', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', border: '1px solid #222' }}>
            VER CÓMO FUNCIONA
          </a>
        </div>
        <div style={{ fontSize: 11, color: '#2a2a2a' }}>Sin tarjeta de crédito · Configura en 5 minutos</div>
      </section>

      {/* Dashboard preview */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div style={{ border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', background: '#0f0f0f' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <span style={{ fontSize: 10, color: '#333', marginLeft: '0.5rem', letterSpacing: '0.1em' }}>axiora-murex.vercel.app</span>
          </div>
          <div style={{ display: 'flex', minHeight: 400 }}>
            {/* Sidebar simulado */}
            <div style={{ width: 180, borderRight: '1px solid #111', padding: '1.5rem 0', background: '#080808' }}>
              <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#666' }}>AXIORA</span>
              </div>
              {['PANEL', 'ESTADÍSTICAS', 'CONVERSACIONES', 'AGENTES'].map((item, i) => (
                <div key={item} style={{ padding: '0.5rem 1.25rem', fontSize: 9, letterSpacing: '0.1em', color: i === 0 ? '#d4d0c8' : '#333', borderLeft: i === 0 ? '2px solid #d4d0c8' : '2px solid transparent' }}>
                  {item}
                </div>
              ))}
            </div>
            {/* Contenido simulado */}
            <div style={{ flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['AGENTES ACTIVOS', '3'], ['CONVERSACIONES', '142'], ['MENSAJES HOY', '28']].map(([label, value]) => (
                  <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: '#d4d0c8' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid #111' }}>ACTIVIDAD RECIENTE</div>
              {[
                { agent: 'Agente de Soporte', msg: 'Hola, tengo un problema con mi pedido...', status: 'OPEN' },
                { agent: 'Agente de Ventas', msg: 'Me interesa conocer más sobre vuestros planes...', status: 'OPEN' },
                { agent: 'Agente de Soporte', msg: '¿Cuándo estará disponible mi envío?', status: 'OPEN' },
              ].map((conv, i) => (
                <div key={i} style={{ padding: '0.6rem 0.75rem', border: '1px solid #111', borderRadius: 3, marginBottom: '0.4rem', background: '#0a0a0a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 8, color: '#555', marginBottom: 2 }}>{conv.agent}</div>
                    <div style={{ fontSize: 9, color: '#333' }}>{conv.msg}</div>
                  </div>
                  <div style={{ fontSize: 7, background: '#0d2010', color: '#4ade80', padding: '2px 6px', borderRadius: 2 }}>{conv.status}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 10, color: '#2a2a2a' }}>Dashboard real de Axiora</div>
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {[
            { value: '3h', label: 'Ahorro medio diario por empresa' },
            { value: '94%', label: 'Emails resueltos sin intervención humana' },
            { value: '5min', label: 'Tiempo de configuración inicial' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 42, fontWeight: 500, color: '#4ade80', marginBottom: '0.5rem' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="como-funciona" style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>PROCESO</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>Configurado en 3 pasos</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { step: '01', title: 'Conecta tu Gmail', desc: 'Autoriza el acceso en un clic. Axiora nunca almacena tus contraseñas — usa el protocolo OAuth de Google.', detail: 'Seguro · OAuth 2.0' },
            { step: '02', title: 'Configura tu agente', desc: 'Elige entre plantillas prediseñadas (soporte, ventas, admin) o crea uno personalizado con tus instrucciones.', detail: 'Sin código · 2 minutos' },
            { step: '03', title: 'El agente trabaja', desc: 'Desde ese momento, el agente lee emails entrantes, genera respuestas contextuales y las envía automáticamente.', detail: 'Automático · 24/7' },
          ].map(item => (
            <div key={item.step} style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
              <div style={{ fontSize: 32, fontWeight: 500, color: '#1a1a1a', marginBottom: '1rem' }}>{item.step}</div>
              <div style={{ fontSize: 15, color: '#d4d0c8', marginBottom: '0.75rem', fontWeight: 500 }}>{item.title}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: '1rem' }}>{item.desc}</div>
              <div style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.1em' }}>{item.detail}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Tipos de agentes */}
      <section style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>ESPECIALIZACIÓN</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>Un agente para cada necesidad</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { type: 'SOPORTE', title: 'Agente de soporte', color: '#4ade80', items: ['Responde preguntas frecuentes al instante', 'Gestiona y prioriza tickets automáticamente', 'Escala casos complejos al equipo humano', 'Reduce el tiempo de respuesta de horas a segundos'] },
              { type: 'VENTAS', title: 'Agente de ventas', color: '#60a5fa', items: ['Cualifica leads entrantes automáticamente', 'Responde consultas de precio y producto', 'Agenda reuniones con el equipo comercial', 'Hace seguimiento de oportunidades abiertas'] },
              { type: 'ADMIN', title: 'Agente administrativo', color: '#f59e0b', items: ['Procesa solicitudes internas y externas', 'Extrae datos de documentos adjuntos', 'Coordina tareas entre departamentos', 'Actualiza bases de datos automáticamente'] },
            ].map(item => (
              <div key={item.type} style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: item.color, letterSpacing: '0.2em', background: '#111', display: 'inline-block', padding: '3px 10px', borderRadius: 2, marginBottom: '1rem', border: `1px solid ${item.color}22` }}>{item.type}</div>
                <div style={{ fontSize: 15, color: '#d4d0c8', marginBottom: '1.25rem', fontWeight: 500 }}>{item.title}</div>
                {item.items.map(i => (
                  <div key={i} style={{ fontSize: 11, color: '#555', marginBottom: '0.6rem', display: 'flex', gap: '0.5rem', lineHeight: 1.5 }}>
                    <span style={{ color: item.color, flexShrink: 0 }}>—</span> {i}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>TESTIMONIOS</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>Lo que dicen nuestros clientes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { quote: 'Antes tardábamos 4 horas al día en gestionar el email de soporte. Ahora el agente lo resuelve todo automáticamente y solo revisamos los casos complejos.', name: 'Carlos M.', role: 'CEO · E-commerce', initial: 'C' },
            { quote: 'Lo que más me sorprendió fue la calidad de las respuestas. Los clientes no saben que están hablando con una IA — y las valoraciones de soporte han subido.', name: 'Laura G.', role: 'Directora de Operaciones', initial: 'L' },
            { quote: 'Configuramos el agente de ventas en 10 minutos. En la primera semana ya había cualificado 23 leads y agendado 6 reuniones. El ROI fue inmediato.', name: 'Miquel T.', role: 'Sales Manager', initial: 'M' },
          ].map(item => (
            <div key={item.name} style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
              <div style={{ fontSize: 13, color: '#2a2a2a', marginBottom: '1rem' }}>"</div>
              <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8, marginBottom: '1.5rem', fontStyle: 'italic' }}>{item.quote}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#4ade80' }}>{item.initial}</div>
                <div>
                  <div style={{ fontSize: 11, color: '#d4d0c8' }}>{item.name}</div>
                  <div style={{ fontSize: 10, color: '#444' }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Precios */}
      <section id="precios" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>PRECIOS</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '0.75rem' }}>Simple y transparente</div>
          <div style={{ fontSize: 13, color: '#444', textAlign: 'center', marginBottom: '3.5rem' }}>Sin permanencias · Cancela cuando quieras</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { plan: 'BÁSICO', price: '29', desc: 'Para empezar', features: ['1 agente activo', '500 emails/mes', 'Gmail', 'Dashboard básico', 'Soporte por email'], highlighted: false },
              { plan: 'PRO', price: '99', desc: 'El más popular', features: ['5 agentes activos', '5.000 emails/mes', 'Gmail + Slack', 'Dashboard completo', 'Estadísticas avanzadas', 'Soporte prioritario'], highlighted: true },
              { plan: 'ENTERPRISE', price: '399', desc: 'Para grandes equipos', features: ['Agentes ilimitados', 'Emails ilimitados', 'Todas las integraciones', 'API propia', 'SLA garantizado', 'Soporte dedicado'], highlighted: false },
            ].map(item => (
              <div key={item.plan} style={{ padding: '2rem', background: item.highlighted ? '#0d2010' : '#0f0f0f', border: `1px solid ${item.highlighted ? '#4ade80' : '#1a1a1a'}`, borderRadius: 4, position: 'relative' as any }}>
                {item.highlighted && <div style={{ position: 'absolute' as any, top: -1, left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#080808', fontSize: 9, padding: '3px 12px', letterSpacing: '0.15em', borderRadius: '0 0 4px 4px' }}>MÁS POPULAR</div>}
                <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '1rem' }}>{item.plan}</div>
                <div style={{ fontSize: 42, color: '#d4d0c8', fontWeight: 500, marginBottom: '0.25rem' }}>{item.price}€</div>
                <div style={{ fontSize: 11, color: '#444', marginBottom: '2rem' }}>/ mes · {item.desc}</div>
                {item.features.map(f => (
                  <div key={f} style={{ fontSize: 11, color: '#555', marginBottom: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
                <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: '2rem', background: item.highlighted ? '#4ade80' : 'transparent', color: item.highlighted ? '#080808' : '#888', padding: '0.875rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', border: item.highlighted ? 'none' : '1px solid #222', fontWeight: item.highlighted ? 500 : 400 }}>
                  EMPEZAR
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 700, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>FAQ</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>Preguntas frecuentes</div>
        {[
          { q: '¿El agente tiene acceso a todos mis emails?', a: 'Solo a los emails no leídos que llegan después de la configuración. Usamos OAuth 2.0 de Google, que es el mismo protocolo que usan apps como Gmail en móvil.' },
          { q: '¿Los clientes saben que hablan con una IA?', a: 'Tú decides. Puedes configurar el agente para que se identifique como IA o para que actúe como un miembro más de tu equipo. La mayoría de clientes prefiere no mencionarlo.' },
          { q: '¿Qué pasa si el agente no sabe responder?', a: 'El agente está configurado para escalar a un humano cuando detecta que no puede resolver la consulta. Recibirás una notificación para que intervengas manualmente.' },
          { q: '¿Puedo cancelar en cualquier momento?', a: 'Sí. Sin permanencias ni penalizaciones. Cancelas cuando quieras desde el dashboard y no se te cobra el siguiente mes.' },
          { q: '¿Funciona con Gmail de empresa (Google Workspace)?', a: 'Sí, funciona tanto con cuentas de Gmail personales como con Google Workspace (antes G Suite).' },
          { q: '¿Cuánto tiempo lleva la configuración inicial?', a: 'Entre 3 y 10 minutos. Creas la cuenta, conectas tu Gmail, eliges una plantilla de agente y ya está funcionando.' },
        ].map((item, i) => (
          <div key={i} style={{ borderBottom: '1px solid #111', padding: '1.5rem 0' }}>
            <div style={{ fontSize: 13, color: '#d4d0c8', marginBottom: '0.75rem', fontWeight: 500 }}>{item.q}</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>{item.a}</div>
          </div>
        ))}
      </section>

      {/* CTA Final */}
      <section style={{ background: '#0a0a0a', borderTop: '1px solid #111', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', margin: '0 auto 2rem' }} />
          <div style={{ fontSize: 36, fontWeight: 500, color: '#e8e4dc', marginBottom: '1rem' }}>Empieza hoy, gratis</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            Sin tarjeta de crédito. Sin contratos.<br />Configura tu primer agente en 5 minutos.
          </div>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '1rem 3rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
            CREAR CUENTA GRATIS
          </Link>
          <div style={{ marginTop: '1.5rem', fontSize: 10, color: '#2a2a2a' }}>
            ¿Preguntas? Escríbenos a hola@axiora.ai
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #0f0f0f', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', color: '#2a2a2a' }}>AXIORA</span>
        </div>
        <div style={{ fontSize: 10, color: '#1a1a1a' }}>© 2025 · Todos los derechos reservados</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/login" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>Entrar</Link>
          <Link href="/register" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>Registrarse</Link>
        </div>
      </footer>

    </main>
  )
}
