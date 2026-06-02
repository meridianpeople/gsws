import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const user = validateSession(token)
  if (!user) {
    return NextResponse.json({ error: 'Session expired' }, { status: 401 })
  }
  return NextResponse.json({ user })
}
