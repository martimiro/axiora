import 'dotenv/config'
import { google } from 'googleapis'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/calendar/callback'
  )
}

export async function getCalendarClient(userId: string) {
  const integration = await prisma.calendarIntegration.findUnique({ where: { userId } })
  if (!integration) throw new Error('Calendar no connectat')

  const auth = getOAuthClient()
  auth.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
    expiry_date: integration.expiresAt.getTime(),
  })

  // Force refresh if token expired
  if (new Date() >= integration.expiresAt) {
    const { credentials } = await auth.refreshAccessToken()
    await prisma.calendarIntegration.update({
      where: { userId },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: new Date(credentials.expiry_date || Date.now() + 3600000),
      }
    })
    auth.setCredentials(credentials)
  }

  // Auto-refresh token
  auth.on('tokens', async (tokens) => {
    if (tokens.access_token) {
      await prisma.calendarIntegration.update({
        where: { userId },
        data: {
          accessToken: tokens.access_token,
          expiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        }
      })
    }
  })

  return google.calendar({ version: 'v3', auth })
}

export async function getAvailability(userId: string, daysAhead = 7) {
  const calendar = await getCalendarClient(userId)
  const now = new Date()
  const end = new Date()
  end.setDate(end.getDate() + daysAhead)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  })

  const events = res.data.items || []
  const busySlots = events.map(e => ({
    title: e.summary || 'Ocupat',
    start: e.start?.dateTime || e.start?.date || '',
    end: e.end?.dateTime || e.end?.date || '',
  }))

  // Generate free slots (9am-6pm, 1h slots, Mon-Fri)
  const freeSlots: { start: string; end: string; label: string }[] = []
  const cursor = new Date(now)
  cursor.setMinutes(0, 0, 0)
  if (cursor.getHours() >= 18) { cursor.setDate(cursor.getDate() + 1); cursor.setHours(9) }
  else if (cursor.getHours() < 9) cursor.setHours(9)

  while (cursor < end && freeSlots.length < 10) {
    const day = cursor.getDay()
    if (day !== 0 && day !== 6) {
      const slotEnd = new Date(cursor)
      slotEnd.setHours(cursor.getHours() + 1)

      if (cursor.getHours() >= 9 && slotEnd.getHours() <= 18) {
        const conflict = busySlots.some(b => {
          const bs = new Date(b.start), be = new Date(b.end)
          return cursor < be && slotEnd > bs
        })
        if (!conflict) {
          freeSlots.push({
            start: cursor.toISOString(),
            end: slotEnd.toISOString(),
            label: cursor.toLocaleDateString('ca', { weekday: 'long', day: 'numeric', month: 'short' }) + ' ' + cursor.toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }) + '-' + slotEnd.toLocaleTimeString('ca', { hour: '2-digit', minute: '2-digit' }),
          })
        }
      }
    }
    cursor.setHours(cursor.getHours() + 1)
    if (cursor.getHours() >= 18) { cursor.setDate(cursor.getDate() + 1); cursor.setHours(9) }
  }

  return { busySlots, freeSlots }
}

export async function createEvent(userId: string, { title, start, end, attendeeEmail, description }: { title: string; start: string; end: string; attendeeEmail?: string; description?: string }) {
  const calendar = await getCalendarClient(userId)

  const event = await calendar.events.insert({
    calendarId: 'primary',
    sendUpdates: 'all',
    requestBody: {
      summary: title,
      description,
      start: { dateTime: start, timeZone: 'Europe/Madrid' },
      end: { dateTime: end, timeZone: 'Europe/Madrid' },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    },
  })

  return event.data
}

export async function getEvents(userId: string, daysAhead = 30) {
  const calendar = await getCalendarClient(userId)
  const now = new Date()
  const end = new Date()
  end.setDate(end.getDate() + daysAhead)

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: end.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  })

  return res.data.items || []
}
