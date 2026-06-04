import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.GSWS_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Expire sessions older than 1 hour
  const expired = db.prepare(`
    SELECT i.*, su.email as support_email, tu.email as target_email
    FROM gsws_impersonation i
    JOIN gsws_users su ON su.id = i.support_user_id
    JOIN gsws_users tu ON tu.id = i.target_user_id
    WHERE i.status = 'active' AND i.expires_at <= datetime('now')
  `).all() as any[]

  let count = 0
  for (const session of expired) {
    db.prepare(`UPDATE gsws_impersonation SET status = 'expired', ended_at = datetime('now') WHERE id = ?`).run(session.id)
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'impersonate_expired', 'support', ?, ?)`)
      .run(session.support_user_id, session.target_email, `Impersonation session expired: ${session.support_email} → ${session.target_email}`)
    count++
  }

  return NextResponse.json({ success: true, expired: count, timestamp: new Date().toISOString() })
}
