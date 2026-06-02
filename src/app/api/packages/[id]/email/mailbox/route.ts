import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function checkOwnership(req: NextRequest, id: string) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return null
  return db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  const domain = req.nextUrl.searchParams.get('domain') || ''
  try {
    const res = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox`)
    return NextResponse.json({ mailboxes: res.data?.mailbox || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, local, password, quotaMB } = await req.json()
    if (!domain || !local || !password) return NextResponse.json({ error: 'Domain, username and password required' }, { status: 400 })
    await client.post(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox`, {
      local, password, quotaMB: quotaMB || 1000, receive: true, send: true, enabled: true,
    })
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
    const { domain, local } = await req.json()
    await client.delete(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox/${encodeURIComponent(local)}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
