import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const user = validateSession(token) as any
  if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

  return NextResponse.json({
    user: {
      id: user.id,
      actualUserId: user.actualUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      credit_balance: user.credit_balance,
      isMember: user.isMember || false,
      memberRole: user.memberRole || null,
      ownerEmail: user.ownerEmail || null,
    }
  })
}
