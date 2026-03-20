import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getUserId } from '@/lib/session'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/gmail/callback'
)

export async function GET(req: NextRequest) {
  const userId = await getUserId()
  if (!userId) return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!))

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://mail.google.com/',
    prompt: 'consent',
    include_granted_scopes: false,
    state: userId,
  })
  return NextResponse.redirect(url)
}
