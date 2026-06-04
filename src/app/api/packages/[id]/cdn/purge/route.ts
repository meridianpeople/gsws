import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })
  if (!db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  try {
    const { url } = await req.json().catch(() => ({}))
    if (url) {
      await client.post(`/package/${id}/web/purgeCdnByUrl`, { urls: [url] })
    } else {
      await client.post(`/hosting/handleBulkCachePurge`, { packageIds: [Number(id)] })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
