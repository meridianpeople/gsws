import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function check(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  return db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, forward } = await req.json()
    const cur = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder`)
    const existing = cur.data?.wildcard || []
    await client.post(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder`, {
      wildcard: [...existing, { forward }]
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, wildcardId } = await req.json()
    const cur = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder`)
    const remaining = (cur.data?.wildcard || []).filter((w: any) => w.id !== wildcardId)
    await client.post(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder`, {
      wildcard: remaining
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
