import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function check(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  return db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const [certsRes, forceRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/certificates`),
      client.get(`/package/${id}/web/forceSSL`),
    ])
    return NextResponse.json({
      certs: certsRes.status === 'fulfilled' ? (certsRes.value.data || []) : [],
      forceSSL: forceRes.status === 'fulfilled' ? (forceRes.value.data === true) : false,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { name, enabled } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
    await client.post(`/package/${id}/web/freeSSL`, { name, enabled: enabled !== false })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
