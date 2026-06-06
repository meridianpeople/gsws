import { NextRequest, NextResponse } from 'next/server'
import { checkSpendPin } from '@/lib/spendPin'
import fs from 'fs'
import { getGswsSession } from '@/lib/session'
import { createInstance, listInstances } from '@/lib/contabo'
import db from '@/lib/db'

const IMAGES: Record<string, string> = {
  'ubuntu-24.04':    'd64d5c6c-9dda-4e38-8174-0ee282474d8a',
  'ubuntu-22.04':    'afecbb85-e2fc-46f0-9684-b46b1faf00bb',
  'debian-12':       '4efbc0ba-2313-4fe1-842a-516f8652e729',
  'windows-2025':    '5af826e8-0e9d-4cec-9728-0966f98b4565',
  'windows-2022':    'b5549695-970e-491a-827d-b314170154db',
  'ubuntu-24-plesk': 'ab0751ce-49ff-4fd0-b919-2479b7c71fdb',
  'ubuntu-24-cpanel':'c0200107-cc26-4776-9775-1942841a473c',
}

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Get user's VPS orders
  const orders = db.prepare(`
    SELECT * FROM gsws_compute_orders
    WHERE user_id = ? AND resource_type = 'vps'
    ORDER BY created_at DESC
  `).all(user.id) as any[]

  return NextResponse.json({ orders })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { service_key, image_key, region, period, display_name, default_user, add_backup, add_private_networking } = await req.json()
  if (!service_key) return NextResponse.json({ error: 'Missing service_key' }, { status: 400 })

  // Get pricing
  const catalogue = db.prepare('SELECT * FROM gsws_service_catalogue WHERE service_key = ?').get(service_key) as any
  if (!catalogue) return NextResponse.json({ error: 'Invalid VPS plan' }, { status: 400 })

  const config = JSON.parse(catalogue.config || '{}')
  const months = period || 1
  const priceExVat = catalogue.sell_price * months
  const priceIncVat = priceExVat * 1.2

  // Check credit
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
  if (!credits || credits.balance < priceIncVat) {
    return NextResponse.json({
      error: `Insufficient credit. Required: £${priceIncVat.toFixed(2)}, Available: £${(credits?.balance || 0).toFixed(2)}`
    }, { status: 400 })
  }

  // Provision on Contabo
  let contaboInstance: any = null
  let provisionError: string | null = null

  try {
    const addOns: Record<string, any> = {}
    if (add_private_networking) addOns.privateNetworking = {}
    if (add_backup) addOns.backup = {}

    // Load SWS public key for terminal access
    let sshPubKey: string | undefined
    try {
      const keyPath = process.env.SWS_SSH_PUBLIC_KEY_PATH
      if (keyPath && fs.existsSync(keyPath)) sshPubKey = fs.readFileSync(keyPath, 'utf8').trim()
    } catch {}

    const result = await createInstance({
      productId: config.productId || 'V92',
      region: region || config.region || 'EU',
      imageId: IMAGES[image_key || 'ubuntu-24.04'] || IMAGES['ubuntu-24.04'],
      displayName: display_name || `gsws-${service_key}-${user.id}`,
      period: months,
      defaultUser: default_user || 'admin',
      // sshKeys: [] — requires Contabo secret ID, added after key registration
      ...(Object.keys(addOns).length > 0 && { addOns }),
    })
    contaboInstance = result.data?.[0] || result
  } catch (err: any) {
    provisionError = err.message
    console.error('[VPS provision error]', err.message)
  }

  // Deduct credit regardless (order still created, support can fix if provision failed)
  db.prepare('UPDATE gsws_user_credits SET balance = balance - ? WHERE user_id = ?').run(priceIncVat, user.id)
  const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any)?.balance || 0

  db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'vps', ?, ?, ?)`).run(
    user.id, -priceIncVat, `VPS ${catalogue.name} (${months}mo)`, service_key, newBalance
  )

  // Create order
  const now = new Date()
  const expiresAt = new Date(now.setMonth(now.getMonth() + months))

  const orderResult = db.prepare(`
    INSERT INTO gsws_compute_orders (
      user_id, provider, resource_type, service_key, tier, billing_period,
      managed_level, price_ex_vat, price_inc_vat, managed_addon_price,
      status, provider_instance_id, provider_data, notes, starts_at, expires_at
    ) VALUES (?, 'contabo', 'vps', ?, ?, 'monthly', 'none', ?, ?, 0, ?, ?, ?, ?, datetime('now'), ?)
  `).run(
    user.id, service_key, service_key,
    priceExVat, priceIncVat,
    provisionError ? 'pending' : 'active',
    contaboInstance?.instanceId || null,
    contaboInstance ? JSON.stringify(contaboInstance) : null,
    provisionError ? `Provision error: ${provisionError}` : `image:${image_key || 'ubuntu-24.04'} region:${region || 'EU'}`,
    expiresAt.toISOString()
  )

  const orderId = orderResult.lastInsertRowid

  // Notification
  db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', ?, ?)`).run(
    user.id,
    provisionError ? 'VPS Order Received' : 'VPS Provisioned',
    provisionError
      ? `Your VPS order #${orderId} has been received. Our team will provision it shortly.`
      : `Your VPS ${catalogue.name} has been provisioned! Instance ID: ${contaboInstance?.instanceId}`
  )

  // Audit
  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'vps_order', 'compute', ?, ?)`).run(
    user.id, service_key,
    `VPS order #${orderId} - ${catalogue.name} ${months}mo - £${priceIncVat.toFixed(2)}${provisionError ? ' [provision failed]' : ''}`
  )

  return NextResponse.json({
    success: true,
    orderId,
    priceIncVat,
    newBalance,
    instanceId: contaboInstance?.instanceId || null,
    status: provisionError ? 'pending' : 'active',
    message: provisionError
      ? 'Order placed. Our team will provision your VPS within 2 hours.'
      : `VPS provisioned successfully! Instance ID: ${contaboInstance?.instanceId}`,
  })
}
