/**
 * email-billing.ts — Email addon billing
 *
 * Rules (from gsws_service_catalogue — not hardcoded):
 * - First 3 mailboxes per package: FREE
 * - 4th+ mailbox: £1.50/mo ex VAT (£1.80 inc VAT) charged from credit
 * - Extra storage (10GB blocks): £25/yr ex VAT charged from credit
 */
import db from './db'

interface BillingResult {
  charged: boolean
  amount: number
  reason: string
}

export function chargeEmailAddon(
  userId: number,
  packageId: string,
  domain: string,
  mailboxLocal: string,
  addonType: 'mailbox' | 'storage'
): BillingResult {
  // Get pricing from catalogue
  const catalogueKey = addonType === 'mailbox' ? 'extra_mailbox' : 'extra_storage'
  const catalogue = db.prepare(
    'SELECT * FROM gsws_service_catalogue WHERE service_key = ?'
  ).get(catalogueKey) as any

  if (!catalogue) return { charged: false, amount: 0, reason: 'Catalogue entry not found' }

  const config = JSON.parse(catalogue.config || '{}')
  const priceExVat = catalogue.sell_price
  const priceIncVat = priceExVat * 1.2
  const billingPeriod = catalogue.billing_period // 'monthly' or 'annual'

  if (addonType === 'mailbox') {
    // Count existing active mailboxes for this package
    const existingCount = db.prepare(`
      SELECT COUNT(*) as count FROM gsws_email_addons
      WHERE user_id = ? AND package_id = ? AND addon_type = 'mailbox' AND status = 'active'
    `).get(userId, packageId) as any

    const freeIncluded = config.free_included || 3
    const totalMailboxes = (existingCount?.count || 0) + 1

    if (totalMailboxes <= freeIncluded) {
      // Still within free allowance — record but don't charge
      const nextBilling = new Date()
      nextBilling.setMonth(nextBilling.getMonth() + 1)

      db.prepare(`
        INSERT OR IGNORE INTO gsws_email_addons
        (user_id, package_id, domain, addon_type, mailbox_local, quantity, price_ex_vat, billing_period, next_billing_date)
        VALUES (?, ?, ?, 'mailbox', ?, 1, 0, 'monthly', ?)
      `).run(userId, packageId, domain, mailboxLocal, nextBilling.toISOString().split('T')[0])

      return { charged: false, amount: 0, reason: `Free mailbox (${totalMailboxes}/${freeIncluded} included)` }
    }

    // Check credit
    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any
    if (!credits || credits.balance < priceIncVat) {
      return { charged: false, amount: 0, reason: `Insufficient credit (need £${priceIncVat.toFixed(2)})` }
    }

    // Charge credit
    db.prepare(`
      UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?
    `).run(priceIncVat, userId)

    const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any)?.balance || 0

    // Log transaction
    db.prepare(`
      INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'email_addon', ?, ?, ?)
    `).run(userId, -priceIncVat, `Extra mailbox: ${mailboxLocal}@${domain}`, packageId, newBalance)

    // Record addon
    const nextBilling = new Date()
    nextBilling.setMonth(nextBilling.getMonth() + 1)

    db.prepare(`
      INSERT OR REPLACE INTO gsws_email_addons
      (user_id, package_id, domain, addon_type, mailbox_local, quantity, price_ex_vat, billing_period, next_billing_date)
      VALUES (?, ?, ?, 'mailbox', ?, 1, ?, 'monthly', ?)
    `).run(userId, packageId, domain, mailboxLocal, priceExVat, nextBilling.toISOString().split('T')[0])

    // Notification
    db.prepare(`
      INSERT INTO gsws_notifications (user_id, type, title, message)
      VALUES (?, 'package', 'Email addon charged', ?)
    `).run(userId, `£${priceIncVat.toFixed(2)} charged for extra mailbox ${mailboxLocal}@${domain}. Next billing: ${nextBilling.toLocaleDateString('en-GB')}`)

    return { charged: true, amount: priceIncVat, reason: `Mailbox ${totalMailboxes} (exceeds ${freeIncluded} free)` }
  }

  // Storage addon
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any
  const annualPrice = priceIncVat
  if (!credits || credits.balance < annualPrice) {
    return { charged: false, amount: 0, reason: `Insufficient credit (need £${annualPrice.toFixed(2)})` }
  }

  db.prepare('UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?').run(annualPrice, userId)
  const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any)?.balance || 0

  db.prepare(`
    INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
    VALUES (?, ?, 'email_addon', ?, ?, ?)
  `).run(userId, -annualPrice, `Extra storage 10GB: ${mailboxLocal}@${domain}`, packageId, newBalance)

  const nextBilling = new Date()
  nextBilling.setFullYear(nextBilling.getFullYear() + 1)

  db.prepare(`
    INSERT OR REPLACE INTO gsws_email_addons
    (user_id, package_id, domain, addon_type, mailbox_local, quantity, price_ex_vat, billing_period, next_billing_date)
    VALUES (?, ?, ?, 'storage', ?, 1, ?, 'annual', ?)
  `).run(userId, packageId, domain, mailboxLocal, priceExVat, nextBilling.toISOString().split('T')[0])

  return { charged: true, amount: annualPrice, reason: `Extra 10GB storage for ${mailboxLocal}@${domain}` }
}
