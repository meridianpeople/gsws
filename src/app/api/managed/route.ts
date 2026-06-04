import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

// GET /api/managed?resource_type=hosting&resource_id=123
export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const resource_type = searchParams.get('resource_type')
  const resource_id = searchParams.get('resource_id')

  if (resource_type && resource_id) {
    // Check if specific resource is managed
    const managed = db.prepare(`
      SELECT * FROM gsws_managed_services
      WHERE user_id = ? AND resource_type = ? AND resource_id = ? AND status != 'cancelled'
    `).get(user.id, resource_type, resource_id) as any

    return NextResponse.json({ managed: !!managed, service: managed || null })
  }

  // List all managed services for this user
  const services = db.prepare(`
    SELECT * FROM gsws_managed_services
    WHERE user_id = ? AND status != 'cancelled'
    ORDER BY created_at DESC
  `).all(user.id) as any[]

  return NextResponse.json({ services })
}

// POST /api/managed — upgrade to managed
export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { resource_type, resource_id, resource_name } = await req.json()

  if (!resource_type || !resource_id || !resource_name) {
    return NextResponse.json({ error: 'resource_type, resource_id and resource_name are required' }, { status: 400 })
  }

  // Get pricing from catalogue
  const catalogueKey = resource_type === 'hosting' ? 'managed_hosting' : 'managed_domain'
  const catalogue = db.prepare(`
    SELECT * FROM gsws_service_catalogue WHERE service_key = ?
  `).get(catalogueKey) as any

  if (!catalogue) return NextResponse.json({ error: 'Service not found in catalogue' }, { status: 404 })

  const priceExVat = catalogue.sell_price
  const priceIncVat = priceExVat * 1.2

  // Check already managed
  const existing = db.prepare(`
    SELECT id FROM gsws_managed_services
    WHERE user_id = ? AND resource_type = ? AND resource_id = ? AND status != 'cancelled'
  `).get(user.id, resource_type, resource_id)

  if (existing) return NextResponse.json({ error: 'This resource is already managed' }, { status: 400 })

  // Check credit balance
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
  if (!credits || credits.balance < priceIncVat) {
    return NextResponse.json({
      error: `Insufficient credit. Required: £${priceIncVat.toFixed(2)} inc VAT. Available: £${(credits?.balance || 0).toFixed(2)}`,
      status: 400
    }, { status: 400 })
  }

  // Deduct credit
  const renews_at = new Date()
  renews_at.setFullYear(renews_at.getFullYear() + 1)

  db.prepare('UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?').run(priceIncVat, user.id)
  db.prepare(`
    INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
    VALUES (?, ?, 'charge', ?, ?, ?)
  `).run(user.id, -priceIncVat, `Managed ${resource_type}: ${resource_name}`, resource_id,
    (credits.balance - priceIncVat))

  // If hosting — stop monthly billing by recording previous price
  let previousMonthlyPrice = null
  if (resource_type === 'hosting') {
    const renewal = db.prepare(`
      SELECT amount FROM gsws_renewals WHERE resource_id = ? AND resource_type = 'hosting'
    `).get(resource_id) as any
    previousMonthlyPrice = renewal?.amount || 6.00
    // Disable monthly renewal
    db.prepare(`
      UPDATE gsws_renewals SET auto_renew = 0 WHERE resource_id = ? AND resource_type = 'hosting'
    `).run(resource_id)
  }

  // Create managed service record
  db.prepare(`
    INSERT INTO gsws_managed_services
    (user_id, resource_type, resource_id, resource_name, annual_price_ex_vat, annual_price_inc_vat, renews_at, previous_monthly_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(user.id, resource_type, resource_id, resource_name, priceExVat, priceIncVat, renews_at.toISOString().split('T')[0], previousMonthlyPrice)

  // Add renewal entry for managed service
  db.prepare(`
    INSERT OR REPLACE INTO gsws_renewals
    (user_id, resource_type, resource_id, resource_name, amount, billing_period, next_due_date, auto_renew)
    VALUES (?, 'managed_' || ?, ?, ?, ?, 'annual', ?, 1)
  `).run(user.id, resource_type, resource_id, `Managed: ${resource_name}`, priceIncVat, renews_at.toISOString().split('T')[0])

  // Notification
  db.prepare(`
    INSERT INTO gsws_notifications (user_id, type, title, message)
    VALUES (?, 'package', 'Managed service activated', ?)
  `).run(user.id, `${resource_name} is now a managed service. All changes will be handled by our support team.`)

  // Audit log
  db.prepare(`
    INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
    VALUES (?, 'managed_upgrade', ?, ?, ?)
  `).run(user.id, resource_type, resource_name, `Upgraded to managed. Charged £${priceIncVat.toFixed(2)} inc VAT`)

  return NextResponse.json({
    success: true,
    message: `${resource_name} is now a managed service`,
    charged: priceIncVat,
    renews_at: renews_at.toISOString().split('T')[0],
  })
}

// PATCH /api/managed — cancel managed (set to not renew)
export async function PATCH(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { resource_type, resource_id } = await req.json()

  const managed = db.prepare(`
    SELECT * FROM gsws_managed_services
    WHERE user_id = ? AND resource_type = ? AND resource_id = ? AND status = 'active'
  `).get(user.id, resource_type, resource_id) as any

  if (!managed) return NextResponse.json({ error: 'Managed service not found' }, { status: 404 })

  // Set to cancelling — continues until renews_at, then stops
  db.prepare(`
    UPDATE gsws_managed_services SET status = 'cancelling', updated_at = datetime('now')
    WHERE id = ?
  `).run(managed.id)

  db.prepare(`
    UPDATE gsws_renewals SET auto_renew = 0
    WHERE resource_id = ? AND resource_type = 'managed_' || ?
  `).run(resource_id, resource_type)

  // Notification
  db.prepare(`
    INSERT INTO gsws_notifications (user_id, type, title, message)
    VALUES (?, 'package', 'Managed service cancellation scheduled', ?)
  `).run(user.id, `Managed service for ${managed.resource_name} will end on ${managed.renews_at}. No refund is issued.`)

  return NextResponse.json({
    success: true,
    message: `Managed service will end on ${managed.renews_at}. No refund issued.`,
    ends_at: managed.renews_at,
  })
}
