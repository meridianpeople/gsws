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
    const [timelineRes, webRes, jobsRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/timelineBackup`),
      client.get(`/package/${id}/web/timelineBackup/web`),
      client.get(`/package/${id}/web/timelineBackup/web/jobs`),
    ])
    return NextResponse.json({
      timeline: timelineRes.status === 'fulfilled' ? timelineRes.value.data : null,
      web: webRes.status === 'fulfilled' ? webRes.value.data : null,
      jobs: jobsRes.status === 'fulfilled' ? (Array.isArray(jobsRes.value.data) ? jobsRes.value.data : []) : [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!await check(req, id)) return NextResponse.json({ error: 'Access denied' }, { status: 401 })
  try {
    const { type, databaseId } = await req.json().catch(() => ({}))
    if (type === 'database' && databaseId) {
      const res = await client.post(`/package/${id}/web/timelineBackup/database/${databaseId}/takeSnapshot`, {})
      return NextResponse.json({ success: true, result: res.data })
    }
    const res = await client.post(`/package/${id}/web/timelineBackup/web/takeSnapshot`, {})
    return NextResponse.json({ success: true, result: res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
