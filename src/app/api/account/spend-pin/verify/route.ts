import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { pin, amount } = await req.json()
  const u = db.prepare('SELECT spend_pin_hash, spend_pin_threshold FROM gsws_users WHERE id = ?').get(user.id) as any

  if (!u?.spend_pin_hash || !amount || amount < (u?.spend_pin_threshold || 0)) {
    return NextResponse.json({ required: false, valid: true })
  }

  if (!pin) return NextResponse.json({ required: true, valid: false })

  const valid = await bcrypt.compare(String(pin), u.spend_pin_hash)
  return NextResponse.json({ required: true, valid })
}
