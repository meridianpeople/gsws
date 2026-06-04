import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const logs = db.prepare(`
    SELECT id, session_token, action, resource_type, resource_name, detail,
           ip_address, user_agent, created_at
    FROM gsws_audit_log
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, limit, offset) as any[]

  const total = (db.prepare('SELECT COUNT(*) as count FROM gsws_audit_log WHERE user_id = ?').get(user.id) as any).count

  const sessions = db.prepare(`
    SELECT token, created_at, expires_at
    FROM gsws_sessions
    WHERE user_id = ? AND expires_at > datetime('now')
    ORDER BY created_at DESC
  `).all(user.id) as any[]

  return NextResponse.json({ logs, total, page, sessions })
}
