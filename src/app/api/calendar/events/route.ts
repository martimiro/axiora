import 'dotenv/config'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/session'
import { getEvents } from '@/lib/calendar'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  try {
    const events = await getEvents(userId, 30)
    return NextResponse.json(events)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
