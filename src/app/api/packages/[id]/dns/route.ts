import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function checkOwnership(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id)
  return pkg ? user : null
}

function normalise(r: any, domain: string): any {
  return {
    ref: r.ref || null,
    type: r.type,
    host: r.host || '@',
    domain,
    data: r.target || r.ip || r.ipv6 || r.txt || r.mname || '',
    ttl: r.ttl || r['minimum-ttl'] || 3600,
    priority: r.priority || r.preference || null,
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })
  try {
    const res = await client.get(`/package/${id}/dns`)
    const raw = res.data || {}
    const records = Object.entries(raw).flatMap(([domain, data]: [string, any]) =>
      (data?.records || []).map((r: any) => normalise(r, domain))
    )
    return NextResponse.json({ records })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { type, host, data, ttl, priority } = await req.json()
    if (!type || !host || !data) return NextResponse.json({ error: 'Type, host and value required' }, { status: 400 })
    const payload: any = { type, host, ttl: ttl || 3600 }
    if (type === 'A') payload.ip = data
    else if (type === 'AAAA') payload.ipv6 = data
    else if (type === 'TXT') payload.txt = data
    else payload.target = data
    if (priority) payload.priority = Number(priority)
    await client.post(`/package/${id}/dns`, payload)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { id: recordId } = await req.json()
    if (!recordId) return NextResponse.json({ error: 'Record ID required' }, { status: 400 })
    await client.delete(`/package/${id}/dns/${recordId}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
