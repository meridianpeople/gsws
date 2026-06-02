import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function checkOwnership(req: NextRequest, domain: string) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return null
  const owned = db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?').get(user.id, domain)
  return owned ? user : null
}

function normaliseRecord(r: any): any {
  // 20i uses different value fields per record type
  const value =
    r.target ||   // NS, CNAME, MX, SRV
    r.ip ||       // A
    r.ipv6 ||     // AAAA
    r.txt ||      // TXT
    r.address ||  // fallback
    r.data ||     // fallback
    r.mname ||    // SOA
    ''

  return {
    id: r.ref || null,
    type: r.type,
    host: r.host || '@',
    data: value,
    ttl: r.ttl || r['minimum-ttl'] || 3600,
    priority: r.priority || r.preference || null,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await checkOwnership(req, domain)
  if (!user) return NextResponse.json({ error: 'Not authenticated or access denied' }, { status: 401 })
  try {
    const res = await client.get(`/domain/${encodeURIComponent(domain)}/dns`)
    const raw = res.data?.records || res.data || []
    const records = Array.isArray(raw) ? raw.map(normaliseRecord) : []
    return NextResponse.json({ records })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await checkOwnership(req, domain)
  if (!user) return NextResponse.json({ error: 'Not authenticated or access denied' }, { status: 401 })
  try {
    const body = await req.json()
    const { type, host, data, ttl, priority } = body
    if (!type || !host || !data) return NextResponse.json({ error: 'Type, host and value are required' }, { status: 400 })

    // 20i expects different field names per type
    const payload: any = { type, host, ttl: ttl || 3600 }
    if (type === 'A') payload.ip = data
    else if (type === 'AAAA') payload.ipv6 = data
    else if (type === 'TXT') payload.txt = data
    else payload.target = data
    if (priority) payload.priority = priority

    const res = await client.post(`/domain/${encodeURIComponent(domain)}/dns`, payload)

    // Log to audit
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'dns_add', 'domain', ?, ?)
    `).run(user!.id, domain, `Added ${type} record: ${host} → ${data}`)

    return NextResponse.json({ success: true, result: res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await checkOwnership(req, domain)
  if (!user) return NextResponse.json({ error: 'Not authenticated or access denied' }, { status: 401 })
  try {
    const { id, type, host } = await req.json()
    if (!id) return NextResponse.json({ error: 'Record ID required' }, { status: 400 })
    const res = await client.delete(`/domain/${encodeURIComponent(domain)}/dns/${id}`)

    // Log to audit
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'dns_delete', 'domain', ?, ?)
    `).run(user!.id, domain, `Deleted ${type || ''} record: ${host || id}`)

    return NextResponse.json({ success: true, result: res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
