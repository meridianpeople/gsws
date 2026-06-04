import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { ticketId } = await params

  const ticket = db.prepare('SELECT * FROM gsws_support_requests WHERE id = ?').get(ticketId) as any
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (ticket.user_id !== user.id && !user.isSupport && user.role !== 'super_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ ticket })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { ticketId } = await params

  const ticket = db.prepare('SELECT * FROM gsws_support_requests WHERE id = ?').get(ticketId) as any
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = ticket.user_id === user.id
  const isStaff = user.isSupport || user.role === 'super_admin'
  if (!isOwner && !isStaff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { status, priority, reply } = await req.json()

  if (isStaff && status) {
    db.prepare(`UPDATE gsws_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, ticketId)
    if (status === 'resolved') {
      db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Support ticket resolved', ?)`).run(
        ticket.user_id, `Your ticket #${ticketId} has been resolved`)
    }
  }

  if (isStaff && priority) {
    db.prepare(`UPDATE gsws_support_requests SET priority = ? WHERE id = ?`).run(priority, ticketId)
  }

  return NextResponse.json({ success: true })
}
