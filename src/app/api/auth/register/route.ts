import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma'
import bcrypt from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
  }
  const exists = await prisma.user.findUnique({ where: { email } })
  if (exists) {
    return NextResponse.json({ error: 'Este email ya está registrado' }, { status: 400 })
  }
  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.create({
    data: { email, password: hashed, name: name || '' }
  })
  return NextResponse.json({ ok: true })
}
