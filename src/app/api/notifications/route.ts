import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const notifications = db.prepare(`
    SELECT * FROM gsws_notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(user.id)

  const unreadCount = (db.prepare(`
    SELECT COUNT(*) as count FROM gsws_notifications WHERE user_id = ? AND read = 0
  `).get(user.id) as any)?.count || 0

  return NextResponse.json({ notifications, unreadCount })
}

export async function PATCH(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, readAll } = await req.json()

  if (readAll) {
    db.prepare('UPDATE gsws_notifications SET read = 1 WHERE user_id = ?').run(user.id)
  } else if (id) {
    db.prepare('UPDATE gsws_notifications SET read = 1 WHERE id = ? AND user_id = ?').run(id, user.id)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await req.json()
  db.prepare('DELETE FROM gsws_notifications WHERE id = ? AND user_id = ?').run(id, user.id)
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { action } = await req.json()

  if (action === 'mark_all_read') {
    db.prepare(`UPDATE gsws_notifications SET read = 1, updated_at = datetime('now') WHERE user_id = ?`).run(user.id)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
