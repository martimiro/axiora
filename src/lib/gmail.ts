import 'dotenv/config'
import { google } from 'googleapis'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import { runAgent } from './agent'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL + '/api/gmail/callback'
  )
}

export async function getGmailClient() {
  const integration = await prisma.gmailIntegration.findUnique({ where: { id: 'default' } })
  if (!integration) throw new Error('Gmail no conectado')

  const auth = getOAuthClient()
  auth.setCredentials({
    access_token: integration.accessToken,
    refresh_token: integration.refreshToken,
  })

  return google.gmail({ version: 'v1', auth })
}

export async function processNewEmails(agentId: string) {
  const gmail = await getGmailClient()

  // Obtener emails no leídos
  const res = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread -from:me',
    maxResults: 5,
  })

  const messages = res.data.messages || []
  const results = []

  for (const msg of messages) {
    const full = await gmail.users.messages.get({
      userId: 'me',
      id: msg.id!,
      format: 'full',
    })

    const headers = full.data.payload?.headers || []
    const subject = headers.find(h => h.name === 'Subject')?.value || '(sin asunto)'
    const from = headers.find(h => h.name === 'From')?.value || ''
    const body = extractBody(full.data.payload)

    if (!body) continue

    // Procesar con el agente
    const { reply, conversationId } = await runAgent(
      agentId,
      `Email de: ${from}\nAsunto: ${subject}\n\n${body}`
    )

    // Responder al email
	const config = await prisma.config.findUnique({ where: { key: 'gmail_auto_reply' } })
	const autoReply = config?.value === 'true'
	if (autoReply) {
  		await sendReply(gmail, msg.id!, from, subject, reply)
	}   
 // Marcar como leído
    await gmail.users.messages.modify({
      userId: 'me',
      id: msg.id!,
      requestBody: { removeLabelIds: ['UNREAD'] }
    })

    results.push({ from, subject, reply, conversationId })
  }

  return results
}

function extractBody(payload: any): string {
  if (!payload) return ''
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractBody(part)
      if (text) return text
    }
  }
  return ''
}

async function sendReply(gmail: any, messageId: string, to: string, subject: string, body: string) {
  const email = [
    `To: ${to}`,
    `Subject: Re: ${subject}`,
    `In-Reply-To: ${messageId}`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
    body
  ].join('\n')

  const encoded = Buffer.from(email).toString('base64url')

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw: encoded, threadId: messageId }
  })
}
