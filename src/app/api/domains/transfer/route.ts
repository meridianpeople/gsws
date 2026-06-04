import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

const VAT_RATE = 0.20

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })

  try {
    const { domain, eppCode } = await req.json()
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })

    // Get TLD transfer price from catalogue
    const tld = '.' + domain.split('.').slice(1).join('.')
    const catalogue = db.prepare(`
      SELECT sell_price FROM gsws_service_catalogue 
      WHERE service_key = ? AND service_type = 'domain_transfer' AND active = 1
    `).get(tld) as any

    const transferExVat = catalogue?.sell_price ?? null
    const transferIncVat = transferExVat !== null ? Math.round(transferExVat * (1 + VAT_RATE) * 100) / 100 : null

    // Check credit if there's a fee
    if (transferIncVat !== null && transferIncVat > 0) {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id=?').get(user.id) as any
      const balance = credits?.balance || 0
      if (balance < transferIncVat) {
        return NextResponse.json({
          error: `Insufficient credit. Transfer costs £${transferIncVat.toFixed(2)} (inc. VAT) but your balance is £${balance.toFixed(2)}.`,
          required: transferIncVat, balance,
        }, { status: 402 })
      }
    }

    // Submit transfer to 20i
    await client.post('/reseller/*/transferDomain', {
      name: domain,
      years: 1,
      privacyService: false,
      ...(eppCode ? { authcode: eppCode } : {}),
    })

    // Deduct credit if applicable
    let newBalance = null
    if (transferIncVat !== null && transferIncVat > 0) {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id=?').get(user.id) as any
      const balance = credits?.balance || 0
      newBalance = Math.round((balance - transferIncVat) * 100) / 100
      db.prepare('INSERT OR REPLACE INTO gsws_user_credits (user_id, balance) VALUES (?, ?)').run(user.id, newBalance)
      db.prepare(`
        INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
        VALUES (?, ?, 'domain_transfer', ?, ?, ?)
      `).run(user.id, -transferIncVat, `Domain transfer: ${domain} (ex VAT £${transferExVat?.toFixed(2)} + VAT £${(transferIncVat - (transferExVat || 0)).toFixed(2)})`, domain, newBalance)
    }

    // Record domain ownership
    db.prepare(`INSERT OR IGNORE INTO gsws_user_domains (user_id, domain_name) VALUES (?, ?)`).run(user.id, domain)

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'domain_transfer', 'domain', ?, ?)
    `).run(user.id, domain, `Transfer initiated for ${domain}${transferIncVat ? ` - charged £${transferIncVat.toFixed(2)}` : ' (free)'}`)

    return NextResponse.json({
      success: true, domain,
      charged: transferIncVat || 0,
      free: !transferIncVat || transferIncVat === 0,
      newBalance,
    })
  } catch (err: any) {
    const msg = err.message || ''
    // 20i error codes
    if (msg.includes('2106') || msg.includes('not available for transfer')) {
      return NextResponse.json({ error: 'This domain is not available for transfer. Ensure it is unlocked and the EPP code is correct.' }, { status: 422 })
    }
    if (msg.includes('2101') || msg.includes('already exists')) {
      return NextResponse.json({ error: 'This domain is already registered with us.' }, { status: 422 })
    }
    if (msg.includes('402') || msg.includes('insufficient')) {
      return NextResponse.json({ error: 'Insufficient funds in reseller account to process transfer.' }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
