import 'dotenv/config'
import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/session'
import { getAvailability } from '@/lib/calendar'

export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'No autoritzat' }, { status: 401 })
  try {
    const availability = await getAvailability(userId, 7)
    return NextResponse.json(availability)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
