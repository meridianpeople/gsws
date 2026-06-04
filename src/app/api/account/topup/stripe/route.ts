import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-05-27.dahlia',
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sws.geig.co.uk'

const VALID_AMOUNTS = [25, 50, 75, 100, 500, 1000]

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { amount } = await req.json()

    if (!VALID_AMOUNTS.includes(Number(amount))) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `GeiG SWS Account Credit — £${amount}`,
            description: 'Credit added to your GeiG Simple Web Service account',
          },
          unit_amount: amount * 100, // pence
        },
        quantity: 1,
      }],
      mode: 'payment',
      customer_email: user.email,
      metadata: {
        gsws_user_id: String(user.id),
        gsws_user_email: user.email,
        gsws_amount: String(amount),
      },
      success_url: `${APP_URL}/account/topup?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_URL}/account/topup?cancelled=1`,
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    console.error('Stripe error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
