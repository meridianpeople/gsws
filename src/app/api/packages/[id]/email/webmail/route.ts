import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  try {
    const { domain, username } = await req.json()
    const res = await client.post(`/package/${id}/email/${encodeURIComponent(domain)}/webmail`, { username })
    return NextResponse.json({ url: res.data?.result || res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
