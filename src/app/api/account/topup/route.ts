import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import crypto from 'crypto'

const HMAC_SECRET = 'gsws2026TopupHMAC!GeiG'
const GEIG_URL = 'https://geig.co.uk'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { amount } = await req.json()
  const validAmounts = [25, 50, 75, 100, 500, 1000]
  if (!validAmounts.includes(Number(amount))) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  const sig = crypto.createHmac('sha256', HMAC_SECRET)
    .update(`${amount}|${user.email}`)
    .digest('hex')

  const url = `${GEIG_URL}/?gsws_topup=1&amount=${amount}&email=${encodeURIComponent(user.email)}&sig=${sig}`

  return NextResponse.json({ url })
}
