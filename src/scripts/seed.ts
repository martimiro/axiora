import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const user = await prisma.user.findFirst({ where: { email: 'admin@axiora.com' } })
  if (!user) throw new Error('Usuario admin no encontrado')

  const agent = await prisma.agent.create({
    data: {
      name: 'Agente de Soporte',
      description: 'Responde preguntas de clientes',
      prompt: `Eres un agente de soporte amable y profesional. 
      Tu objetivo es ayudar a los clientes a resolver sus dudas de forma clara y concisa.
      Responde siempre en el mismo idioma que el cliente.`,
      userId: user.id,
    },
  })
  console.log('Agente creado:', agent)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
