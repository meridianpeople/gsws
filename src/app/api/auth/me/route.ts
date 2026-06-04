import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req) as any
  if (!user) return NextResponse.json({ error: 'Session expired' }, { status: 401 })

  return NextResponse.json({
    user: {
      id: user.id,
      actualUserId: user.actualUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      credit_balance: user.creditBalance,
      isMember: user.isMember || false,
      memberRole: user.memberRole || null,
      ownerEmail: user.ownerEmail || null,
    }
  })
}
