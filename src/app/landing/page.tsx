'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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

export default function Landing() {
  const [annual, setAnnual] = useState(false)
  const [m, setM] = useState<LandingMessages | null>(null)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../../messages/${locale}.json`).then(mod => setM(mod.default))
  }, [])

  const n = m?.nav
  const h = m?.hero
  const s = m?.stats
  const hw = m?.howItWorks
  const at = m?.agentTypes
  const te = m?.testimonials
  const pr = m?.pricing
  const fq = m?.faq
  const ct = m?.cta
  const ft = m?.footer

  const prices = {
    basic: annual ? Math.round(29 * 0.85) : 29,
    pro: annual ? Math.round(99 * 0.85) : 99,
    enterprise: annual ? Math.round(399 * 0.85) : 399,
  }

  return (
    <main style={{ minHeight: '100vh', background: '#080808', color: '#d4d0c8', fontFamily: "'IBM Plex Mono', monospace", overflowX: 'hidden' }}>

      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #111', padding: '1.25rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#080808', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }} />
          <span style={{ fontSize: 13, letterSpacing: '0.25em', color: '#888', fontWeight: 500 }}>AXIORA</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#com-funciona" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.howItWorks || 'COM FUNCIONA'}</a>
          <a href="#preus" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.pricing || 'PREUS'}</a>
          <a href="#faq" style={{ fontSize: 11, color: '#444', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.faq || 'FAQ'}</a>
          <Link href="/login" style={{ fontSize: 11, color: '#666', textDecoration: 'none', letterSpacing: '0.1em' }}>{n?.login || 'ENTRAR'}</Link>
          <LocaleSwitcher />
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '0.5rem 1.25rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>{n?.startFree || 'COMENÇAR GRATIS'}</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '7rem 2rem 5rem', textAlign: 'center' }}>
        <div style={{ display: 'inline-block', fontSize: 10, letterSpacing: '0.3em', color: '#4ade80', background: '#0d2010', padding: '4px 14px', borderRadius: 2, marginBottom: '2rem', border: '1px solid #1a4a1a' }}>
          {h?.badge || 'AGENTS D\'IA PER A EMPRESES'}
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 500, lineHeight: 1.1, marginBottom: '1.5rem', color: '#e8e4dc', letterSpacing: '-0.02em' }}>
          {h?.title1 || 'El teu Gmail gestionat'}<br />
          <span style={{ color: '#4ade80' }}>{h?.title2 || 'per intel·ligència artificial'}</span>
        </h1>
        <p style={{ fontSize: 17, color: '#555', lineHeight: 1.8, marginBottom: '3rem', maxWidth: 580, margin: '0 auto 3rem' }}>
          {h?.description || 'Axiora connecta agents d\'IA a la teva safata d\'entrada. Llegeixen, classifiquen i responen emails automàticament — estalviant hores cada setmana.'}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' as any, marginBottom: '1.5rem' }}>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
            {h?.ctaPrimary || 'CREAR COMPTE GRATIS'}
          </Link>
          <a href="#com-funciona" style={{ background: 'transparent', color: '#888', padding: '1rem 2.5rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', border: '1px solid #222' }}>
            {h?.ctaSecondary || 'VEURE COM FUNCIONA'}
          </a>
        </div>
        <div style={{ fontSize: 11, color: '#2a2a2a' }}>{h?.noCard || 'Sense targeta de crèdit · Configura en 5 minuts'}</div>
      </section>

      {/* Dashboard preview */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 2rem 5rem' }}>
        <div style={{ border: '1px solid #1a1a1a', borderRadius: 8, overflow: 'hidden', background: '#0f0f0f' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #111', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#222' }} />
            <span style={{ fontSize: 10, color: '#333', marginLeft: '0.5rem', letterSpacing: '0.1em' }}>axiora.app</span>
          </div>
          <div style={{ display: 'flex', minHeight: 400 }}>
            <div style={{ width: 180, borderRight: '1px solid #111', padding: '1.5rem 0', background: '#080808' }}>
              <div style={{ padding: '0 1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px #4ade80' }} />
                <span style={{ fontSize: 10, letterSpacing: '0.2em', color: '#666' }}>AXIORA</span>
              </div>
              {['PANEL', 'ESTADÍSTIQUES', 'CONVERSES', 'AGENTS'].map((item, i) => (
                <div key={item} style={{ padding: '0.5rem 1.25rem', fontSize: 9, letterSpacing: '0.1em', color: i === 0 ? '#d4d0c8' : '#333', borderLeft: i === 0 ? '2px solid #d4d0c8' : '2px solid transparent' }}>
                  {item}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {[['AGENTS ACTIUS', '3'], ['CONVERSES', '142'], ['MISSATGES AVUI', '28']].map(([label, value]) => (
                  <div key={label} style={{ background: '#111', border: '1px solid #1a1a1a', borderRadius: 4, padding: '0.875rem 1rem' }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 500, color: '#d4d0c8' }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.15em', color: '#444', marginBottom: '0.75rem', paddingBottom: '0.4rem', borderBottom: '1px solid #111' }}>ACTIVITAT RECENT</div>
              {[
                { agent: 'Agent de Suport', msg: 'Hola, tinc un problema amb la meva comanda...', status: 'OPEN' },
                { agent: 'Agent de Vendes', msg: "M'interessa conèixer més sobre els vostres plans...", status: 'OPEN' },
                { agent: 'Agent de Suport', msg: 'Quan estarà disponible el meu enviament?', status: 'OPEN' },
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
      </section>

      {/* Stats */}
      <section style={{ borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', textAlign: 'center' }}>
          {[
            { value: s?.s1v || '3h', label: s?.s1l || 'Estalvi mitjà diari per empresa' },
            { value: s?.s2v || '94%', label: s?.s2l || 'Emails resolts sense intervenció humana' },
            { value: s?.s3v || '5min', label: s?.s3l || 'Temps de configuració inicial' },
          ].map(item => (
            <div key={item.label}>
              <div style={{ fontSize: 42, fontWeight: 500, color: '#4ade80', marginBottom: '0.5rem' }}>{item.value}</div>
              <div style={{ fontSize: 11, color: '#444', lineHeight: 1.6 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section id="com-funciona" style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem' }}>
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{hw?.label || 'PROCÉS'}</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>{hw?.title || 'Configurat en 3 passos'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          {[
            { step: '01', title: hw?.step1title || 'Connecta el teu Gmail', desc: hw?.step1desc || '', detail: hw?.step1detail || 'Segur · OAuth 2.0' },
            { step: '02', title: hw?.step2title || 'Configura el teu agent', desc: hw?.step2desc || '', detail: hw?.step2detail || 'Sense codi · 2 minuts' },
            { step: '03', title: hw?.step3title || "L'agent treballa", desc: hw?.step3desc || '', detail: hw?.step3detail || 'Automàtic · 24/7' },
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
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{at?.label || 'ESPECIALITZACIÓ'}</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>{at?.title || 'Un agent per a cada necessitat'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {[
              { type: at?.support || 'SUPORT', title: at?.supportTitle || 'Agent de suport', color: '#4ade80', items: at?.supportItems || [] },
              { type: at?.sales || 'VENDES', title: at?.salesTitle || 'Agent de vendes', color: '#60a5fa', items: at?.salesItems || [] },
              { type: at?.admin || 'ADMIN', title: at?.adminTitle || 'Agent administratiu', color: '#f59e0b', items: at?.adminItems || [] },
            ].map(item => (
              <div key={item.type} style={{ padding: '2rem', background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: 4 }}>
                <div style={{ fontSize: 9, color: item.color, letterSpacing: '0.2em', background: '#111', display: 'inline-block', padding: '3px 10px', borderRadius: 2, marginBottom: '1rem', border: `1px solid ${item.color}22` }}>{item.type}</div>
                <div style={{ fontSize: 15, color: '#d4d0c8', marginBottom: '1.25rem', fontWeight: 500 }}>{item.title}</div>
                {(item.items as string[]).map((i: string) => (
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
        <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{te?.label || 'TESTIMONIS'}</div>
        <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '3.5rem' }}>{te?.title || 'El que diuen els nostres clients'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
          {[
            { quote: te?.t1quote || '', name: te?.t1name || 'Carlos M.', role: te?.t1role || 'CEO · E-commerce', initial: 'C' },
            { quote: te?.t2quote || '', name: te?.t2name || 'Laura G.', role: te?.t2role || 'Directora d\'Operacions', initial: 'L' },
            { quote: te?.t3quote || '', name: te?.t3name || 'Miquel T.', role: te?.t3role || 'Sales Manager', initial: 'M' },
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
      <section id="preus" style={{ background: '#0a0a0a', borderTop: '1px solid #111', borderBottom: '1px solid #111', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', color: '#444', textAlign: 'center', marginBottom: '0.75rem' }}>{pr?.label || 'PREUS'}</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: '#e8e4dc', textAlign: 'center', marginBottom: '0.75rem' }}>{pr?.title || 'Simple i transparent'}</div>
          <div style={{ fontSize: 13, color: '#444', textAlign: 'center', marginBottom: '2rem' }}>{pr?.subtitle || 'Sense permanències · Cancel·la quan vulguis'}</div>

          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem' }}>
            <span style={{ fontSize: 11, color: !annual ? '#d4d0c8' : '#444', letterSpacing: '0.1em' }}>{pr?.monthly || 'MENSUAL'}</span>
            <button onClick={() => setAnnual(!annual)} style={{ width: 48, height: 26, borderRadius: 13, background: annual ? '#4ade80' : '#222', position: 'relative', cursor: 'pointer', border: 'none', outline: 'none', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: 3, left: annual ? 25 : 3, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
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
              <div key={item.plan} style={{ padding: '2rem', background: item.highlighted ? '#0d2010' : '#0f0f0f', border: `1px solid ${item.highlighted ? '#4ade80' : '#1a1a1a'}`, borderRadius: 4, position: 'relative' as any }}>
                {item.highlighted && <div style={{ position: 'absolute' as any, top: -1, left: '50%', transform: 'translateX(-50%)', background: '#4ade80', color: '#080808', fontSize: 9, padding: '3px 12px', letterSpacing: '0.15em', borderRadius: '0 0 4px 4px' }}>{pr?.popular || 'MÉS POPULAR'}</div>}
                <div style={{ fontSize: 9, color: '#4ade80', letterSpacing: '0.2em', marginBottom: '1rem' }}>{item.plan}</div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <div style={{ fontSize: 42, color: '#d4d0c8', fontWeight: 500 }}>{item.price}€</div>
                  {annual && <div style={{ fontSize: 14, color: '#333', textDecoration: 'line-through', marginBottom: '0.6rem' }}>{item.originalPrice}€</div>}
                </div>
                <div style={{ fontSize: 11, color: '#444', marginBottom: annual ? '0.5rem' : '2rem' }}>{pr?.perMonth || '/ mes'} · {item.desc}</div>
                {annual && <div style={{ fontSize: 10, color: '#4ade80', marginBottom: '1.5rem' }}>{pr?.billedAnnually || 'Facturat anualment'} ({item.price * 12}€/any)</div>}
                {(item.features as string[]).map((f: string) => (
                  <div key={f} style={{ fontSize: 11, color: '#555', marginBottom: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0 }}>✓</span> {f}
                  </div>
                ))}
                <Link href="/register" style={{ display: 'block', textAlign: 'center', marginTop: '2rem', background: item.highlighted ? '#4ade80' : 'transparent', color: item.highlighted ? '#080808' : '#888', padding: '0.875rem', borderRadius: 4, fontSize: 11, textDecoration: 'none', letterSpacing: '0.1em', border: item.highlighted ? 'none' : '1px solid #222', fontWeight: item.highlighted ? 500 : 400 }}>
                  {pr?.start || 'COMENÇAR'}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ maxWidth: 700, margin: '0 auto', padding: '5rem 2rem' }}>
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
      </section>

      {/* CTA */}
      <section style={{ background: '#0a0a0a', borderTop: '1px solid #111', padding: '5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', margin: '0 auto 2rem' }} />
          <div style={{ fontSize: 36, fontWeight: 500, color: '#e8e4dc', marginBottom: '1rem' }}>{ct?.title || 'Comença avui, gratis'}</div>
          <div style={{ fontSize: 14, color: '#555', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            {ct?.desc1 || 'Sense targeta de crèdit. Sense contractes.'}<br />{ct?.desc2 || 'Configura el teu primer agent en 5 minuts.'}
          </div>
          <Link href="/register" style={{ background: '#4ade80', color: '#080808', padding: '1rem 3rem', borderRadius: 4, fontSize: 12, textDecoration: 'none', letterSpacing: '0.1em', fontWeight: 500 }}>
            {ct?.button || 'CREAR COMPTE GRATIS'}
          </Link>
          <div style={{ marginTop: '1.5rem', fontSize: 10, color: '#2a2a2a' }}>{ct?.contact || 'Preguntes? Escriu-nos a hola@axiora.ai'}</div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #0f0f0f', padding: '2rem 3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
          <span style={{ fontSize: 11, letterSpacing: '0.2em', color: '#2a2a2a' }}>AXIORA</span>
        </div>
        <div style={{ fontSize: 10, color: '#1a1a1a' }}>{ft?.rights || '© 2025 · Tots els drets reservats'}</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <Link href="/login" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>{ft?.login || 'Entrar'}</Link>
          <Link href="/register" style={{ fontSize: 10, color: '#2a2a2a', textDecoration: 'none' }}>{ft?.register || 'Registrar-se'}</Link>
        </div>
      </footer>

    </main>
  )
}