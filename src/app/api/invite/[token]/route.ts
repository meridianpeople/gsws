import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import crypto from 'crypto'

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const invite = db.prepare(`
    SELECT m.*, u.name as inviterName
    FROM gsws_account_members m
    JOIN gsws_users u ON u.id = m.owner_user_id
    WHERE m.invite_token = ? AND m.status = 'pending'
  `).get(token) as any

  if (!invite) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })

  return NextResponse.json({ invite: { email: invite.email, name: invite.name, role: invite.role, inviterName: invite.inviterName } })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const { password } = await req.json()

  const invite = db.prepare(`
    SELECT m.*, u.name as inviterName
    FROM gsws_account_members m
    JOIN gsws_users u ON u.id = m.owner_user_id
    WHERE m.invite_token = ? AND m.status = 'pending'
  `).get(token) as any

  if (!invite) return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 404 })
  if (!password || password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

  // Hash password
  const passwordHash = crypto.createHash('sha256').update(password + 'gsws2026salt').digest('hex')

  // Check if user already exists
  let memberUser = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(invite.email) as any

  if (!memberUser) {
    // Create new user
    const wpUserId = Date.now() // synthetic wp_user_id for invited users
    db.prepare(`
      INSERT INTO gsws_users (wp_user_id, email, name, role, password_hash, is_active)
      VALUES (?, ?, ?, 'user', ?, 1)
    `).run(wpUserId, invite.email, invite.name || invite.email.split('@')[0], passwordHash)
    memberUser = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(invite.email) as any
  } else {
    // Update password hash for existing user
    db.prepare('UPDATE gsws_users SET password_hash = ? WHERE id = ?').run(passwordHash, memberUser.id)
  }

  // Accept invite
  db.prepare(`
    UPDATE gsws_account_members 
    SET member_user_id = ?, status = 'active', accepted_at = CURRENT_TIMESTAMP, invite_token = NULL
    WHERE id = ?
  `).run(memberUser.id, invite.id)

  // Give initial credit
  db.prepare('INSERT OR IGNORE INTO gsws_user_credits (user_id, balance) VALUES (?, 0)').run(memberUser.id)

  // Auto-login — create session
  const sessionToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO gsws_sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(memberUser.id, sessionToken, expiresAt)

  const res = NextResponse.json({ success: true })
  res.cookies.set('gsws_session', sessionToken, {
    httpOnly: true, secure: true, sameSite: 'lax',
    expires: new Date(expiresAt), path: '/',
  })
  return res
}
