import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import crypto from 'crypto'
import { sendTeamInvite } from '@/lib/mailer'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const members = db.prepare(`
    SELECT m.*, u.name as user_name, u.avatar_url
    FROM gsws_account_members m
    LEFT JOIN gsws_users u ON u.id = m.member_user_id
    WHERE m.owner_user_id = ?
    ORDER BY m.created_at DESC
  `).all(user.id)

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { email, name, role } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const validRoles = ['admin', 'billing', 'viewer']
  if (!validRoles.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  // Check not already a member
  const existing = db.prepare('SELECT id FROM gsws_account_members WHERE owner_user_id = ? AND email = ?').get(user.id, email)
  if (existing) return NextResponse.json({ error: 'This email is already a team member' }, { status: 409 })

  const inviteToken = crypto.randomBytes(32).toString('hex')

  // Check if user already exists in system
  const existingUser = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any

  db.prepare(`
    INSERT INTO gsws_account_members (owner_user_id, member_user_id, email, name, role, invite_token)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, existingUser?.id || null, email, name || null, role, inviteToken)

  // Send invite email
  try {
    const inviter = db.prepare('SELECT name, email FROM gsws_users WHERE id=?').get(user.id) as any
    await sendTeamInvite({
      to: email,
      inviterName: inviter?.name || inviter?.email || 'Someone',
      role,
      inviteToken,
    })
  } catch (emailErr) {
    console.error('Failed to send invite email:', emailErr)
    // Don't fail the request if email fails
  }

  return NextResponse.json({ success: true, inviteToken })
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { memberId } = await req.json()
  db.prepare('DELETE FROM gsws_account_members WHERE id = ? AND owner_user_id = ?').run(memberId, user.id)
  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { memberId, role, status } = await req.json()
  if (role) db.prepare('UPDATE gsws_account_members SET role = ? WHERE id = ? AND owner_user_id = ?').run(role, memberId, user.id)
  if (status) db.prepare('UPDATE gsws_account_members SET status = ? WHERE id = ? AND owner_user_id = ?').run(status, memberId, user.id)
  return NextResponse.json({ success: true })
}
