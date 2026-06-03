import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

// Popular TLDs to search by default - kept small for speed (single batch call)
const DEFAULT_TLDS = [
  '.co.uk', '.com', '.uk', '.net', '.org', '.me.uk', '.org.uk',
  '.co', '.io', '.app', '.dev', '.online',
]

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const q = req.nextUrl.searchParams.get('q')?.trim().toLowerCase()
  if (!q) return NextResponse.json({ error: 'Query required' }, { status: 400 })

  const all = req.nextUrl.searchParams.get('all') === '1'
  const base = q.includes('.') ? q.split('.')[0] : q

  // Get TLDs to search
  let tlds: string[]
  if (all) {
    const rows = db.prepare(`
      SELECT service_key FROM gsws_service_catalogue 
      WHERE service_type = 'domain' AND active = 1
      ORDER BY sell_price ASC
    `).all() as any[]
    tlds = rows.map(r => r.service_key)
  } else {
    tlds = DEFAULT_TLDS
  }

  // Get prices from catalogue
  const priceMap = new Map<string, number>()
  const rows = db.prepare(`
    SELECT service_key, sell_price FROM gsws_service_catalogue 
    WHERE service_type = 'domain' AND active = 1
  `).all() as any[]
  rows.forEach((r: any) => priceMap.set(r.service_key, r.sell_price))

  // Search in batches of 10 (comma-separated) to reduce API calls
  const batchSize = 10
  const batches: string[][] = []
  for (let i = 0; i < tlds.length; i += batchSize) {
    batches.push(tlds.slice(i, i + batchSize))
  }

  const results: any[] = []

  await Promise.all(batches.map(async (batch) => {
    const domains = batch.map(tld => `${base}${tld}`).join(',')
    try {
      const res = await client.get(`/domain-search/${encodeURIComponent(domains)}`)
      const data = Array.isArray(res.data) ? res.data : []
      for (const item of data) {
        if (!item.name || item.header) continue
        const tld = '.' + item.name.split('.').slice(1).join('.')
        results.push({
          name: item.name,
          tld,
          available: item.can === 'register',
          price: item.can === 'register' ? (priceMap.get(tld) || null) : null,
          premium: item.premium === true,
        })
      }
    } catch {}
  }))

  // Sort: available first, then by price
  results.sort((a, b) => {
    if (a.available && !b.available) return -1
    if (!a.available && b.available) return 1
    if (a.available && b.available) return (a.price || 0) - (b.price || 0)
    // Keep default TLD order for unavailable
    const ai = DEFAULT_TLDS.indexOf(a.tld)
    const bi = DEFAULT_TLDS.indexOf(b.tld)
    if (ai !== -1 && bi === -1) return -1
    if (ai === -1 && bi !== -1) return 1
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return NextResponse.json({ results, base, total: results.length })
}
