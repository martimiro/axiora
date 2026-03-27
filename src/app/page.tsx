'use client'
import { useState, useEffect } from 'react'
import CursorLight from '@/components/landing/CursorLight'
import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import LogoCarousel from '@/components/landing/LogoCarousel'
import StatsSection from '@/components/landing/StatsSection'
import DashboardPreview from '@/components/landing/DashboardPreview'
import HowItWorks from '@/components/landing/HowItWorks'
import UseCaseTabs from '@/components/landing/UseCaseTabs'
import VideoDemo from '@/components/landing/VideoDemo'
import ComparisonTable from '@/components/landing/ComparisonTable'
import SecurityBadges from '@/components/landing/SecurityBadges'
import TestimonialsCarousel from '@/components/landing/TestimonialsCarousel'
import PricingSection from '@/components/landing/PricingSection'
import FAQSection from '@/components/landing/FAQSection'
import CTASection from '@/components/landing/CTASection'
import Footer from '@/components/landing/Footer'
import CookieConsent from '@/components/landing/CookieConsent'
import LoadingSkeleton from '@/components/landing/LoadingSkeleton'
import type { LandingMessages } from '@/components/landing/types'
import './landing.css'

export default function Landing() {
  const [m, setM] = useState<LandingMessages | null>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('locale='))
    const locale = cookie ? cookie.split('=')[1].trim() : 'ca'
    import(`../../messages/${locale}.json`).then(mod => setM(mod.default))
    setTimeout(() => setHeroVisible(true), 100)
  }, [])

  if (!m) return <LoadingSkeleton />

  return (
    <main className="l-main" role="main">
      <a href="#main-content" className="l-skip-link">Skip to content</a>
      <CursorLight />
      <Navbar m={m} visible={heroVisible} />

      <div id="main-content">
        <HeroSection m={m} visible={heroVisible} />
        <LogoCarousel m={m} />
        <StatsSection m={m} />
        <DashboardPreview m={m} />
        <HowItWorks m={m} />
        <UseCaseTabs m={m} />
        <VideoDemo m={m} />
        <ComparisonTable m={m} />
        <SecurityBadges m={m} />
        <TestimonialsCarousel m={m} />
        <PricingSection m={m} />
        <FAQSection m={m} />
        <CTASection m={m} />
      </div>

      <Footer m={m} />
      <CookieConsent m={m} />
    </main>
  )
}
