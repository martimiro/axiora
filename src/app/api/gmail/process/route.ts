import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { processNewEmails } from '@/lib/gmail'

export async function POST(req: NextRequest) {
  try {
    const { agentId } = await req.json()
    if (!agentId) return NextResponse.json({ error: 'agentId requerido' }, { status: 400 })
    const results = await processNewEmails(agentId)
    return NextResponse.json({ processed: results.length, results })
  } catch (error: any) {
    console.error('Error procesando emails:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
