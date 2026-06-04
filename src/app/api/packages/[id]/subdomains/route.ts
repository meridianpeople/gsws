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
    const res = await client.get(`/package/${id}/web/subdomains`)
    return NextResponse.json({ subdomains: res.data || {} })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { name, domain } = await req.json()
    if (!name || !domain) return NextResponse.json({ error: 'Name and domain required' }, { status: 400 })
    const fullName = `${name}.${domain}`
    await client.post(`/package/${id}/web/subdomains`, {
      add: { [fullName]: `/${name}` },
      rem: []
    })
    return NextResponse.json({ success: true, subdomain: fullName })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { subdomain } = await req.json()
    if (!subdomain) return NextResponse.json({ error: 'Subdomain required' }, { status: 400 })
    await client.post(`/package/${id}/web/subdomains`, { add: {}, rem: [subdomain] })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
