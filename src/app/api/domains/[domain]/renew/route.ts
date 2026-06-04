import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { renewDomain } from '@/lib/api/domains'
import db from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const pkg = db.prepare(`SELECT d.*, p.twentyi_package_id FROM gsws_user_domains d JOIN gsws_user_packages p ON p.id = d.package_id WHERE d.domain_name = ? AND p.user_id = ?`).get(domain, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { years } = await req.json()
  try {
    const data = await renewDomain({ name: domain, years: years || 1 })
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'domain_renew', 'domain', ?, ?)`).run(
      user.id, domain, `Domain renewed for ${years || 1} year(s)`)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
