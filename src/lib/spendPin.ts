import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { NextRequest, NextResponse } from 'next/server'

export async function checkSpendPin(req: NextRequest, userId: number, amount: number): Promise<NextResponse | null> {
  const u = db.prepare('SELECT spend_pin_hash, spend_pin_threshold FROM gsws_users WHERE id = ?').get(userId) as any

  // No PIN set or amount below threshold — allow
  if (!u?.spend_pin_hash || !amount || amount < (u?.spend_pin_threshold || 0)) return null

  // PIN required — check header
  const pin = req.headers.get('x-spend-pin')
  if (!pin) {
    return NextResponse.json({
      error: 'Spend PIN required for this purchase amount.',
      pinRequired: true,
      threshold: u.spend_pin_threshold,
    }, { status: 403 })
  }

  const valid = await bcrypt.compare(pin, u.spend_pin_hash)
  if (!valid) {
    return NextResponse.json({
      error: 'Invalid spend PIN.',
      pinRequired: true,
    }, { status: 403 })
  }

  return null // PIN valid — allow
}
