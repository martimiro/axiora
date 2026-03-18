import 'dotenv/config'
import { NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const agents = await prisma.agent.findMany({
    where: { userId },
    include: {
      conversations: {
        include: {
          messages: { orderBy: { createdAt: 'desc' }, take: 1 }
        },
        orderBy: { updatedAt: 'desc' }
      }
    }
  })
  return NextResponse.json(agents)
}
