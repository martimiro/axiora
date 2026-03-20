import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function notifyOperator({
  operatorEmail,
  agentName,
  conversationId,
  message,
  reply,
}: {
  operatorEmail: string
  agentName: string
  conversationId: string
  message: string
  reply: string
}) {
  const dashboardUrl = `${process.env.NEXTAUTH_URL}/?conv=${conversationId}`

  await resend.emails.send({
from: 'Axiora <onboarding@resend.dev>',
    to: operatorEmail,
    subject: `Nuevo mensaje gestionado por ${agentName}`,
    html: `
      <div style="font-family: monospace; max-width: 600px; margin: 0 auto; padding: 2rem; background: #0f0f0f; color: #d4d0c8;">
        <div style="margin-bottom: 1.5rem;">
          <span style="color: #4ade80;">●</span>
          <span style="color: #888; letter-spacing: 0.2em; margin-left: 8px;">AXIORA</span>
        </div>
        <h2 style="color: #e8e4dc; font-weight: 500; margin-bottom: 0.5rem;">Nuevo mensaje gestionado</h2>
        <p style="color: #555; font-size: 13px; margin-bottom: 2rem;">El agente <strong style="color: #d4d0c8;">${agentName}</strong> ha gestionado una nueva conversación.</p>
        
        <div style="background: #1a1a1a; border: 1px solid #222; border-radius: 4px; padding: 1rem; margin-bottom: 1rem;">
          <div style="font-size: 10px; color: #444; letter-spacing: 0.15em; margin-bottom: 0.5rem;">MENSAJE DEL CLIENTE</div>
          <div style="font-size: 13px; color: #888; line-height: 1.6;">${message.slice(0, 300)}${message.length > 300 ? '...' : ''}</div>
        </div>

        <div style="background: #0d2010; border: 1px solid #1a4a1a; border-radius: 4px; padding: 1rem; margin-bottom: 2rem;">
          <div style="font-size: 10px; color: #4ade80; letter-spacing: 0.15em; margin-bottom: 0.5rem;">RESPUESTA DEL AGENTE</div>
          <div style="font-size: 13px; color: #888; line-height: 1.6;">${reply.slice(0, 300)}${reply.length > 300 ? '...' : ''}</div>
        </div>

        <a href="${dashboardUrl}" style="display: inline-block; background: #4ade80; color: #080808; padding: 0.75rem 1.5rem; border-radius: 4px; text-decoration: none; font-size: 11px; letter-spacing: 0.1em;">VER CONVERSACIÓN</a>
        
        <p style="color: #2a2a2a; font-size: 10px; margin-top: 2rem;">Axiora · Plataforma de agentes de IA</p>
      </div>
    `
  })
}
