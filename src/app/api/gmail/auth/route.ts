import 'dotenv/config'
import { NextResponse } from 'next/server'
import { google } from 'googleapis'
console.log('CALLBACK URL:', process.env.NEXTAUTH_URL + '/api/gmail/callback')
console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID?.slice(0, 20))

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.NEXTAUTH_URL + '/api/gmail/callback'
)

export async function GET() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://mail.google.com/',
    prompt: 'consent',
    include_granted_scopes: false,
  })
  return NextResponse.redirect(url)
}
