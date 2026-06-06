import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { destroyInstance } from '@/lib/vastai'

export async function POST(req: NextRequest) {
  const auth = req.headers.get('x-cron-secret')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const expired = db.prepare(`
    SELECT * FROM gsws_compute_orders
    WHERE resource_type = 'gpu'
    AND status = 'active'
    AND expires_at <= datetime('now')
  `).all() as any[]

  const results = []

  for (const order of expired) {
    try {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(order.user_id) as any
      const balance = credits?.balance || 0

      if (balance >= order.price_inc_vat) {
        // Renew — deduct and extend
        const PERIOD_MS: Record<string, number> = {
          hourly: 3600000, daily: 86400000, weekly: 604800000,
          monthly: 30 * 86400000, annual: 365 * 86400000
        }
        const ms = PERIOD_MS[order.billing_period] || 3600000
        const newExpiry = new Date(Date.now() + ms).toISOString()
        const newBalance = Math.round((balance - order.price_inc_vat) * 100) / 100

        db.prepare('UPDATE gsws_user_credits SET balance = ? WHERE user_id = ?').run(newBalance, order.user_id)
        db.prepare("UPDATE gsws_compute_orders SET expires_at = ?, updated_at = datetime('now') WHERE id = ?").run(newExpiry, order.id)
        db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'gpu_compute', ?, ?, ?)`)
          .run(order.user_id, -order.price_inc_vat, `GPU auto-renew: ${order.tier} (${order.billing_period})`, order.service_key, newBalance)
        db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'gpu_renew', 'gpu', ?, ?)`)
          .run(order.user_id, order.service_key, `Auto-renewed £${order.price_inc_vat} — expiry: ${newExpiry} — balance: £${newBalance}`)

        // Warn if balance getting low (less than 3 periods remaining)
        if (newBalance < order.price_inc_vat * 3) {
          db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'warning', 'GPU credit running low', ?)`)
            .run(order.user_id, `Your GPU instance credit is running low. Approx ${Math.floor(newBalance / order.price_inc_vat)} ${order.billing_period} period(s) remaining. Top up to avoid suspension.`)
        }

        results.push({ id: order.id, status: 'renewed', newExpiry, charged: order.price_inc_vat, balance: newBalance })
      } else {
        // Insufficient credit — destroy instance and suspend
        try {
          if (order.provider_instance_id) await destroyInstance(order.provider_instance_id)
        } catch {}

        db.prepare("UPDATE gsws_compute_orders SET status = 'suspended', updated_at = datetime('now') WHERE id = ?").run(order.id)
        db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'warning', 'GPU instance terminated', ?)`)
          .run(order.user_id, `Your GPU instance (${order.tier}) has been terminated due to insufficient credit. Balance: £${balance.toFixed(2)}, required: £${order.price_inc_vat.toFixed(2)}.`)
        db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'gpu_terminate', 'gpu', ?, ?)`)
          .run(order.user_id, order.service_key, `Terminated — insufficient credit (balance: £${balance.toFixed(2)}, required: £${order.price_inc_vat})`)

        results.push({ id: order.id, status: 'terminated', balance, required: order.price_inc_vat })
      }
    } catch (err: any) {
      results.push({ id: order.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: expired.length, results })
}
