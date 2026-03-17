import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

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

  const { tokens } = await oauth2Client.getToken(code)
  
  // Guardar tokens en la base de datos
  await prisma.gmailIntegration.upsert({
    where: { id: 'default' },
    update: { accessToken: tokens.access_token!, refreshToken: tokens.refresh_token || '', expiresAt: new Date(tokens.expiry_date!) },
    create: { id: 'default', accessToken: tokens.access_token!, refreshToken: tokens.refresh_token || '', expiresAt: new Date(tokens.expiry_date!) }
  })

  return NextResponse.redirect(new URL('/?gmail=connected', process.env.NEXTAUTH_URL!))
}
