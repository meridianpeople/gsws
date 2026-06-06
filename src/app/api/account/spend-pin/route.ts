import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

// GET — get current PIN settings (no PIN hash exposed)
export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const u = db.prepare('SELECT spend_pin_hash, spend_pin_threshold FROM gsws_users WHERE id = ?').get(user.id) as any
  return NextResponse.json({
    pinEnabled: !!u?.spend_pin_hash,
    threshold: u?.spend_pin_threshold || 0,
  })
}

// POST — set or update PIN
export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { pin, threshold, currentPin } = await req.json()

  // Validate PIN format — 4-6 digits
  if (pin && !/^\d{4,6}$/.test(pin)) {
    return NextResponse.json({ error: 'PIN must be 4-6 digits' }, { status: 400 })
  }

  const u = db.prepare('SELECT spend_pin_hash FROM gsws_users WHERE id = ?').get(user.id) as any

  // If PIN already set, require current PIN to change
  if (u?.spend_pin_hash && currentPin) {
    const valid = await bcrypt.compare(String(currentPin), u.spend_pin_hash)
    if (!valid) return NextResponse.json({ error: 'Current PIN is incorrect' }, { status: 403 })
  } else if (u?.spend_pin_hash && !currentPin) {
    return NextResponse.json({ error: 'Current PIN required to make changes' }, { status: 403 })
  }

  const hash = pin ? await bcrypt.hash(String(pin), 10) : null
  db.prepare('UPDATE gsws_users SET spend_pin_hash = ?, spend_pin_threshold = ? WHERE id = ?')
    .run(hash, threshold ?? 0, user.id)

  db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)')
    .run(user.id, 'spend_pin_update', 'account', 'spend_pin', pin ? `PIN set with £${threshold} threshold` : 'PIN removed')

  return NextResponse.json({ success: true })
}

// DELETE — remove PIN
export async function DELETE(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { currentPin } = await req.json()
  const u = db.prepare('SELECT spend_pin_hash FROM gsws_users WHERE id = ?').get(user.id) as any

  if (u?.spend_pin_hash) {
    const valid = await bcrypt.compare(String(currentPin), u.spend_pin_hash)
    if (!valid) return NextResponse.json({ error: 'PIN is incorrect' }, { status: 403 })
  }

  db.prepare('UPDATE gsws_users SET spend_pin_hash = NULL, spend_pin_threshold = 0 WHERE id = ?').run(user.id)
  return NextResponse.json({ success: true })
}
