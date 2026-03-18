import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { getUserId } from '@/lib/session'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/gmail/callback'
)

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) return NextResponse.json({ error: 'No code' }, { status: 400 })

  const userId = await getUserId()
  if (!userId) return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!))

  const { tokens } = await oauth2Client.getToken(code)

  await prisma.gmailIntegration.upsert({
    where: { userId },
    update: {
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || '',
      expiresAt: new Date(tokens.expiry_date!)
    },
    create: {
      id: userId,
      userId,
      accessToken: tokens.access_token!,
      refreshToken: tokens.refresh_token || '',
      expiresAt: new Date(tokens.expiry_date!)
    }
  })

  return NextResponse.redirect(new URL('/?gmail=connected', process.env.NEXTAUTH_URL!))
}
