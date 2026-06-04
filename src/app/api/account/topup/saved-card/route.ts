import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import Stripe from 'stripe'
import db from '@/lib/db'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', { apiVersion: '2026-05-27.dahlia' })

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const gswsUser = db.prepare('SELECT stripe_customer_id FROM gsws_users WHERE id = ?').get(user.id) as any
  if (!gswsUser?.stripe_customer_id) return NextResponse.json({ card: null })

  try {
    const pms = await stripe.paymentMethods.list({ customer: gswsUser.stripe_customer_id, type: 'card' })
    if (!pms.data.length) return NextResponse.json({ card: null })
    const pm = pms.data[0]
    return NextResponse.json({
      card: {
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year,
      }
    })
  } catch {
    return NextResponse.json({ card: null })
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { paymentMethodId } = await req.json()
  if (!paymentMethodId) return NextResponse.json({ error: 'paymentMethodId required' }, { status: 400 })

  try {
    const stripe = new (await import('stripe')).default(process.env.STRIPE_SECRET_KEY!)
    await stripe.paymentMethods.detach(paymentMethodId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
