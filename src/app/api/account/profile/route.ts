import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const full = db.prepare('SELECT * FROM gsws_users WHERE id = ?').get(user.id) as any
  const topups = db.prepare(`
    SELECT amount, currency, reference, status, created_at
    FROM gsws_topup_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 10
  `).all(user.id) as any[]
  const packageCount = (db.prepare('SELECT COUNT(*) as c FROM gsws_user_packages WHERE user_id = ?').get(user.id) as any).c
  const domainCount = (db.prepare('SELECT COUNT(*) as c FROM gsws_user_domains WHERE user_id = ?').get(user.id) as any).c

  return NextResponse.json({ user: full, topups, packageCount, domainCount })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { name, first_name, last_name } = await req.json()
    db.prepare(`
      UPDATE gsws_users SET name = ?, first_name = ?, last_name = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(name, first_name, last_name, user.id)

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'profile_update', 'account', 'profile', 'Profile updated', ?)
    `).run(user.id, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
