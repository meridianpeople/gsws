import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const { token, password } = await req.json()
  if (!token || !password) return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  const user = db.prepare(`
    SELECT * FROM gsws_users
    WHERE reset_token = ? AND reset_token_expires > datetime('now') AND auth_provider = 'gsws_native'
  `).get(token) as any

  if (!user) return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })

  const passwordHash = await bcrypt.hash(password, 12)

  db.prepare(`
    UPDATE gsws_users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?
  `).run(passwordHash, user.id)

  // Update BA account credential
  try { db.prepare(`UPDATE account SET password = ? WHERE accountId = ?`).run(passwordHash, user.email) } catch {}

  // Invalidate all sessions
  db.prepare(`DELETE FROM gsws_sessions WHERE user_id = ?`).run(user.id)
  db.prepare(`DELETE FROM session WHERE userId IN (SELECT id FROM user WHERE email = ?)`).run(user.email)

  db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.id, 'password_reset', 'auth', 'account', 'Password reset successfully')
  db.prepare('INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(user.id, 'system', 'Password changed', 'Your password was successfully reset. If this was not you, contact support immediately.')

  return NextResponse.json({ success: true, message: 'Password reset successfully. You can now log in.' })
}

// GET - validate token (for page load check)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ valid: false })

  const user = db.prepare(`
    SELECT id, email FROM gsws_users
    WHERE reset_token = ? AND reset_token_expires > datetime('now')
  `).get(token) as any

  return NextResponse.json({ valid: !!user, email: user?.email })
}
