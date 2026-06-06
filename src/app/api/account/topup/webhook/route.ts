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

    // Auto-resume suspended GPU orders if now have enough credit
    const suspended = db.prepare(`
      SELECT * FROM gsws_compute_orders
      WHERE user_id = ? AND resource_type = 'gpu' AND status = 'suspended'
      ORDER BY updated_at DESC
    `).all(user.id) as any[]

    for (const order of suspended) {
      if (newBalance >= order.price_inc_vat) {
        const PERIOD_MS: Record<string, number> = {
          hourly: 3600000, daily: 86400000, weekly: 604800000,
          monthly: 30 * 86400000, annual: 365 * 86400000
        }
        const ms = PERIOD_MS[order.billing_period] || 3600000
        const newExpiry = new Date(Date.now() + ms).toISOString()
        const afterBalance = Math.round((newBalance - order.price_inc_vat) * 100) / 100

        db.prepare('UPDATE gsws_user_credits SET balance = ? WHERE user_id = ?').run(afterBalance, user.id)
        db.prepare("UPDATE gsws_compute_orders SET status = 'active', expires_at = ?, updated_at = datetime('now') WHERE id = ?").run(newExpiry, order.id)
        db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'gpu_compute', ?, ?, ?)`)
          .run(user.id, -order.price_inc_vat, `GPU resumed: ${order.tier} (${order.billing_period})`, order.service_key, afterBalance)
        db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'success', 'GPU instance resumed', ?)`)
          .run(user.id, `Your GPU instance (${order.tier}) has been automatically resumed after top-up.`)
        break // Only resume one at a time
      }
    }

    return NextResponse.json({ success: true, credited: amount })
  } catch (err: any) {
    console.error('Topup webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
