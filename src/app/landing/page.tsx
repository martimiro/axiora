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

function ParticlesCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight }
    resize()
    const particles: { x: number; y: number; size: number; speedX: number; speedY: number; opacity: number }[] = []
    for (let i = 0; i < 70; i++) {
      particles.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.2 + 0.3, speedX: (Math.random() - 0.5) * 0.25, speedY: (Math.random() - 0.5) * 0.25, opacity: Math.random() * 0.4 + 0.05 })
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
        ctx.fillStyle = `rgba(124, 58, 237, ${p.opacity})`
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(animId)
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

function CursorLight() {
  const [pos, setPos] = useState({ x: -500, y: -500 })
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none', zIndex: 0,
      background: `radial-gradient(600px circle at ${pos.x}px ${pos.y}px, rgba(124,58,237,0.07) 0%, transparent 60%)`,
      transition: 'background 0.05s'
    }} />
  )
}


function LogoCarousel() {
  const logos = ['Gmail', 'Slack', 'Notion', 'HubSpot', 'Salesforce', 'Stripe', 'Shopify', 'Intercom', 'Zendesk', 'Pipedrive']
  const doubled = [...logos, ...logos]
  return (
    <div style={{ overflow: 'hidden', padding: '1rem 0' }}>
      <div style={{ display: 'flex', gap: '1.5rem', animation: 'scroll-logos 28s linear infinite', width: 'max-content' }}>
        {doubled.map((logo, i) => (
          <div key={i} style={{ padding: '0.5rem 1.5rem', border: '1px solid #1a1a1a', borderRadius: 6, background: '#0a0a0a', fontSize: 12, color: '#333', fontFamily: 'Inter, sans-serif', letterSpacing: '0.02em', whiteSpace: 'nowrap' as any, minWidth: 100, textAlign: 'center' }}>
            {logo}
          </div>
        ))}
      </div>
    </div>
  )
}

