export type HowItWorksMessages = {
  label?: string; title?: string
  step1title?: string; step1desc?: string; step1detail?: string
  step2title?: string; step2desc?: string; step2detail?: string
  step3title?: string; step3desc?: string; step3detail?: string
}

export type AgentTypesMessages = {
  label?: string; title?: string
  useCasesLabel?: string; useCasesTitle?: string; agentResponding?: string
  support?: string; supportTitle?: string; supportItems?: string[]
  sales?: string; salesTitle?: string; salesItems?: string[]
  admin?: string; adminTitle?: string; adminItems?: string[]
}

export type PricingMessages = {
  label?: string; title?: string; subtitle?: string
  monthly?: string; annual?: string; discount?: string
  popular?: string; billedAnnually?: string; perMonth?: string; start?: string
  basic?: string; basicDesc?: string
  pro?: string; proDesc?: string
  enterprise?: string; enterpriseDesc?: string
  basicFeatures?: string[]; proFeatures?: string[]; enterpriseFeatures?: string[]
}

export type LandingMessages = {
  nav: Record<string, string>
  hero: Record<string, string>
  stats: Record<string, string>
  howItWorks: HowItWorksMessages
  agentTypes: AgentTypesMessages
  testimonials: Record<string, string>
  pricing: PricingMessages
  faq: Record<string, string>
  cta: Record<string, string>
  footer: Record<string, string>
  comparison?: Record<string, string>
  security?: Record<string, string>
  videoDemo?: Record<string, string>
  cookieConsent?: Record<string, string>
  logoCarousel?: Record<string, string>
  dashboardPreview?: Record<string, string>
}
