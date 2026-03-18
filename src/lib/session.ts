import { cookies } from 'next/headers'
import { verifyToken } from './auth'

export async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  if (!payload) return null
  return payload.id as string
}