function TestimonialsCarousel({ testimonials }: { testimonials: { quote: string; name: string; role: string; initial: string }[] }) {
  const doubled = [...testimonials, ...testimonials]
  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: '1.5rem', animation: 'scroll-logos 40s linear infinite', width: 'max-content', alignItems: 'stretch' }}>
        {doubled.map((t, i) => (
          <div key={i} style={{ width: 340, flexShrink: 0, padding: '1.75rem', background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: 12 }}>
            <div style={{ fontSize: 22, color: '#7c3aed', marginBottom: '0.75rem', opacity: 0.5, fontFamily: 'Georgia, serif' }}>"</div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.75, marginBottom: '1.5rem', fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>{t.quote}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#7c3aed22', border: '1px solid #7c3aed44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#8b5cf6', fontWeight: 600, flexShrink: 0 }}>{t.initial}</div>
              <div>
                <div style={{ fontSize: 13, color: '#e0dcd4', fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#444' }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UseCaseTabs({ m }: { m: any }) {
  const [active, setActive] = useState(0)
  const cases = [
    { label: m?.agentTypes?.support || 'SUPORT', title: m?.agentTypes?.supportTitle || 'Agent de suport', color: '#7c3aed', items: (m?.agentTypes?.supportItems || []) as string[], example: { from: 'client@empresa.com', subject: 'Problema amb la comanda #1234', body: 'Hola, he rebut un producte defectuós i necessito una substitució urgent...', reply: "Hola! Lamento l'inconvenient. He creat el tiquet #5678 i processem la substitució immediatament. Rebràs el nou producte en 24-48h sense cost addicional." } },
    { label: m?.agentTypes?.sales || 'VENDES', title: m?.agentTypes?.salesTitle || 'Agent de vendes', color: '#8b5cf6', items: (m?.agentTypes?.salesItems || []) as string[], example: { from: 'lead@startup.io', subject: 'Interessat en els vostres plans', body: "Hola, som una startup de 15 persones i m'agradaria saber més sobre el pla Pro...", reply: "Hola! El pla Pro és perfecte per al vostre equip — 5 agents i 5.000 emails/mes. Et proposo una demo de 20 min aquesta setmana. Quan t'aniria bé?" } },
    { label: m?.agentTypes?.admin || 'ADMIN', title: m?.agentTypes?.adminTitle || 'Agent administratiu', color: '#6d28d9', items: (m?.agentTypes?.adminItems || []) as string[], example: { from: 'rrhh@empresa.com', subject: 'Sol·licitud de vacances - Juny', body: 'Bon dia, voldria sol·licitar vacances del 10 al 20 de juny per motius personals...', reply: "Sol·licitud registrada ✓ Dates: 10-20 juny (8 dies laborables). He actualitzat el calendari d'equip, notificat al responsable i enviat confirmació per email." } },
  ]
  const current = cases[active]
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2.5rem', justifyContent: 'center' }}>
        {cases.map((c, i) => (
          <button key={i} onClick={() => setActive(i)} style={{ padding: '0.6rem 1.75rem', border: `1px solid ${active === i ? '#7c3aed' : '#1a1a1a'}`, borderRadius: 8, background: active === i ? '#7c3aed18' : '#0a0a0a', color: active === i ? '#8b5cf6' : '#444', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: active === i ? 500 : 400, cursor: 'pointer', transition: 'all 0.2s', letterSpacing: '0.02em' }}>
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 20, color: '#e8e4dc', fontWeight: 600, marginBottom: '1.5rem', fontFamily: 'Inter, sans-serif' }}>{current.title}</div>
          {current.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.875rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#7c3aed18', border: '1px solid #7c3aed44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ color: '#8b5cf6', fontSize: 10 }}>✓</span>
              </div>
              <span style={{ fontSize: 14, color: '#666', lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ background: '#080808', border: '1px solid #1a1a1a', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #111', display: 'flex', gap: '0.5rem', alignItems: 'center', background: '#0a0a0a' }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
            <span style={{ fontSize: 10, color: '#333', marginLeft: '0.5rem', fontFamily: 'var(--mono)' }}>Gmail</span>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: 11, color: '#444', marginBottom: '0.25rem', fontFamily: 'Inter, sans-serif' }}>De: <span style={{ color: '#666' }}>{current.example.from}</span></div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: '1rem', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{current.example.subject}</div>
            <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #111', fontFamily: 'Inter, sans-serif' }}>{current.example.body}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-accent 1.5s infinite' }} />
              <span style={{ fontSize: 10, color: '#7c3aed', letterSpacing: '0.08em', fontFamily: 'var(--mono)' }}>AGENT RESPONENT</span>
            </div>
            <div style={{ fontSize: 12, color: '#888', lineHeight: 1.7, background: '#7c3aed0a', padding: '0.875rem 1rem', borderRadius: 8, border: '1px solid #7c3aed22', fontFamily: 'Inter, sans-serif' }}>{current.example.reply}</div>
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
    let i = 0; setTyped('')
    const timer = setInterval(() => { i++; setTyped(text.slice(0, i)); if (i >= text.length) clearInterval(timer) }, 60)
    return () => clearInterval(timer)
  }, [m])

  const n = m?.nav; const h = m?.hero; const s = m?.stats; const hw = m?.howItWorks
  const pr = m?.pricing; const fq = m?.faq; const ct = m?.cta; const ft = m?.footer

  const prices = { basic: annual ? Math.round(29 * 0.85) : 29, pro: annual ? Math.round(99 * 0.85) : 99, enterprise: annual ? Math.round(399 * 0.85) : 399 }

  const testimonialsData = m ? [
    { quote: m.testimonials?.t1quote || '', name: m.testimonials?.t1name || 'Carlos M.', role: m.testimonials?.t1role || 'CEO · E-commerce', initial: 'C' },
    { quote: m.testimonials?.t2quote || '', name: m.testimonials?.t2name || 'Laura G.', role: m.testimonials?.t2role || "Directora d'Operacions", initial: 'L' },
    { quote: m.testimonials?.t3quote || '', name: m.testimonials?.t3name || 'Miquel T.', role: m.testimonials?.t3role || 'Sales Manager', initial: 'M' },
    { quote: "L'automatització de Gmail ens ha estalviat 20 hores setmanals. El ROI va ser immediat.", name: 'Marc R.', role: 'CTO · SaaS', initial: 'M' },
    { quote: "Els clients reben respostes en segons, fins i tot a les 3 de la matinada. Increïble.", name: 'Sofia P.', role: 'Fundadora · E-learning', initial: 'S' },
    { quote: "Configuració en 10 minuts. Ara gestiona el 90% dels emails sense intervenció humana.", name: 'Joan V.', role: 'Operations Manager', initial: 'J' },
  ] : []

  const mono = "'IBM Plex Mono', monospace"
  const sans = "'Inter', sans-serif"

  const dashboardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = dashboardRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const rotateY = ((x / rect.width) - 0.5) * 10   // intensidad horizontal
    const rotateX = ((y / rect.height) - 0.5) * -10 // intensidad vertical

    setTilt({ x: rotateX, y: rotateY })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <main style={{ minHeight: '100vh', background: '#050505', color: '#e8e4dc', fontFamily: sans, overflowX: 'hidden' }}>
      <CursorLight />

      <style>{`
        @keyframes pulse-accent { 0%,100%{box-shadow:0 0 6px #7c3aed}50%{box-shadow:0 0 18px #7c3aed} }
        @keyframes scroll-logos { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .nav-link:hover{color:#e8e4dc!important}
        .card-hover{transition:border-color .2s,transform .2s,box-shadow .2s}
        .card-hover:hover{border-color:#2a2a2a!important;transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.5)}
        .btn-primary{transition:transform .15s,box-shadow .15s,opacity .15s}
        .btn-primary:hover{transform:translateY(-1px);box-shadow:0 4px 20px rgba(124,58,237,.45)}
        .step-num{transition:color .3s}
        .card-hover:hover .step-num{color:#7c3aed!important}
        .faq-item{border-bottom:1px solid #111;padding:1.5rem 0;transition:border-color .2s}
        .faq-item:hover{border-color:#222}
        .social-proof-item{border-right:1px solid #111;padding:0 2.5rem;text-align:center}
        .social-proof-item:last-child{border-right:none}
      `}</style>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #111', padding: '1.1rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'rgba(5,5,5,0.92)', backdropFilter: 'blur(12px)', zIndex: 10, opacity: heroVisible ? 1 : 0, transition: 'opacity 0.6s ease' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-accent 2s infinite' }} />
          <span style={{ fontSize: 15, letterSpacing: '0.12em', color: '#e8e4dc', fontWeight: 600, fontFamily: mono }}>AXIORA</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {[['#com-funciona', n?.howItWorks || 'COM FUNCIONA'], ['#casos-us', "CASOS D'ÚS"], ['#preus', n?.pricing || 'PREUS'], ['#faq', n?.faq || 'FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="nav-link" style={{ fontSize: 13, color: '#555', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color .2s' }}>{label}</a>
          ))}
          <Link href="/login" className="nav-link" style={{ fontSize: 13, color: '#666', textDecoration: 'none' }}>{n?.login || 'Entrar'}</Link>
          <LocaleSwitcher />
          <Link href="/register" className="btn-primary" style={{ background: '#7c3aed', color: '#fff', padding: '0.55rem 1.25rem', borderRadius: 8, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>{n?.startFree || 'Començar gratis'}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 960, margin: '0 auto', padding: '8rem 2rem 5rem', textAlign: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', height: '100%', background: 'radial-gradient(ellipse 60% 50% at 50% 0%, #7c3aed18 0%, transparent 70%)', pointerEvents: 'none' }} />
        <ParticlesCanvas />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#8b5cf6', background: '#7c3aed14', padding: '5px 14px', borderRadius: 20, marginBottom: '2rem', border: '1px solid #7c3aed33' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b5cf6', animation: 'pulse-accent 2s infinite' }} />
              {h?.badge || "AGENTS D'IA PER A EMPRESES"}
            </div>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.8s ease 0.35s, transform 0.8s ease 0.35s' }}>
            <h1 style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08, marginBottom: '1.5rem', color: '#f0ece4', letterSpacing: '-0.03em' }}>
              {h?.title1 || 'El teu Gmail gestionat'}<br />
              <span style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {typed}<span style={{ opacity: cursorOn ? 1 : 0, transition: 'opacity 0.1s', WebkitTextFillColor: '#8b5cf6' }}>|</span>
              </span>
            </h1>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.8s ease 0.5s, transform 0.8s ease 0.5s' }}>
            <p style={{ fontSize: 18, color: '#666', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2.5rem', fontWeight: 400 }}>
              {h?.description || "Axiora connecta agents d'IA a la teva safata d'entrada. Llegeixen, classifiquen i responen emails automàticament."}
            </p>
          </div>
          <div style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 0.8s ease 0.65s, transform 0.8s ease 0.65s' }}>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as any, marginBottom: '1.5rem' }}>
              <Link href="/register" className="btn-primary" style={{ background: '#7c3aed', color: '#fff', padding: '0.875rem 2.5rem', borderRadius: 10, fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
                {h?.ctaPrimary || 'Crear compte gratis'}
              </Link>
              <a href="#com-funciona" style={{ background: 'transparent', color: '#888', padding: '0.875rem 2.5rem', borderRadius: 10, fontSize: 14, textDecoration: 'none', border: '1px solid #222', transition: 'border-color .2s, color .2s' }} className="btn-outline">
                {h?.ctaSecondary || 'Veure com funciona'}
              </a>
            </div>
            <div style={{ fontSize: 12, color: '#333' }}>{h?.noCard || 'Sense targeta de crèdit · Configura en 5 minuts'}</div>
          </div>
        </div>
      </section>

      {/* Logo carousel */}
      <FadeSection style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '1.5rem 0', background: '#0a0a0a' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#2a2a2a', textAlign: 'center', marginBottom: '1rem', fontFamily: mono }}>INTEGRA AMB LES EINES QUE JA USES</div>
        <LogoCarousel />
      </FadeSection>

      {/* Social proof */}
      <FadeSection style={{ padding: '4rem 2rem', borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', justifyContent: 'center' }}>
          {[
            { value: 94, suffix: '%', label: s?.s2l || 'Emails resolts automàticament' },
            { value: 3, suffix: 'h', label: s?.s1l || 'Estalvi diari per empresa' },
            { value: 5, suffix: 'min', label: s?.s3l || 'Temps de configuració' },
            { value: 500, suffix: '+', label: 'Empreses confien en Axiora' },
          ].map((item, i) => (
            <div key={i} className="social-proof-item" style={{ flex: 1 }}>
              <div style={{ fontSize: 44, fontWeight: 700, color: '#7c3aed', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                <AnimatedCounter target={item.value} suffix={item.suffix} />
              </div>
              <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </FadeSection>

{/* Dashboard preview */}
<FadeSection style={{ maxWidth: 1040, margin: '0 auto', padding: '5rem 2rem' }}>
  <div
    ref={dashboardRef}
    onMouseMove={handleMouseMove}
    onMouseLeave={handleMouseLeave}
    style={{
      border: '1px solid #1a1a1a',
      borderRadius: 16,
      overflow: 'hidden',
      background: '#0a0a0a',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.01)`,
      transition: 'transform 0.12s ease-out'
    }}
  >
    <div style={{ padding: '0.875rem 1.25rem', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#080808' }}>
      {['#ef4444','#f59e0b','#22c55e'].map(c => (
        <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c, opacity: 0.8 }} />
      ))}
      <span style={{ fontSize: 11, color: '#333', marginLeft: '0.5rem', fontFamily: mono }}>
        axiora.app
      </span>
    </div>

    <div style={{ display: 'flex', minHeight: 380 }}>
      <div style={{ width: 200, borderRight: '1px solid #111', padding: '1.5rem 0', background: '#060606' }}>
        <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-accent 2s infinite' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.1em', color: '#555', fontFamily: mono, fontWeight: 500 }}>
            AXIORA
          </span>
        </div>

        {['PANEL', 'ESTADÍSTIQUES', 'CONVERSES', 'AGENTS'].map((item, i) => (
          <div
            key={item}
            style={{
              padding: '0.6rem 1.25rem',
              fontSize: 12,
              color: i === 0 ? '#e8e4dc' : '#333',
              borderLeft: i === 0 ? '2px solid #7c3aed' : '2px solid transparent',
              fontFamily: sans,
              fontWeight: i === 0 ? 500 : 400
            }}
          >
            {item}
          </div>
        ))}
      </div>

      <div style={{ flex: 1, padding: '1.75rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.75rem' }}>
          {[['AGENTS ACTIUS','3'],['CONVERSES','142'],['MISSATGES AVUI','28']].map(([label, value]) => (
            <div key={label} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 8, padding: '1rem 1.25rem' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#444', marginBottom: '0.5rem', fontFamily: mono }}>
                {label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 600, color: '#e8e4dc', fontFamily: sans }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#333', marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '1px solid #0f0f0f', fontFamily: mono }}>
          ACTIVITAT RECENT
        </div>

        {[
          { agent: 'Support Agent', msg: 'Hi, I have a problem with my order...', status: 'OPEN' },
          { agent: 'Sales Agent', msg: "I'm interested in your Pro plan...", status: 'OPEN' },
          { agent: 'Support Agent', msg: 'When will my shipment arrive?', status: 'OPEN' },
        ].map((conv, i) => (
          <div key={i} style={{ padding: '0.75rem 1rem', border: '1px solid #111', borderRadius: 8, marginBottom: '0.5rem', background: '#080808', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: '#444', marginBottom: 3, fontFamily: sans }}>
                {conv.agent}
              </div>
              <div style={{ fontSize: 12, color: '#333', fontFamily: sans }}>
                {conv.msg}
              </div>
            </div>
            <div style={{ fontSize: 9, background: '#7c3aed18', color: '#8b5cf6', padding: '3px 8px', borderRadius: 4, fontFamily: mono, border: '1px solid #7c3aed33' }}>
              {conv.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: 11, color: '#2a2a2a', fontFamily: mono }}>
    Dashboard real d'Axiora
  </div>
</FadeSection>

      {/* Cómo funciona */}
      <FadeSection id="com-funciona" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#555', textAlign: 'center', marginBottom: '0.75rem', fontFamily: mono }}>{hw?.label || 'PROCÉS'}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f0ece4', textAlign: 'center', marginBottom: '3.5rem', letterSpacing: '-0.02em' }}>{hw?.title || 'Configurat en 3 passos'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { step: '01', title: hw?.step1title || 'Connecta el teu Gmail', desc: hw?.step1desc || '', detail: hw?.step1detail || 'Segur · OAuth 2.0' },
              { step: '02', title: hw?.step2title || 'Configura el teu agent', desc: hw?.step2desc || '', detail: hw?.step2detail || 'Sense codi · 2 minuts' },
              { step: '03', title: hw?.step3title || "L'agent treballa", desc: hw?.step3desc || '', detail: hw?.step3detail || 'Automàtic · 24/7' },
            ].map(item => (
              <div key={item.step} className="card-hover" style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 12 }}>
                <div className="step-num" style={{ fontSize: 36, fontWeight: 700, color: '#1a1a1a', marginBottom: '1.25rem', fontFamily: mono }}>{item.step}</div>
                <div style={{ fontSize: 16, color: '#e8e4dc', marginBottom: '0.75rem', fontWeight: 600 }}>{item.title}</div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: '1.25rem' }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: '#7c3aed', letterSpacing: '0.08em', fontFamily: mono }}>{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* Casos de uso */}
      <FadeSection id="casos-us" style={{ maxWidth: 960, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#555', textAlign: 'center', marginBottom: '0.75rem', fontFamily: mono }}>CASOS D'ÚS</div>
        <div style={{ fontSize: 36, fontWeight: 700, color: '#f0ece4', textAlign: 'center', marginBottom: '3rem', letterSpacing: '-0.02em' }}>Veu-ho en acció</div>
        {m && <UseCaseTabs m={m} />}
      </FadeSection>

      {/* Testimonios */}
      <FadeSection style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '4rem 0', background: '#0a0a0a', overflow: 'hidden' }}>
        <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#333', textAlign: 'center', marginBottom: '2rem', fontFamily: mono }}>EL QUE DIUEN ELS NOSTRES CLIENTS</div>
        <TestimonialsCarousel testimonials={testimonialsData} />
      </FadeSection>

      {/* Precios */}
      <FadeSection id="preus" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#555', textAlign: 'center', marginBottom: '0.75rem', fontFamily: mono }}>{pr?.label || 'PREUS'}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f0ece4', textAlign: 'center', marginBottom: '0.75rem', letterSpacing: '-0.02em' }}>{pr?.title || 'Simple i transparent'}</div>
          <div style={{ fontSize: 14, color: '#555', textAlign: 'center', marginBottom: '2rem' }}>{pr?.subtitle || 'Sense permanències · Cancel·la quan vulguis'}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: 13, color: !annual ? '#e8e4dc' : '#444' }}>{pr?.monthly || 'Mensual'}</span>
            <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, background: annual ? '#7c3aed' : '#222', position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', transition: 'background 0.3s' }}>
              <div style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.3s' }} />
            </button>
            <span style={{ fontSize: 13, color: annual ? '#e8e4dc' : '#444' }}>
              {pr?.annual || 'Anual'}
              <span style={{ marginLeft: '0.5rem', fontSize: 10, color: '#8b5cf6', background: '#7c3aed14', padding: '2px 7px', borderRadius: 10, border: '1px solid #7c3aed33' }}>{pr?.discount || '-15%'}</span>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { plan: pr?.basic || 'BÀSIC', price: prices.basic, originalPrice: 29, desc: pr?.basicDesc || 'Per començar', features: pr?.basicFeatures || [], highlighted: false },
              { plan: pr?.pro || 'PRO', price: prices.pro, originalPrice: 99, desc: pr?.proDesc || 'El més popular', features: pr?.proFeatures || [], highlighted: true },
              { plan: pr?.enterprise || 'ENTERPRISE', price: prices.enterprise, originalPrice: 399, desc: pr?.enterpriseDesc || 'Per a grans equips', features: pr?.enterpriseFeatures || [], highlighted: false },
            ].map(item => (
              <div key={item.plan} className="card-hover" style={{ padding: '2rem', background: item.highlighted ? '#7c3aed0f' : '#0a0a0a', border: `1px solid ${item.highlighted ? '#7c3aed55' : '#1a1a1a'}`, borderRadius: 12, position: 'relative' as any }}>
                {item.highlighted && <div style={{ position: 'absolute' as any, top: -1, left: '50%', transform: 'translateX(-50%)', background: '#7c3aed', color: '#fff', fontSize: 10, padding: '3px 14px', letterSpacing: '0.1em', borderRadius: '0 0 8px 8px', fontFamily: mono }}>MÉS POPULAR</div>}
                <div style={{ fontSize: 11, color: '#7c3aed', letterSpacing: '0.15em', marginBottom: '1rem', fontFamily: mono }}>{item.plan}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: 46, color: '#f0ece4', fontWeight: 700, letterSpacing: '-0.02em', transition: 'all 0.3s' }}>{item.price}€</div>
                  {annual && <div style={{ fontSize: 15, color: '#333', textDecoration: 'line-through', marginBottom: '0.75rem' }}>{item.originalPrice}€</div>}
                </div>
                <div style={{ fontSize: 13, color: '#555', marginBottom: annual ? '0.5rem' : '1.75rem' }}>{pr?.perMonth || '/ mes'} · {item.desc}</div>
                {annual && <div style={{ fontSize: 11, color: '#8b5cf6', marginBottom: '1.5rem' }}>{pr?.billedAnnually || 'Facturat anualment'} ({item.price * 12}€/any)</div>}
                {(item.features as string[]).map((f: string) => (
                  <div key={f} style={{ fontSize: 13, color: '#555', marginBottom: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                    <span style={{ color: '#7c3aed', flexShrink: 0, fontSize: 12 }}>✓</span> {f}
                  </div>
                ))}
                <Link href="/register" className="btn-primary" style={{ display: 'block', textAlign: 'center', marginTop: '2rem', background: item.highlighted ? '#7c3aed' : 'transparent', color: item.highlighted ? '#fff' : '#666', padding: '0.875rem', borderRadius: 8, fontSize: 13, textDecoration: 'none', border: item.highlighted ? 'none' : '1px solid #222', fontWeight: item.highlighted ? 600 : 400, transition: 'all .2s' }}>
                  {pr?.start || 'Començar'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </FadeSection>

      {/* FAQ */}
      <FadeSection id="faq" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ fontSize: 12, letterSpacing: '0.15em', color: '#555', textAlign: 'center', marginBottom: '0.75rem', fontFamily: mono }}>{fq?.label || 'FAQ'}</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: '#f0ece4', textAlign: 'center', marginBottom: '3.5rem', letterSpacing: '-0.02em' }}>{fq?.title || 'Preguntes freqüents'}</div>
          {[
            { q: fq?.q1 || '', a: fq?.a1 || '' },
            { q: fq?.q2 || '', a: fq?.a2 || '' },
            { q: fq?.q3 || '', a: fq?.a3 || '' },
            { q: fq?.q4 || '', a: fq?.a4 || '' },
            { q: fq?.q5 || '', a: fq?.a5 || '' },
            { q: fq?.q6 || '', a: fq?.a6 || '' },
          ].map((item, i) => (
            <div key={i} className="faq-item">
              <div style={{ fontSize: 15, color: '#e8e4dc', marginBottom: '0.75rem', fontWeight: 500 }}>{item.q}</div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.8 }}>{item.a}</div>
            </div>
          ))}
        </div>
      </FadeSection>

      {/* CTA */}
      <FadeSection style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 580, margin: '0 auto' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#7c3aed', animation: 'pulse-accent 2s infinite', margin: '0 auto 2rem' }} />
          <div style={{ fontSize: 40, fontWeight: 700, color: '#f0ece4', marginBottom: '1rem', letterSpacing: '-0.02em' }}>{ct?.title || 'Comença avui, gratis'}</div>
          <div style={{ fontSize: 16, color: '#555', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {ct?.desc1 || 'Sense targeta de crèdit. Sense contractes.'}<br />{ct?.desc2 || 'Configura el teu primer agent en 5 minuts.'}
          </div>
          <Link href="/register" className="btn-primary" style={{ background: '#7c3aed', color: '#fff', padding: '1rem 3rem', borderRadius: 10, fontSize: 15, textDecoration: 'none', fontWeight: 600 }}>
            {ct?.button || 'Crear compte gratis'}
          </Link>
          <div style={{ marginTop: '1.5rem', fontSize: 12, color: '#2a2a2a' }}>{ct?.contact || 'Preguntes? Escriu-nos a hola@axiora.ai'}</div>
        </div>
      </FadeSection>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #111', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0a0a0a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#7c3aed' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.1em', color: '#333', fontFamily: mono, fontWeight: 500 }}>AXIORA</span>
        </div>
        <div style={{ fontSize: 12, color: '#222' }}>{ft?.rights || '© 2025 · Tots els drets reservats'}</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/login" className="nav-link" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>{ft?.login || 'Entrar'}</Link>
          <Link href="/register" className="nav-link" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>{ft?.register || 'Registrar-se'}</Link>
        </div>
      </footer>

    </main>
  )
}