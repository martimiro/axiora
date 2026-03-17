import 'dotenv/config'
import { NextRequest, NextResponse } from 'next/server'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { createToken } from '@/lib/auth'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const user = await prisma.user.findUnique({ where: { email } })
  console.log('Usuario:', user?.email)
  if (!user) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  const valid = await bcrypt.compare(password, user.password)
  console.log('Password válido:', valid)
  if (!valid) return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
  const token = await createToken({ id: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
  return res
}
