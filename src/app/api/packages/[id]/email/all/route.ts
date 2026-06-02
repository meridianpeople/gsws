import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  if (!db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  const domain = req.nextUrl.searchParams.get('domain') || ''
  const enc = encodeURIComponent(domain)

  const [mbRes, fwdRes, respRes, dkimRes, dmarcRes, spamRes] = await Promise.allSettled([
    client.get(`/package/${id}/email/${enc}/mailbox`),
    client.get(`/package/${id}/email/${enc}/forwarder`),
    client.get(`/package/${id}/email/${enc}/responder`),
    client.get(`/package/${id}/email/${enc}/signature`),
    client.get(`/package/${id}/email/${enc}/dmarc`),
    client.get(`/package/${id}/email/${enc}/spamPolicyListBlacklist`),
  ])

  const fwdData = fwdRes.status === 'fulfilled' ? fwdRes.value.data : {}

  return NextResponse.json({
    mailboxes: mbRes.status === 'fulfilled' ? (mbRes.value.data?.mailbox || []) : [],
    forwards: fwdData?.forward || [],
    wildcards: fwdData?.wildcard || [],
    catchalls: fwdData?.catchall || [],
    autoresponders: respRes.status === 'fulfilled' ? (respRes.value.data?.responder || []) : [],
    dkim: dkimRes.status === 'fulfilled' ? (Array.isArray(dkimRes.value.data) ? dkimRes.value.data : []) : [],
    dmarc: dmarcRes.status === 'fulfilled' ? (Array.isArray(dmarcRes.value.data) ? dmarcRes.value.data : []) : [],
    spamBlacklist: spamRes.status === 'fulfilled' ? (spamRes.value.data?.spamblacklist || []) : [],
  })
}
