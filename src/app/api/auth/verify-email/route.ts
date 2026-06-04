import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

const APP_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.redirect(`${APP_URL}/login?error=invalid_token`)

  const user = db.prepare(`
    SELECT * FROM gsws_users
    WHERE email_verify_token = ? AND email_verified = 0
    AND email_verify_expires > datetime('now')
  `).get(token) as any

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login?error=invalid_or_expired_token`)
  }

  db.prepare(`
    UPDATE gsws_users SET email_verified = 1, email_verify_token = NULL, email_verify_expires = NULL
    WHERE id = ?
  `).run(user.id)

  // Welcome notification
  db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Welcome to GeiG SWS', ?)`)
    .run(user.id, 'Your email has been verified. Your account is now active.')

  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'email_verified', 'auth', 'account', ?)`)
    .run(user.id, `Email verified for ${user.email}`)

  return NextResponse.redirect(`${APP_URL}/login?verified=1`)
}
