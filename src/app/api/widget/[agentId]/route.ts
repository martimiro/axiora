import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent'

export async function POST(req: NextRequest, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params
  const { message, sessionId } = await req.json()

  if (!message) return NextResponse.json({ error: 'message requerido' }, { status: 400 })

  try {
    const { reply, conversationId } = await runAgent(agentId, message, sessionId)
    return NextResponse.json({ reply, conversationId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ agentId: string }> }) {
  const { agentId } = await context.params
  return NextResponse.json({ agentId, status: 'active' })
}
