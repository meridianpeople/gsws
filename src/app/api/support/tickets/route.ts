import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Support/admin see all tickets; customers see their own
  const tickets = user.isSupport || user.role === 'super_admin'
    ? db.prepare(`SELECT r.*, u.email as user_email, u.name as user_name FROM gsws_support_requests r JOIN gsws_users u ON u.id = r.user_id ORDER BY r.created_at DESC LIMIT 100`).all()
    : db.prepare(`SELECT * FROM gsws_support_requests WHERE user_id = ? ORDER BY created_at DESC`).all(user.id)

  return NextResponse.json({ tickets })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { subject, message, priority, package_id } = await req.json()
  if (!subject || !message) return NextResponse.json({ error: 'Subject and message required' }, { status: 400 })

  const result = db.prepare(`
    INSERT INTO gsws_support_requests (user_id, package_id, subject, message, priority, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'open', datetime('now'))
  `).run(user.id, package_id || null, subject, message, priority || 'normal')

  db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Support ticket created', ?)`).run(
    user.id, `Your support ticket #${result.lastInsertRowid} has been created: ${subject}`)

  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'ticket_create', 'support', ?, ?)`).run(
    user.id, String(result.lastInsertRowid), `Ticket: ${subject}`)

  return NextResponse.json({ success: true, ticketId: result.lastInsertRowid })
}
