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
    const res = await client.get(`/package/${id}/web/forceSSL`)
    return NextResponse.json({ enabled: res.data === true || res.data?.enabled === true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { enabled } = await req.json()
    await client.post(`/package/${id}/web/forceSSL`, { value: enabled })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err?.response?.status === 409) return NextResponse.json({ success: true })
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
