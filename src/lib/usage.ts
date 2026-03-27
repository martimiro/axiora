import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getPlanLimits, isAdmin } from './plans'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function startOfMonth(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1)
}

async function resetIfNewMonth(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  const monthStart = startOfMonth()
  if (user.emailsResetAt < monthStart) {
    return prisma.user.update({
      where: { id: userId },
      data: { emailsUsedThisMonth: 0, emailsResetAt: new Date() },
    })
  }
  return user
}

export async function checkEmailLimit(userId: string): Promise<{ allowed: boolean; used: number; limit: number }> {
  const user = await resetIfNewMonth(userId)
  if (!user) return { allowed: false, used: 0, limit: 0 }

  if (isAdmin(user.role)) {
    return { allowed: true, used: user.emailsUsedThisMonth, limit: Infinity }
  }

  const limits = getPlanLimits(user.plan, user.role)
  if (limits.maxEmailsPerMonth === Infinity) {
    return { allowed: true, used: user.emailsUsedThisMonth, limit: Infinity }
  }

  return {
    allowed: user.emailsUsedThisMonth < limits.maxEmailsPerMonth,
    used: user.emailsUsedThisMonth,
    limit: limits.maxEmailsPerMonth,
  }
}

export async function incrementEmailUsage(userId: string): Promise<void> {
  await resetIfNewMonth(userId)
  await prisma.user.update({
    where: { id: userId },
    data: { emailsUsedThisMonth: { increment: 1 } },
  })
}
