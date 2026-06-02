import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import client from '@/lib/api/client'

const TLDS = ['.co.uk', '.com', '.uk', '.net', '.org', '.io', '.co', '.store', '.online']

function parseAvailability(data: any[]): { available: boolean; price: string | null; premium: boolean } {
  // 20i returns an array — first item is header, second is result
  const result = data.find((d: any) => d.name)
  if (!result) return { available: false, price: null, premium: false }

  // "can" field: "register" = available, anything else = taken/transfer
  const available = result.can === 'register'
  const premium = result.premium === true
  const price = result.price ? `£${Number(result.price).toFixed(2)}` : null

  return { available, price, premium }
}

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  // Strip any existing TLD to get the base name
  const base = q.includes('.') ? q.split('.')[0] : q

  try {
    const searches = TLDS.map(async (tld) => {
      const domain = `${base}${tld}`
      try {
        const res = await client.get(`/domain-search/${encodeURIComponent(domain)}`)
        const { available, price, premium } = parseAvailability(res.data)
        return { name: domain, available, price, premium }
      } catch {
        return { name: domain, available: false, price: null, premium: false }
      }
    })

    const results = await Promise.all(searches)

    // Sort: available first, then by TLD priority
    results.sort((a, b) => {
      if (a.available && !b.available) return -1
      if (!a.available && b.available) return 1
      const priority = ['.co.uk', '.com', '.uk', '.net', '.org']
      const aP = priority.findIndex(t => a.name.endsWith(t))
      const bP = priority.findIndex(t => b.name.endsWith(t))
      if (aP !== -1 && bP === -1) return -1
      if (aP === -1 && bP !== -1) return 1
      if (aP !== -1 && bP !== -1) return aP - bP
      return 0
    })

    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
