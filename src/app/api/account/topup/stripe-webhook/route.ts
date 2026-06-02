import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import db from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') || ''
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const amount = Number(session.metadata?.gsws_amount)
    const email = session.metadata?.gsws_user_email
    const userId = Number(session.metadata?.gsws_user_id)
    const sessionId = session.id

    if (!amount || !email || !userId) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    // Idempotency check
    const existing = db.prepare(
      'SELECT id FROM gsws_topup_history WHERE reference = ?'
    ).get(`STRIPE-${sessionId}`) as any

    if (existing) return NextResponse.json({ received: true })

    // Credit account
    db.prepare(`
      UPDATE gsws_users SET credit_balance = credit_balance + ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(amount, userId)

    // Record topup
    db.prepare(`
      INSERT INTO gsws_topup_history (user_id, amount, currency, reference, status)
      VALUES (?, ?, 'GBP', ?, 'completed')
    `).run(userId, amount, `STRIPE-${sessionId}`)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'credit_topup', 'account', 'topup', ?, 'stripe-webhook')
    `).run(userId, `£${amount} credit added via Stripe payment ${sessionId}`)

    console.log(`Credited £${amount} to user ${userId} (${email})`)
  }

  return NextResponse.json({ received: true })
}
