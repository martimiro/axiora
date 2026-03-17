import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const agent = await prisma.agent.create({
    data: {
      name: 'Agente de Soporte',
      description: 'Responde preguntas de clientes',
      prompt: `Eres un agente de soporte amable y profesional. 
      Tu objetivo es ayudar a los clientes a resolver sus dudas de forma clara y concisa.
      Responde siempre en el mismo idioma que el cliente.`,
    },
  })

  console.log('Agente creado:', agent)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
