import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import crypto from 'crypto'

// POST — start impersonation session
export async function POST(req: NextRequest) {
  const session = await getGswsSession(req)
  if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  
  const agent = db.prepare('SELECT * FROM gsws_users WHERE id = ?').get(session.actualUserId) as any
  if (!['support', 'super_admin'].includes(agent?.role)) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const target = db.prepare('SELECT * FROM gsws_users WHERE email = ? AND is_active = 1').get(email) as any
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.id === session.actualUserId) return NextResponse.json({ error: 'Cannot impersonate yourself' }, { status: 400 })
  if (['support', 'super_admin'].includes(target.role)) return NextResponse.json({ error: 'Cannot impersonate privileged users' }, { status: 403 })

  // Generate impersonation token (1 hour)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  db.prepare(`
    INSERT INTO gsws_impersonation (support_user_id, target_user_id, token, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(session.actualUserId, target.id, token, expiresAt)

  // Audit log
  db.prepare(`
    INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
    VALUES (?, 'impersonate_start', 'support', ?, ?, ?)
  `).run(session.actualUserId, email, `Support agent ${agent.email} started impersonation of ${email}`,
    req.headers.get('x-forwarded-for') || 'unknown')

  // Notify target user
  db.prepare(`
    INSERT INTO gsws_notifications (user_id, type, title, message)
    VALUES (?, 'system', 'Support access', ?)
  `).run(target.id, `A support agent accessed your account at ${new Date().toLocaleString('en-GB')}. If this was not expected, contact us immediately.`)

  return NextResponse.json({ 
    success: true, 
    token,
    targetEmail: email,
    expiresAt,
    redirectUrl: `/support/session?token=${token}`
  })
}

// DELETE — end impersonation session
export async function DELETE(req: NextRequest) {
  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 })

  const imp = db.prepare('SELECT * FROM gsws_impersonation WHERE token = ? AND status = ?').get(token, 'active') as any
  if (!imp) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  db.prepare(`UPDATE gsws_impersonation SET status = 'ended', ended_at = datetime('now') WHERE token = ?`).run(token)

  db.prepare(`
    INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
    VALUES (?, 'impersonate_end', 'support', ?, ?)
  `).run(imp.support_user_id, `impersonation_${token.substring(0,8)}`, 'Support impersonation session ended')

  return NextResponse.json({ success: true })
}
