import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function checkOwnership(req: NextRequest, domain: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  const owned = db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?').get(user.id, domain)
  return owned ? user : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await checkOwnership(req, domain)
  if (!user) return NextResponse.json({ error: 'Not authenticated or access denied' }, { status: 401 })
  try {
    const res = await client.get(`/domain/${encodeURIComponent(domain)}/nameservers`)
    return NextResponse.json({ nameservers: res.data?.nameservers || res.data || [] })
  } catch (err: any) {
    return NextResponse.json({ nameservers: [], error: err.message })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await checkOwnership(req, domain)
  if (!user) return NextResponse.json({ error: 'Not authenticated or access denied' }, { status: 401 })
  try {
    const { nameservers } = await req.json()
    if (!nameservers || nameservers.length < 2) return NextResponse.json({ error: 'At least 2 nameservers required' }, { status: 400 })
    const res = await client.post(`/domain/${encodeURIComponent(domain)}/nameservers`, { nameservers })
    return NextResponse.json({ success: true, result: res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
