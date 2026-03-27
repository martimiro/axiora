export type PlanId = 'basic' | 'pro' | 'enterprise'

export interface PlanLimits {
  maxAgents: number
  maxEmailsPerMonth: number
  integrations: string[]
  hasFullDashboard: boolean
  hasAdvancedAnalytics: boolean
  hasApi: boolean
  hasSla: boolean
}

export const ADMIN_LIMITS: PlanLimits = {
  maxAgents: Infinity,
  maxEmailsPerMonth: Infinity,
  integrations: ['gmail', 'slack', 'all'],
  hasFullDashboard: true,
  hasAdvancedAnalytics: true,
  hasApi: true,
  hasSla: true,
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  basic: {
    maxAgents: 1,
    maxEmailsPerMonth: 500,
    integrations: ['gmail'],
    hasFullDashboard: false,
    hasAdvancedAnalytics: false,
    hasApi: false,
    hasSla: false,
  },
  pro: {
    maxAgents: 5,
    maxEmailsPerMonth: 5000,
    integrations: ['gmail', 'slack'],
    hasFullDashboard: true,
    hasAdvancedAnalytics: true,
    hasApi: false,
    hasSla: false,
  },
  enterprise: {
    maxAgents: Infinity,
    maxEmailsPerMonth: Infinity,
    integrations: ['gmail', 'slack', 'all'],
    hasFullDashboard: true,
    hasAdvancedAnalytics: true,
    hasApi: true,
    hasSla: true,
  },
}

export function isAdmin(role: string): boolean {
  return role === 'admin'
}

export function getPlanLimits(plan: string, role?: string): PlanLimits {
  if (role && isAdmin(role)) return ADMIN_LIMITS
  return PLAN_LIMITS[(plan as PlanId)] ?? PLAN_LIMITS.basic
}

export function isValidPlan(plan: string): plan is PlanId {
  return plan in PLAN_LIMITS
}
