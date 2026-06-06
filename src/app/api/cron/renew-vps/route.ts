import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import { contaboFetch, getToken } from '@/lib/contabo'

// Called daily by cron — checks VPS orders expiring soon and renews them
export async function POST(req: NextRequest) {
  // Verify cron secret
  const auth = req.headers.get('x-cron-secret')
  if (auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const in3Days = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0]

  // Find VPS renewals due within 3 days with auto_renew enabled
  const due = db.prepare(`
    SELECT r.*, o.provider_instance_id, o.service_key
    FROM gsws_renewals r
    JOIN gsws_compute_orders o ON o.id = CAST(r.resource_id AS INTEGER)
    WHERE r.resource_type = 'vps'
    AND r.auto_renew = 1
    AND r.status = 'active'
    AND r.expires_at <= ?
    AND r.expires_at >= date('now')
  `).all(in3Days) as any[]

  const results = []

  for (const renewal of due) {
    try {
      // Check user credit balance
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(renewal.user_id) as any
      const balance = credits?.balance || 0

      if (balance < renewal.renewal_price_inc_vat) {
        // Insufficient credit — send notification, suspend
        db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'warning', 'VPS renewal failed', ?)`)
          .run(renewal.user_id, `Your VPS "${renewal.resource_name}" could not be renewed due to insufficient credit. Please top up to avoid suspension.`)
        db.prepare("UPDATE gsws_renewals SET status = 'suspended', suspended_at = date('now') WHERE id = ?").run(renewal.id)
        results.push({ id: renewal.id, status: 'insufficient_credit' })
        continue
      }

      // Deduct credit
      const newBalance = Math.round((balance - renewal.renewal_price_inc_vat) * 100) / 100
      db.prepare('UPDATE gsws_user_credits SET balance = ? WHERE user_id = ?').run(newBalance, renewal.user_id)

      // Record transaction
      const vat = Math.round(renewal.renewal_price_inc_vat / 1.2 * 0.2 * 100) / 100
      db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'vps', ?, ?, ?)`)
        .run(renewal.user_id, -renewal.renewal_price_inc_vat, `VPS renewal: ${renewal.resource_name}`, renewal.resource_id, newBalance)

      // Extend renewal date by billing period
      const newExpiry = new Date(renewal.expires_at)
      newExpiry.setMonth(newExpiry.getMonth() + 1)
      const newExpiryStr = newExpiry.toISOString().split('T')[0]

      db.prepare(`UPDATE gsws_renewals SET 
        expires_at = ?, last_renewed_at = date('now'), 
        reminder_30_sent = 0, reminder_7_sent = 0, reminder_1_sent = 0,
        updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`).run(newExpiryStr, renewal.id)

      db.prepare("UPDATE gsws_compute_orders SET expires_at = ?, updated_at = datetime('now') WHERE id = ?")
        .run(newExpiryStr, renewal.resource_id)

      // Audit log
      db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'vps_renewal', 'vps', ?, ?)`)
        .run(renewal.user_id, renewal.resource_name, `Auto-renewed for £${renewal.renewal_price_inc_vat} — new expiry: ${newExpiryStr}`)

      // Notify user
      db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'success', 'VPS renewed', ?)`)
        .run(renewal.user_id, `Your VPS "${renewal.resource_name}" has been renewed until ${newExpiryStr}. £${renewal.renewal_price_inc_vat} charged from credit.`)

      results.push({ id: renewal.id, status: 'renewed', newExpiry: newExpiryStr })
    } catch (err: any) {
      results.push({ id: renewal.id, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
