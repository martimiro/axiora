import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  const password = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.create({
    data: {
      email: 'admin@axiora.com',
      password,
      name: 'Admin',
    }
  })
  console.log('Usuario creado:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
