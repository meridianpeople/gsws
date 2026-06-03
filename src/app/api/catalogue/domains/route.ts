import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token || !validateSession(token)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const tld = req.nextUrl.searchParams.get('tld')
  const type = req.nextUrl.searchParams.get('type') || 'domain'
  if (tld) {
    const item = db.prepare('SELECT * FROM gsws_service_catalogue WHERE service_key = ? AND service_type = ? AND active = 1').get(tld, type) as any
    return NextResponse.json(item || null)
  }

  const items = db.prepare('SELECT service_key, name, cost_price, sell_price FROM gsws_service_catalogue WHERE service_type = "domain" AND active = 1 ORDER BY sell_price ASC').all()
  return NextResponse.json({ items })
}
