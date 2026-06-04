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
  const domain = req.nextUrl.searchParams.get('domain') || ''
  try {
    const res = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder`)
    return NextResponse.json({ forwarders: res.data?.forward || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, local, remote } = await req.json()
    if (!domain || !local || !remote) return NextResponse.json({ error: 'Domain, local and remote required' }, { status: 400 })
    const res = await client.post(`/package/${id}/email/${encodeURIComponent(domain)}`, {
      new: { forward: { local, remote } }
    })
    const created = res.data?.result?.result?.[0]
    if (!created) return NextResponse.json({ error: 'Forwarder not created' }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, local } = await req.json()
    await client.delete(`/package/${id}/email/${encodeURIComponent(domain)}/forwarder/${encodeURIComponent(local)}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
