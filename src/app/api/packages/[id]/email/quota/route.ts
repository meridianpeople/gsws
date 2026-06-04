import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import client from '@/lib/api/client'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id)
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const res = await client.get(`/package/${id}/email/quota`)
    return NextResponse.json(res.data || {})
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id)
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const body = await req.json()
  try {
    const res = await client.post(`/package/${id}/email/quota`, body)
    return NextResponse.json(res.data || {})
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
