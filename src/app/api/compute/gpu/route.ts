import { NextRequest, NextResponse } from 'next/server'
import { checkSpendPin } from '@/lib/spendPin'
import { getGswsSession } from '@/lib/session'
import { searchOffers, createInstance, getInstance, TEMPLATE_IMAGES } from '@/lib/vastai'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const tier = req.nextUrl.searchParams.get('tier')
  if (tier) {
    try {
      const offers = await searchOffers(tier)
      const catalogue = db.prepare(`SELECT * FROM gsws_service_catalogue WHERE service_type = 'gpu' AND service_key LIKE ?`).all(`gpu_${tier}_%`) as any[]
      return NextResponse.json({ offers, pricing: catalogue })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  const orders = db.prepare(`SELECT * FROM gsws_compute_orders WHERE user_id = ? AND resource_type = 'gpu' ORDER BY created_at DESC`).all(user.id) as any[]
  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { tier, billing_period, managed_level, offer_id, template, custom_image } = await req.json()
  if (!tier || !billing_period) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  // Get pricing
  const serviceKey = `gpu_${tier}_${billing_period}`
  const catalogue = db.prepare('SELECT * FROM gsws_service_catalogue WHERE service_key = ?').get(serviceKey) as any
  if (!catalogue) return NextResponse.json({ error: 'Invalid tier or billing period' }, { status: 400 })

  const config = JSON.parse(catalogue.config || '{}')
  let priceExVat = catalogue.sell_price
  let managedAddon = 0

  // Apply managed addon
  if (managed_level && managed_level !== 'none') {
    const pctMap: Record<string, number> = { basic: 20, standard: 35, full: 60, enterprise: 100 }
    const pct = pctMap[managed_level] || 0
    managedAddon = priceExVat * (pct / 100)
    priceExVat += managedAddon
  }

  const priceIncVat = priceExVat * 1.2

  // Check credit balance
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
  if (!credits || credits.balance < priceIncVat) {
    return NextResponse.json({ error: `Insufficient credit. Required: £${priceIncVat.toFixed(2)}, Available: £${(credits?.balance || 0).toFixed(2)}` }, { status: 400 })
  }

  // Create order
  const now = new Date()
  let expiresAt: Date
  switch (billing_period) {
    case 'hourly':  expiresAt = new Date(now.getTime() + 60 * 60 * 1000); break
    case 'daily':   expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); break
    case 'weekly':  expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); break
    case 'monthly': expiresAt = new Date(now.setMonth(now.getMonth() + 1)); break
    case 'annual':  expiresAt = new Date(now.setFullYear(now.getFullYear() + 1)); break
    default:        expiresAt = new Date(now.getTime() + 60 * 60 * 1000)
  }

  // Check spend PIN
  const pinCheck = await checkSpendPin(req, user.id, priceIncVat)
  if (pinCheck) return pinCheck

  // Deduct credit
  db.prepare('UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?').run(priceIncVat, user.id)
  const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any)?.balance || 0

  db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'gpu_compute', ?, ?, ?)`).run(
    user.id, -priceIncVat, `GPU Compute - ${tier} (${billing_period})${managed_level !== 'none' ? ` + ${managed_level} managed` : ''}`, serviceKey, newBalance
  )

  // Create compute order
  const result = db.prepare(`
    INSERT INTO gsws_compute_orders (user_id, provider, resource_type, service_key, tier, billing_period, managed_level, price_ex_vat, price_inc_vat, managed_addon_price, status, notes, starts_at, expires_at)
    VALUES (?, 'vastai', 'gpu', ?, ?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
  `).run(user.id, serviceKey, tier, billing_period, managed_level || 'none', priceExVat, priceIncVat, managedAddon, `template:${template || 'pytorch'}${custom_image ? ':'+custom_image : ''}`, expiresAt.toISOString())

  const orderId = result.lastInsertRowid

  // Notification
  db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'GPU Compute Order Confirmed', ?)`).run(
    user.id, `Your ${tier} GPU order (${billing_period}) has been confirmed. Order #${orderId}. Our team will provision your instance shortly.`
  )

  // Attempt to provision on Vast.ai
  if (offer_id) {
    try {
      const imageId = TEMPLATE_IMAGES[template || 'pytorch'] || TEMPLATE_IMAGES.pytorch
      const vastResult = await createInstance(Number(offer_id), { imageId, diskGb: 20 })
      const vastInstanceId = vastResult?.new_contract || vastResult?.id
      if (vastInstanceId) {
        db.prepare("UPDATE gsws_compute_orders SET provider_instance_id = ?, status = 'active', updated_at = datetime('now') WHERE id = ?")
          .run(String(vastInstanceId), orderId)

        // Add SSH key to instance and store connection details
        try {
          const pubKey = process.env.SWS_SSH_PUBLIC_KEY ? require('fs').readFileSync(process.env.SWS_SSH_PUBLIC_KEY_PATH || '/home/ovie/.ssh/sws_terminal.pub', 'utf8').trim() : ''
          if (pubKey) {
            const axios = require('axios')
            await axios.post(`https://console.vast.ai/api/v0/instances/${vastInstanceId}/ssh/`, 
              { ssh_key: pubKey },
              { headers: { Authorization: `Bearer ${process.env.VASTAI_API_KEY}`, 'Content-Type': 'application/json' } }
            )
          }
          // Poll for SSH details (with delay for boot)
          setTimeout(async () => {
            try {
              const inst = await getInstance(String(vastInstanceId))
              if (inst?.ssh_host && inst?.ssh_port) {
                db.prepare("UPDATE gsws_compute_orders SET ssh_host = ?, ssh_port = ?, ssh_user = 'root', updated_at = datetime('now') WHERE id = ?")
                  .run(inst.ssh_host, inst.ssh_port, orderId)
              }
            } catch {}
          }, 30000)
        } catch (keyErr: any) {
          console.error('SSH key add error:', keyErr.message)
        }
      }
    } catch (provErr: any) {
      console.error('Vast.ai provision error:', provErr.message)
      // Order stays pending — support will provision manually
    }
  }

  // Audit
  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'gpu_order', 'compute', ?, ?)`).run(
    user.id, serviceKey, `GPU order #${orderId} - ${tier} ${billing_period} ${managed_level || 'self-managed'} - £${priceIncVat.toFixed(2)}`
  )

  return NextResponse.json({ success: true, orderId, priceIncVat, newBalance, expiresAt: expiresAt.toISOString() })
}
