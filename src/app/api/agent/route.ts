import { NextRequest, NextResponse } from 'next/server'
import { runAgent } from '@/lib/agent'

export async function POST(req: NextRequest) {
  try {
    const { agentId, message } = await req.json()

    if (!agentId || !message) {
      return NextResponse.json(
        { error: 'agentId y message son requeridos' },
        { status: 400 }
      )
    }

    const result = await runAgent(agentId, message)
    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Error en el agente:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
