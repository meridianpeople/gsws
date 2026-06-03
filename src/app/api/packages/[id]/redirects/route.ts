import { NextRequest, NextResponse } from 'next/server'
import { validateSession, requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function check(req: NextRequest, id: string) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return null
  return db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const res = await client.get(`/package/${id}/web/redirects`)
    // Flatten the nested {domain: {type: {from: to}}} into array
    const raw = res.data || {}
    const redirects: any[] = []
    for (const [domain, types] of Object.entries(raw as any)) {
      for (const [type, rules] of Object.entries(types as any)) {
        for (const [from, to] of Object.entries(rules as any)) {
          redirects.push({ domain, type, from, to })
        }
      }
    }
    return NextResponse.json({ redirects })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, from, to, type } = await req.json()
    if (!domain || !from || !to) return NextResponse.json({ error: 'Domain, from and to required' }, { status: 400 })
    // Get existing redirects first to merge
    const existing = await client.get(`/package/${id}/web/redirects`)
    const raw = existing.data || {}
    // Build flat list of existing + new
    const allRedirects: any[] = []
    for (const [d, types] of Object.entries(raw as any)) {
      for (const [t, rules] of Object.entries(types as any)) {
        for (const [f, target] of Object.entries(rules as any)) {
          allRedirects.push({ domain: d, type: t, from: f, to: target })
        }
      }
    }
    allRedirects.push({ domain, from, to, type: type || '301' })
    await client.post(`/package/${id}/web/redirects`, { redirects: allRedirects })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { domain, from, type } = await req.json()
    const existing = await client.get(`/package/${id}/web/redirects`)
    const raw = existing.data || {}
    const allRedirects: any[] = []
    for (const [d, types] of Object.entries(raw as any)) {
      for (const [t, rules] of Object.entries(types as any)) {
        for (const [f, target] of Object.entries(rules as any)) {
          if (d === domain && f === from && t === type) continue
          allRedirects.push({ domain: d, type: t, from: f, to: target })
        }
      }
    }
    await client.post(`/package/${id}/web/redirects`, { redirects: allRedirects })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
