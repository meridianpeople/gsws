import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import crypto from 'crypto'

const HMAC_SECRET = process.env.TOPUP_HMAC_SECRET || 'gsws2026TopupHMAC!GeiG'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, email, order_id, sig } = body

    if (!amount || !email || !order_id || !sig) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify HMAC signature
    const expected = crypto.createHmac('sha256', HMAC_SECRET)
      .update(`${amount}|${email}|${order_id}`)
      .digest('hex')

    if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
    }

    // Check order not already processed
    const existing = db.prepare(
      "SELECT id FROM gsws_topup_history WHERE reference = ?"
    ).get(`WC-${order_id}`) as any

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Find user by email
    const user = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(email) as any
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Credit the account
    db.prepare(`
      INSERT INTO gsws_user_credits (user_id, balance) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
    `).run(user.id, amount, amount)

    const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any)?.balance || amount

    db.prepare(`
      INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'topup', 'WooCommerce order', ?, ?)
    `).run(user.id, amount, 'WC-' + order_id, newBalance)

    // Record in topup history
    db.prepare(`
      INSERT INTO gsws_topup_history (user_id, amount, currency, reference, status)
      VALUES (?, ?, 'GBP', ?, 'completed')
    `).run(user.id, amount, `WC-${order_id}`)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'credit_topup', 'account', 'topup', ?, 'webhook')
    `).run(user.id, `£${amount} credit added via WooCommerce order #${order_id}`)

    return NextResponse.json({ success: true, credited: amount })
  } catch (err: any) {
    console.error('Topup webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
