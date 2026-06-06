import { NextRequest, NextResponse } from 'next/server'
import { checkSpendPin } from '@/lib/spendPin'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })

  try {
    const { domain, privacyService, registrant } = await req.json()
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })

    const VAT_RATE = 0.20
    const PRIVACY_PRICE = 5.00

    // Get TLD and price from catalogue
    const tld = '.' + domain.split('.').slice(1).join('.')
    const catalogue = db.prepare(`
      SELECT sell_price, cost_price FROM gsws_service_catalogue 
      WHERE service_key = ? AND active = 1
    `).get(tld) as any

    if (!catalogue) return NextResponse.json({ error: `TLD ${tld} not available` }, { status: 400 })

    // Calculate total inc VAT
    const subtotal = catalogue.sell_price + (privacyService ? PRIVACY_PRICE : 0)
    const vat = Math.round(subtotal * VAT_RATE * 100) / 100
    const total = Math.round((subtotal + vat) * 100) / 100

    // Check user credit balance
    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
    const balance = credits?.balance || 0

    if (balance < total) {
      return NextResponse.json({
        error: `Insufficient credit. You need £${total.toFixed(2)} (inc. VAT) but have £${balance.toFixed(2)}.`,
        required: total,
        balance,
      }, { status: 402 })
    }

    // Register domain with 20i
    await client.post('/reseller/*/addDomain', {
      name: domain,
      privacyService: privacyService === true,
      years: 1,
      ...(registrant ? { contact: { name: registrant.name, email: registrant.email } } : {}),
    })

    // Deduct credits (VAT-inclusive)
    // Check spend PIN
    const pinCheck = await checkSpendPin(req, user.id, totalIncVat)
    if (pinCheck) return pinCheck

    const newBalance = Math.round((balance - total) * 100) / 100
    db.prepare('INSERT OR REPLACE INTO gsws_user_credits (user_id, balance) VALUES (?, ?)').run(user.id, newBalance)

    // Log transaction
    db.prepare(`
      INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'domain_register', ?, ?, ?)
    `).run(user.id, -total, `Domain registration: ${domain} (ex VAT £${subtotal.toFixed(2)} + VAT £${vat.toFixed(2)}${privacyService ? ' + privacy' : ''})`, domain, newBalance)

    // Record domain ownership
    let twentyiDomainId = null
    try {
      const domainList = await client.get('/domain')
      const found = Array.isArray(domainList.data) 
        ? domainList.data.find((d: any) => d.name === domain)
        : null
      if (found) twentyiDomainId = found.id
    } catch {}

    db.prepare(`
      INSERT OR REPLACE INTO gsws_user_domains (user_id, domain_name, twentyi_domain_id, twentyi_package_id)
      VALUES (?, ?, ?, ?)
    `).run(user.id, domain, twentyiDomainId, null)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'domain_register', 'domain', ?, ?)
    `).run(user.id, domain, `Registered ${domain} for £${catalogue.sell_price.toFixed(2)}`)

    return NextResponse.json({
      success: true,
      domain,
      subtotal,
      vat,
      total,
      privacyIncluded: privacyService === true,
      newBalance,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
