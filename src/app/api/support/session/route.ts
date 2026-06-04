import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const imp = db.prepare(`
    SELECT i.*, tu.email as target_email
    FROM gsws_impersonation i
    JOIN gsws_users tu ON tu.id = i.target_user_id
    WHERE i.token = ? AND i.status = 'active' AND i.expires_at > datetime('now')
  `).get(token) as any

  if (!imp) return NextResponse.json({ valid: false })

  return NextResponse.json({ 
    valid: true, 
    targetEmail: imp.target_email,
    expiresAt: imp.expires_at
  })
}
