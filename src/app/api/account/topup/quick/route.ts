import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import Stripe from 'stripe'
import db from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-05-27.dahlia' })
const VALID_AMOUNTS = [25, 50, 75, 100, 500, 1000]

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { amount } = await req.json()
  if (!VALID_AMOUNTS.includes(Number(amount))) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ?').get(user.id) as any
  if (!gswsUser?.stripe_customer_id) {
    return NextResponse.json({ error: 'No saved payment method. Please top up via Stripe first.' }, { status: 400 })
  }

  // Get saved payment methods
  const paymentMethods = await stripe.paymentMethods.list({
    customer: gswsUser.stripe_customer_id,
    type: 'card',
  })

  if (!paymentMethods.data.length) {
    return NextResponse.json({ error: 'No saved card found. Please top up via Stripe first.' }, { status: 400 })
  }

  const pm = paymentMethods.data[0]

  // Charge saved card
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: 'gbp',
    customer: gswsUser.stripe_customer_id,
    payment_method: pm.id,
    confirm: true,
    off_session: true,
    metadata: {
      gsws_user_id: String(user.id),
      gsws_user_email: user.email,
      gsws_amount: String(amount),
    },
    description: `GeiG SWS Credit Top-up — £${amount}`,
  })

  if (paymentIntent.status === 'succeeded') {
    // Credit account
    db.prepare(`INSERT INTO gsws_user_credits (user_id, balance) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
    `).run(user.id, amount, amount)

    const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any)?.balance || amount

    db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'topup', 'Quick top-up (saved card)', ?, ?)
    `).run(user.id, amount, `STRIPE-${paymentIntent.id}`, newBalance)

    db.prepare(`INSERT INTO gsws_topup_history (user_id, amount, currency, reference, status) VALUES (?, ?, 'GBP', ?, 'completed')`)
      .run(user.id, amount, `STRIPE-${paymentIntent.id}`)

    db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Credit added', ?)`)
      .run(user.id, `£${amount}.00 added via saved card (${pm.card?.brand} ****${pm.card?.last4}). Balance: £${newBalance.toFixed(2)}`)

    return NextResponse.json({
      success: true,
      amount,
      newBalance,
      card: `${pm.card?.brand} ****${pm.card?.last4}`,
    })
  }

  return NextResponse.json({ error: 'Payment failed' }, { status: 400 })
}
