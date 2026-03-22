'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import LocaleSwitcher from '@/components/LocaleSwitcher'

type LandingMessages = {
  nav: Record<string, string>
  hero: Record<string, string>
  stats: Record<string, string>
  howItWorks: Record<string, any>
  agentTypes: Record<string, any>
  testimonials: Record<string, string>
  pricing: Record<string, any>
  faq: Record<string, string>
  cta: Record<string, string>
  footer: Record<string, string>
}

function useFadeIn() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, visible }
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const steps = 60
        const increment = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= target) { setCount(target); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, 1500 / steps)
      }
    }, { threshold: 0.5 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <div ref={ref}>{count}{suffix}</div>
}

function FadeSection({ children, style, id, delay = 0 }: { children: React.ReactNode; style?: any; id?: string; delay?: number }) {
  const { ref, visible } = useFadeIn()
  return (
    <section ref={ref as any} id={id} style={{ ...style, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms` }}>
      {children}
    </section>
  )
}

// Particles canvas
function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = []
    for (let i = 0; i < 80; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.5 + 0.3, speedX: (Math.random() - 0.5) * 0.3, speedY: (Math.random() - 0.5) * 0.3, opacity: Math.random() * 0.5 + 0.1 })
    }
    let animId: number
    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.speedX; p.y += p.speedY
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(74, 222, 128, ${p.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

// Infinite logo scroll
function LogoCarousel() {
  const logos = ['Gmail', 'Slack', 'Notion', 'HubSpot', 'Salesforce', 'Zapier', 'Stripe', 'Shopify', 'Intercom', 'Zendesk']
  const doubled = [...logos, ...logos]
  return (
    <div style={{ overflow: 'hidden', position: 'relative', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '2rem', animation: 'scroll-logos 25s linear infinite', width: 'max-content' }}>
        {doubled.map((logo, i) => (
          <div key={i} style={{ padding: '0.5rem 1.5rem', border: '1px solid #1a1a1a', borderRadius: 4, background: '#0f0f0f', fontSize: 11, color: '#333', letterSpacing: '0.1em', whiteSpace: 'nowrap' as any, minWidth: 100, textAlign: 'center' }}>
            {logo}
          </div>
        ))}
      </div>
    </div>
  )
}

// Infinite testimonials scroll
function TestimonialsCarousel({ testimonials }: { testimonials: { quote: string; name: string; role: string; initial: string }[] }) {
  const doubled = [...testimonials, ...testimonials]
  return (
    <div style={{ overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', gap: '1.5rem', animation: 'scroll-logos 35s linear infinite', width: 'max-content' }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 320, flexShrink: 0, padding: '1.5rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
            <div style={{ fontSize: 20, color: '#4ade80', marginBottom: '0.75rem', opacity: 0.4 }}>"</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8, marginBottom: '1.25rem', fontStyle: 'italic' }}>{t.quote}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#4ade80', flexShrink: 0 }}>{t.initial}</div>
              <div>
                <div style={{ fontSize: 11, color: '#d4d0c8' }}>{t.name}</div>
                <div style={{ fontSize: 10, color: '#444' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Use cases tabs
function UseCaseTabs({ m }: { m: any }) {
  const [active, setActive] = useState(0)
  const cases = [
    {
      label: m?.agentTypes?.support || 'SUPORT',
      title: m?.agentTypes?.supportTitle || 'Agent de suport',
      color: '#4ade80',
      items: (m?.agentTypes?.supportItems || []) as string[],
      example: { from: 'client@empresa.com', subject: 'Problema amb la comanda #1234', body: 'Hola, he rebut un producte defectuós...', reply: "Hola! Lamento l'inconvenient. Procedim a gestionar la substitució immediatament. Rebràs el nou producte en 24-48h." }
    },
    {
      label: m?.agentTypes?.sales || 'VENDES',
      title: m?.agentTypes?.salesTitle || 'Agent de vendes',
      color: '#60a5fa',
      items: (m?.agentTypes?.salesItems || []) as string[],
      example: { from: 'lead@startup.io', subject: 'Interessat en els vostres plans', body: "Hola, som una startup de 15 persones i m'agradaria saber més sobre el pla Pro...", reply: "Hola! El pla Pro és perfecte per al vostre equip. Inclou 5 agents actius i 5.000 emails/mes. T'anomeno per a una demo gratuïta?" }
    },
    {
      label: m?.agentTypes?.admin || 'ADMIN',
      title: m?.agentTypes?.adminTitle || 'Agent administratiu',
      color: '#f59e0b',
      items: (m?.agentTypes?.adminItems || []) as string[],
      example: { from: 'rrhh@empresa.com', subject: 'Sol·licitud de vacances - Juny', body: 'Bon dia, voldria sol·licitar vacances del 10 al 20 de juny...', reply: "Sol·licitud registrada. Dates: 10-20 juny (8 dies laborables). He actualitzat el calendari d'equip i notificat al teu responsable." }
    },
  ]
  const current = cases[active]
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
        {cases.map((c, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '0.5rem 1.5rem', border: `1px solid ${active === i ? c.color : '#222'}`, borderRadius: 4, background: active === i ? `${c.color}15` : '#0f0f0f', color: active === i ? c.color : '#444', fontSize: 10, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 18, color: '#e8e4dc', fontWeight: 500, marginBottom: '1.5rem' }}>{current.title}</div>
          {current.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem', alignItems: 'flex-start' }}>
              <span style={{ color: current.color, flexShrink: 0, fontSize: 14 }}>✓</span>
              <span style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', fontFamily: 'monospace' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #111', display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#0a0a0a' }}>
            {['#ef4444','#f59e0b','#4ade80'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
            <span style={{ fontSize: 9, color: '#333', marginLeft: '0.5rem' }}>Gmail</span>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ fontSize: 10, color: '#444', marginBottom: '0.25rem' }}>De: {current.example.from}</div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: '0.75rem', fontWeight: 500 }}>{current.example.subject}</div>
            <div style={{ fontSize: 11, color: '#555', lineHeight: 1.6, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111' }}>{current.example.body}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: current.color, animation: 'pulse-dot 1.5s infinite' }} />
              <span style={{ fontSize: 9, color: current.color, letterSpacing: '0.1em' }}>AGENT RESPONENT</span>
            </div>
            <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6, background: `${current.color}08`, padding: '0.75rem', borderRadius: 4, border: `1px solid ${current.color}22` }}>{current.example.reply}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Landing() {
  const [annual, setAnnual] = useState(false)
  const [m, setM] = useState<LandingMessages | null>(null)
  const [heroVisible, setHeroVisible] = useState(false)
  const [typed, setTyped] = useState('')
  const [cursorOn, setCursorOn] = useState(true)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../../messages/${locale}.json`).then(mod => setM(mod.default))
    setTimeout(() => setHeroVisible(true), 100)
    const cursorTimer = setInterval(() => setCursorOn(v => !v), 500)
    return () => clearInterval(cursorTimer)
  }, [])

  useEffect(() => {
    if (!m) return
    const text = m.hero?.title2 || 'per intel·ligència artificial'
    let i = 0
    setTyped('')
    const timer = setInterval(() => {
      i++
      setTyped(text.slice(0, i))
      if (i >= text.length) clearInterval(timer)
    }, 60)
    return () => clearInterval(timer)
  }, [m])

  const n = m?.nav
  const h = m?.hero
  const s = m?.stats
  const hw = m?.howItWorks
  const pr = m?.pricing
  const fq = m?.faq
  const ct = m?.cta
  const ft = m?.footer

  const prices = {
    basic: annual ? Math.round(29 * 0.85) : 29,
    pro: annual ? Math.round(99 * 0.85) : 99,
    enterprise: annual ? Math.round(399 * 0.85) : 399,
  }

  const testimonialsData = m ? [
    { quote: m.testimonials?.t1quote || '', name: m.testimonials?.t1name || 'Carlos M.', role: m.testimonials?.t1role || 'CEO · E-commerce', initial: 'C' },
    { quote: m.testimonials?.t2quote || '', name: m.testimonials?.t2name || 'Laura G.', role: m.testimonials?.t2role || "Directora d'Operacions", initial: 'L' },
    { quote: m.testimonials?.t3quote || '', name: m.testimonials?.t3name || 'Miquel T.', role: m.testimonials?.t3role || 'Sales Manager', initial: 'M' },
    { quote: "L'automatització de Gmail ens ha estalviat 20 hores setmanals. El ROI va ser immediat.", name: 'Marc R.', role: 'CTO · SaaS', initial: 'M' },
    { quote: "Increïble. Els clients reben respostes en segons, fins i tot a les 3 de la matinada.", name: 'Sofia P.', role: 'Fundadora · E-learning', initial: 'S' },
    { quote: "Vam configurar l'agent en 10 minuts. Ara gestiona el 90% dels emails sense intervenció.", name: 'Joan V.', role: 'Operations Manager', initial: 'J' },
  ] : []

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace", overflowX: 'hidden' }}>

      <style>{`
        @keyframes pulse-dot { 0%,100%{opacity:1;box-shadow:0 0 8px #4ade80}50%{opacity:.6;box-shadow:0 0 18px #4ade80} }
        @keyframes scroll-logos { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .nav-link:hover{color:#d4d0c8!important;transition:color .2s}
        .card-hover{transition:border-color .2s,transform .2s,box-shadow .2s}
        .card-hover:hover{border-color:#2a2a2a!important;transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.4)}
        .btn-hover{transition:transform .15s,box-shadow .15s}
        .btn-hover:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(74,222,128,.35)}
        .step-num{transition:color .3s}
        .card-hover:hover .step-num{color:#4ade80!important}
        .social-proof-item{border-right:1px solid #1a1a1a;padding:0 3rem;text-align:center}
        .social-proof-item:last-child{border-right:none}
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #111', padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(8,8,8,0.95)', backdropFilter: 'blur(8px)', zIndex: 10, opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 2s infinite' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.25em', color: '#888', fontWeight: 500 }}>AXIORA</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#com-funciona" className="nav-link" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.howItWorks || 'COM FUNCIONA'}</a>
          <a href="#casos-us" className="nav-link" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>CASOS D'ÚS</a>
          <a href="#preus" className="nav-link" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.pricing || 'PREUS'}</a>
          <a href="#faq" className="nav-link" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.faq || 'FAQ'}</a>
          <Link href="/login" className="nav-link" style={{ fontSize: 11, color: '#666', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.login || 'ENTRAR'}</Link>
          <LocaleSwitcher />
          <Link href="/register" className="btn-hover" style={{ background: '#4ade80', color: '#080808', padding: '0.5rem 1.25rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>{n?.startFree || 'COMENÇAR GRATIS'}</Link>
        </div>
      </nav>

      {/* Hero con partículas */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '7rem 2rem 5rem', textAlign: 'center', position: 'relative' }}>
        <ParticlesCanvas />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s' }}>
            <div style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.3em', color: '#4ade80', background: '#0d2010', padding: '4px 14px', borderRadius: 2, marginBottom: '2rem', border: '1px solid #1a4a1a' }}>
              {h?.badge || "AGENTS D'IA PER A EMPRESES"}
            </div>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease 0.4s, transform 0.8s ease 0.4s' }}>
            <h1 style={{ fontSize: 56, fontWeight: 500, lineHeight: 1.1, marginBottom: '1.5rem', color: '#e8e4dc', letterSpacing: '-0.02em' }}>
              {h?.title1 || 'El teu Gmail gestionat'}<br />
              <span style={{ color: '#4ade80' }}>{typed}<span style={{ opacity: cursorOn ? 1 : 0, transition: 'opacity 0.1s' }}>_</span></span>
            </h1>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease 0.6s, transform 0.8s ease 0.6s' }}>
            <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, maxWidth: 580, margin: '0 auto 3rem' }}>
              {h?.description || "Axiora connecta agents d'IA a la teva safata d'entrada. Llegeixen, classifiquen i responen emails automàticament — estalviant hores cada setmana."}
            </p>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as any, marginBottom: '1.5rem' }}>
              <Link href="/register" className="btn-hover" style={{ background: '#4ade80', color: '#080808', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
                {h?.ctaPrimary || 'CREAR COMPTE GRATIS'}
              </Link>
              <a href="#com-funciona" style={{ background: 'transparent', color: '#888', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', border: '1px solid #222' }}>
                {h?.ctaSecondary || 'VEURE COM FUNCIONA'}
              </a>
            </div>
            <div style={{ fontSize: 11, color: '#2a2a2a' }}>{h?.noCard || 'Sense targeta de crèdit · Configura en 5 minuts'}</div>
          </div>
        </div>
      </section>

      {/* Logo carousel */}
      <FadeSection style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '1.5rem 0', background: '#0a0a0a' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.2em', color: '#2a2a2a', textAlign: 'center', marginBottom: '1rem' }}>INTEGRA AMB LES EINES QUE JA USES</div>
        <LogoCarousel />
      </FadeSection>

      {/* Social proof */}
      <FadeSection style={{ padding: '3rem 2rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          {[
            { value: 94, suffix: '%', label: s?.s2l || 'Emails resolts automàticament' },
            { value: 3, suffix: 'h', label: s?.s1l || 'Estalvi diari per empresa' },
            { value: 5, suffix: 'min', label: s?.s3l || 'Temps de configuració' },
            { value: 500, suffix: '+', label: 'Empreses confien en Axiora' },
          ].map((item, i) => (
            <div key={i} className="social-proof-item" style={{ flex: 1 }}>
              <div style={{ fontSize: 40, fontWeight: 500, color: '#4ade80', marginBottom: '0.4rem' }}>
                <AnimatedCounter target={item.value} suffix={item.suffix} />
              </div>
              <div style={{ fontSize: 10, color: '#444', lineHeight: 1.5, letterSpacing: '0.05em' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* Dashboard preview */}
      <FadeSection style={{ maxWidth: 1000, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', background: '#0f0f0f' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0a0a0a' }}>
            {['#ef4444','#f59e0b','#4ade80'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.7 }} />)}
            <span style={{ fontSize: 10, color: '#333', marginLeft: '0.5rem', letterSpacing: '0.1em' }}>axiora.app</span>
          </div>
          <div style={{ display: 'flex', minHeight: 380 }}>
            <div style={{ width: 180, borderRight: '1px solid #111', padding: '1.5rem 0', background: '#080808' }}>
              <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 2s infinite' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#666' }}>AXIORA</span>
              </div>
              {['PANEL', 'ESTADÍSTIQUES', 'CONVERSES', 'AGENTS'].map((item, i) => (
                <div key={item} style={{ padding: '0.5rem 1.25rem', fontSize: 9, letterSpacing: '0.1em', color: i === 0 ? '#d4d0c8' : '#333', borderLeft: i === 0 ? '2px solid #d4d0c8' : '2px solid transparent' }}>{item}</div>
              ))}
            </div>
            <div style={{ flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['AGENTS ACTIUS','3'],['CONVERSES','142'],['MISSATGES AVUI','28']].map(([label, value]) => (
                  <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: '#d4d0c8' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid #111' }}>ACTIVITAT RECENT</div>
              {[
                { agent: 'Support Agent', msg: 'Hi, I have a problem with my order...', status: 'OPEN' },
                { agent: 'Sales Agent', msg: "I'm interested in your Pro plan...", status: 'OPEN' },
                { agent: 'Support Agent', msg: 'When will my shipment arrive?', status: 'OPEN' },
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
        <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 10, color: '#2a2a2a' }}>Dashboard real d'Axiora</div>
      </FadeSection>

      {/* Cómo funciona */}
      <FadeSection id="com-funciona" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{hw?.label || 'PROCÉS'}</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>{hw?.title || 'Configurat en 3 passos'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {[
              { step: '01', title: hw?.step1title || 'Connecta el teu Gmail', desc: hw?.step1desc || '', detail: hw?.step1detail || 'Segur · OAuth 2.0' },
              { step: '02', title: hw?.step2title || 'Configura el teu agent', desc: hw?.step2desc || '', detail: hw?.step2detail || 'Sense codi · 2 minuts' },
              { step: '03', title: hw?.step3title || "L'agent treballa", desc: hw?.step3desc || '', detail: hw?.step3detail || 'Automàtic · 24/7' },
            ].map(item => (
              <div key={item.step} className="card-hover" style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
                <div className="step-num" style={{ fontSize: 32, fontWeight: 500, color: '#1a1a1a', marginBottom: '1rem' }}>{item.step}</div>
                <div style={{ fontSize: 15, color: '#d4d0c8', marginBottom: '0.75rem', fontWeight: 500 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: '1rem' }}>{item.desc}</div>
                <div style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.1em' }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* Casos de uso con tabs */}
      <FadeSection id="casos-us" style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>CASOS D'ÚS</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3rem' }}>Veu-ho en acció</div>
        {m && <UseCaseTabs m={m} />}
      </FadeSection>

      {/* Testimonios carrusel infinito */}
      <FadeSection style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '4rem 0', background: '#0a0a0a', overflow: 'hidden' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '2rem' }}>EL QUE DIUEN ELS NOSTRES CLIENTS</div>
        <TestimonialsCarousel testimonials={testimonialsData} />
      </FadeSection>

      {/* Precios */}
      <FadeSection id="preus" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{pr?.label || 'PREUS'}</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '0.75rem' }}>{pr?.title || 'Simple i transparent'}</div>
          <div style={{ fontSize: 13, color: '#444', textAlign: 'center', marginBottom: '2rem' }}>{pr?.subtitle || 'Sense permanències · Cancel·la quan vulguis'}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: 11, color: !annual ? '#d4d0c8' : '#444', letterSpacing: '0.1em' }}>{pr?.monthly || 'MENSUAL'}</span>
            <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, background: annual ? '#4ade80' : '#222', position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', transition: 'background 0.3s' }}>
              <div style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
            </button>
            <span style={{ fontSize: 11, color: annual ? '#d4d0c8' : '#444', letterSpacing: '0.1em' }}>
              {pr?.annual || 'ANUAL'}
              <span style={{ marginLeft: '0.5rem', fontSize: 9, color: '#4ade80', background: '#0d2010', padding: '2px 6px', borderRadius: 2, border: '1px solid #1a4a1a' }}>{pr?.discount || '-15%'}</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { plan: pr?.basic || 'BÀSIC', price: prices.basic, originalPrice: 29, desc: pr?.basicDesc || 'Per començar', features: pr?.basicFeatures || [], highlighted: false },
              { plan: pr?.pro || 'PRO', price: prices.pro, originalPrice: 99, desc: pr?.proDesc || 'El més popular', features: pr?.proFeatures || [], highlighted: true },
              { plan: pr?.enterprise || 'ENTERPRISE', price: prices.enterprise, originalPrice: 399, desc: pr?.enterpriseDesc || 'Per a grans equips', features: pr?.enterpriseFeatures || [], highlighted: false },
            ].map(item => (
              <div key={item.plan} className="card-hover" style={{ padding: '2rem', background: item.highlighted ? '#0d2010' : '#0f0f0f', border: `1px solid ${item.highlighted ? '#4ade80' : '#1a1a1a'}`, borderRadius: 4, position: 'relative' as any }}>
                {item.highlighted && <div style={{ position: 'absolute' as any, top: -1, left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#080808', fontSize: 9, padding: '3px 12px', letterSpacing: '0.15em', borderRadius: '0 0 4px 4px' }}>{pr?.popular || 'MÉS POPULAR'}</div>}
                <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '1rem' }}>{item.plan}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: 42, color: '#d4d0c8', fontWeight: 500, transition: 'all 0.3s' }}>{item.price}€</div>
                  {annual && <div style={{ fontSize: 14, color: '#333', textDecoration: 'line-through', marginBottom: '0.6rem' }}>{item.originalPrice}€</div>}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginBottom: annual ? '0.5rem' : '2rem' }}>{pr?.perMonth || '/ mes'} · {item.desc}</div>
                {annual && <div style={{ fontSize: 10, color: '#4ade80', marginBottom: '1.5rem' }}>{pr?.billedAnnually || 'Facturat anualment'} ({item.price * 12}€/any)</div>}
                {(item.features as string[]).map((f: string) => (
                  <div key={f} style={{ fontSize: 11, color: '#555', marginBottom: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
                <Link href="/register" className="btn-hover" style={{ display: 'block', textAlign: 'center', marginTop: '2rem', background: item.highlighted ? '#4ade80' : 'transparent', color: item.highlighted ? '#080808' : '#888', padding: '0.875rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', border: item.highlighted ? 'none' : '1px solid #222', fontWeight: item.highlighted ? 500 : 400 }}>
                  {pr?.start || 'COMENÇAR'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* FAQ */}
      <FadeSection id="faq" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{fq?.label || 'FAQ'}</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>{fq?.title || 'Preguntes freqüents'}</div>
          {[
            { q: fq?.q1 || '', a: fq?.a1 || '' },
            { q: fq?.q2 || '', a: fq?.a2 || '' },
            { q: fq?.q3 || '', a: fq?.a3 || '' },
            { q: fq?.q4 || '', a: fq?.a4 || '' },
            { q: fq?.q5 || '', a: fq?.a5 || '' },
            { q: fq?.q6 || '', a: fq?.a6 || '' },
          ].map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid #111', padding: '1.5rem 0' }}>
              <div style={{ fontSize: 13, color: '#d4d0c8', marginBottom: '0.75rem', fontWeight: 500 }}>{item.q}</div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.8 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* CTA */}
      <FadeSection style={{ padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', animation: 'pulse-dot 2s infinite', margin: '0 auto 2rem' }} />
          <div style={{ fontSize: 36, fontWeight: 500, color: '#e8e4dc', marginBottom: '1rem' }}>{ct?.title || 'Comença avui, gratis'}</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {ct?.desc1 || 'Sense targeta de crèdit. Sense contractes.'}<br />{ct?.desc2 || 'Configura el teu primer agent en 5 minuts.'}
          </div>
          <Link href="/register" className="btn-hover" style={{ background: '#4ade80', color: '#080808', padding: '1rem 3rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
            {ct?.button || 'CREAR COMPTE GRATIS'}
          </Link>
          <div style={{ marginTop: '1.5rem', fontSize: 10, color: '#2a2a2a' }}>{ct?.contact || 'Preguntes? Escriu-nos a hola@axiora.ai'}</div>
        </div>
      </FadeSection>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #111', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', color: '#2a2a2a' }}>AXIORA</span>
        </div>
        <div style={{ fontSize: 10, color: '#1a1a1a' }}>{ft?.rights || '© 2025 · Tots els drets reservats'}</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/login" className="nav-link" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>{ft?.login || 'Entrar'}</Link>
          <Link href="/register" className="nav-link" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>{ft?.register || 'Registrar-se'}</Link>
        </div>
      </footer>

    </main>
  )
}