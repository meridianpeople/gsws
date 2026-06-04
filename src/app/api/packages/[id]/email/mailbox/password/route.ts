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
    const { domain, local, mailboxId, password } = await req.json()
    if (!domain || (!local && !mailboxId) || !password) return NextResponse.json({ error: 'Domain, local and password required' }, { status: 400 })
    // Get mailbox ID from local name if not provided
    let mbId = mailboxId
    if (!mbId && local) {
      const res = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox`)
      const mb = (res.data?.mailbox || []).find((m: any) => m.local === local)
      if (!mb) return NextResponse.json({ error: 'Mailbox not found' }, { status: 404 })
      mbId = mb.id
    }
    await client.post(`/package/${id}/email/${encodeURIComponent(domain)}`, {
      mailbox: [{ id: mbId, password }]
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
