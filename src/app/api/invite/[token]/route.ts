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

  // Hash password with bcrypt (rounds=12)
  const bcrypt = await import('bcryptjs')
  const passwordHash = await bcrypt.hash(password, 12)

  // Check if user already exists
  let memberUser = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(invite.email) as any

  if (!memberUser) {
    // Create GSWS user record (native, no WP user ID needed)
    const syntheticWpId = -(Date.now()) // negative to avoid colliding with real WP IDs
    db.prepare(`
      INSERT INTO gsws_users (wp_user_id, email, name, role, password_hash, is_active)
      VALUES (?, ?, ?, 'user', ?, 1)
    `).run(syntheticWpId, invite.email, invite.name || invite.email.split('@')[0], passwordHash)
    memberUser = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(invite.email) as any

    // Create Better Auth user + account records for this native user
    const baId = crypto.randomUUID()
    db.prepare(`
      INSERT OR IGNORE INTO "user" (id, name, email, email_verified, auth_provider, gsws_user_id, is_active, created_at, updated_at)
      VALUES (?, ?, ?, 1, 'gsws_native', ?, 1, datetime('now'), datetime('now'))
    `).run(baId, invite.name || invite.email.split('@')[0], invite.email, memberUser.id)
    db.prepare(`
      INSERT OR IGNORE INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
      VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))
    `).run(crypto.randomUUID(), invite.email, baId, passwordHash)
  } else {
    // Update password hash for existing user (both GSWS and BA tables)
    db.prepare('UPDATE gsws_users SET password_hash = ? WHERE id = ?').run(passwordHash, memberUser.id)
    db.prepare(`UPDATE "account" SET password = ? WHERE user_id = (SELECT id FROM "user" WHERE email = ?)`)
      .run(passwordHash, invite.email)
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
