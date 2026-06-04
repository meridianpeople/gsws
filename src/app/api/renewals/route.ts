import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const renewals = db.prepare(`
    SELECT * FROM gsws_renewals
    WHERE user_id = ?
    ORDER BY expires_at ASC
  `).all(user.id) as any[]

  const now = new Date()
  const enriched = renewals.map(r => {
    const expires = new Date(r.expires_at)
    const daysLeft = Math.ceil((expires.getTime() - now.getTime()) / 86400000)
    let urgency: 'ok' | 'warning' | 'critical' | 'overdue' = 'ok'
    if (daysLeft < 0) urgency = 'overdue'
    else if (daysLeft <= 7) urgency = 'critical'
    else if (daysLeft <= 30) urgency = 'warning'
    return { ...r, daysLeft, urgency }
  })

  const stats = {
    total: renewals.length,
    dueThisMonth: enriched.filter(r => r.daysLeft >= 0 && r.daysLeft <= 30).length,
    overdue: enriched.filter(r => r.daysLeft < 0).length,
    monthlyTotal: renewals.reduce((sum, r) => sum + (r.renewal_price_inc_vat || 0), 0),
  }

  return NextResponse.json({ renewals: enriched, stats })
}

export async function PATCH(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, auto_renew } = await req.json()
  db.prepare('UPDATE gsws_renewals SET auto_renew = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?')
    .run(auto_renew ? 1 : 0, id, user.id)
  return NextResponse.json({ success: true })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { domain, years } = await req.json()
  if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })

  // Verify ownership
  const domainRecord = db.prepare(`
    SELECT d.*, p.twentyi_package_id FROM gsws_user_domains d
    JOIN gsws_user_packages p ON p.id = d.package_id
    WHERE d.domain_name = ? AND p.user_id = ?
  `).get(domain, user.id) as any
  if (!domainRecord) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

  try {
    const { renewDomain } = await import('@/lib/api/domains')
    const result = await renewDomain({ name: domain, years: years || 1 })
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'domain_renew', 'domain', ?, ?)`).run(
      user.id, domain, `Domain renewed for ${years || 1} year(s)`)
    return NextResponse.json({ success: true, result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
