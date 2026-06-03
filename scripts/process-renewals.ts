import db from '../src/lib/db'

function addNotification(userId: number, type: string, title: string, message: string, link?: string) {
  db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)`)
    .run(userId, type, title, message, link || null)
}

async function processRenewals() {
  const today = new Date().toISOString().split('T')[0]
  const in7Days = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  const in30Days = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const minus30Days = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]

  const renewals = db.prepare(`
    SELECT r.*, u.email, u.name FROM gsws_renewals r
    JOIN gsws_users u ON u.id = r.user_id
    WHERE r.status IN ('active','due','overdue')
  `).all() as any[]

  let processed = 0
  for (const r of renewals) {
    const expires = r.expires_at

    if (expires <= in30Days && expires > in7Days && !r.reminder_30_sent) {
      addNotification(r.user_id, 'renewal', `${r.resource_name} renews in 30 days`,
        `Your ${r.plan_name} renews on ${expires}. Cost: £${r.renewal_price_inc_vat?.toFixed(2)} inc VAT.`, '/renewals')
      db.prepare('UPDATE gsws_renewals SET reminder_30_sent=1, status="due" WHERE id=?').run(r.id)
      processed++
    }

    if (expires <= in7Days && expires > today && !r.reminder_7_sent) {
      addNotification(r.user_id, 'renewal', `⚠️ ${r.resource_name} renews in 7 days`,
        `Urgent: ${r.plan_name} expires ${expires}. Ensure £${r.renewal_price_inc_vat?.toFixed(2)} credit available.`, '/renewals')
      db.prepare('UPDATE gsws_renewals SET reminder_7_sent=1 WHERE id=?').run(r.id)
      processed++
    }

    if (expires <= today && expires > minus30Days && r.auto_renew && r.status !== 'overdue') {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id=?').get(r.user_id) as any
      const balance = credits?.balance || 0
      const cost = r.renewal_price_inc_vat || 0
      if (balance >= cost) {
        const newBalance = Math.round((balance - cost) * 100) / 100
        const newExpiry = new Date(expires); newExpiry.setFullYear(newExpiry.getFullYear() + 1)
        const newExpiryStr = newExpiry.toISOString().split('T')[0]
        db.prepare('INSERT OR REPLACE INTO gsws_user_credits (user_id, balance) VALUES (?, ?)').run(r.user_id, newBalance)
        db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'renewal', ?, ?, ?)`)
          .run(r.user_id, -cost, `Renewal: ${r.resource_name}`, r.resource_name, newBalance)
        db.prepare(`UPDATE gsws_renewals SET expires_at=?, status='active', last_renewed_at=?, reminder_30_sent=0, reminder_7_sent=0, reminder_1_sent=0 WHERE id=?`)
          .run(newExpiryStr, today, r.id)
        addNotification(r.user_id, 'renewal', `✓ ${r.resource_name} renewed`,
          `Renewed until ${newExpiryStr}. £${cost.toFixed(2)} charged.`, '/account/statement')
      } else {
        db.prepare("UPDATE gsws_renewals SET status='overdue' WHERE id=?").run(r.id)
        addNotification(r.user_id, 'low_credit', `❌ ${r.resource_name} renewal failed`,
          `Need £${cost.toFixed(2)} but have £${balance.toFixed(2)}. Top up to avoid suspension.`, '/account/topup')
      }
      processed++
    }

    if (expires <= minus30Days && r.status === 'overdue' && !r.suspended_at) {
      db.prepare("UPDATE gsws_renewals SET status='suspended', suspended_at=? WHERE id=?").run(today, r.id)
      if (r.resource_type === 'hosting') db.prepare("UPDATE gsws_user_packages SET status='suspended' WHERE twentyi_package_id=?").run(r.resource_id)
      addNotification(r.user_id, 'package', `🚫 ${r.resource_name} suspended`,
        `Suspended due to non-payment. Pay now to restore. Deleted in 30 days.`, '/renewals')
      processed++
    }
  }
  console.log(`Processed ${processed} renewal events`)
}

processRenewals().catch(console.error)
