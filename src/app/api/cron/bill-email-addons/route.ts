import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.GSWS_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date().toISOString().split('T')[0]
  let billed = 0, skipped = 0, errors = 0

  // Get all active paid addons due for billing
  const dueAddons = db.prepare(`
    SELECT a.*, u.email
    FROM gsws_email_addons a
    JOIN gsws_users u ON u.id = a.user_id
    WHERE a.status = 'active'
    AND a.price_ex_vat > 0
    AND a.next_billing_date <= ?
    ORDER BY a.user_id, a.created_at
  `).all(today) as any[]

  for (const addon of dueAddons) {
    try {
      const priceIncVat = addon.price_ex_vat * 1.2

      // Check credit
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(addon.user_id) as any
      if (!credits || credits.balance < priceIncVat) {
        // Insufficient credit — notify and skip
        db.prepare(`
          INSERT INTO gsws_notifications (user_id, type, title, message)
          VALUES (?, 'system', 'Email addon billing failed', ?)
        `).run(addon.user_id, `Failed to bill £${priceIncVat.toFixed(2)} for ${addon.mailbox_local}@${addon.domain} — insufficient credit. Please top up to keep this mailbox.`)
        skipped++
        continue
      }

      // Charge
      db.prepare('UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?').run(priceIncVat, addon.user_id)
      const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(addon.user_id) as any)?.balance || 0

      // Log transaction
      const label = addon.addon_type === 'mailbox' ? `Mailbox: ${addon.mailbox_local}@${addon.domain}` : `Storage: ${addon.mailbox_local}@${addon.domain}`
      db.prepare(`
        INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
        VALUES (?, ?, 'email_addon', ?, ?, ?)
      `).run(addon.user_id, -priceIncVat, label, addon.package_id, newBalance)

      // Update next billing date
      const next = new Date()
      if (addon.billing_period === 'monthly') {
        next.setMonth(next.getMonth() + 1)
      } else {
        next.setFullYear(next.getFullYear() + 1)
      }

      db.prepare('UPDATE gsws_email_addons SET next_billing_date = ? WHERE id = ?')
        .run(next.toISOString().split('T')[0], addon.id)

      billed++
    } catch (e: any) {
      console.error('[bill-email-addons]', e.message)
      errors++
    }
  }

  return NextResponse.json({ success: true, billed, skipped, errors, due: dueAddons.length, timestamp: new Date().toISOString() })
}
