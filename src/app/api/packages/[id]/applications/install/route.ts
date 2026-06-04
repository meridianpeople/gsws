import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import axios from 'axios'

const installClient = axios.create({
  baseURL: process.env.TWENTYI_BASE_URL || 'https://api.20i.com',
  headers: {
    Authorization: `Bearer ${Buffer.from(process.env.TWENTYI_API_KEY || '').toString('base64')}`,
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 2 minutes for installs
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  try {
    const body = await req.json()
    const res = await installClient.post(`/package/${id}/web/oneclick`, body)

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'app_install', 'package', ?, ?, ?)
    `).run(user.id, id, `Installed ${body.oneclick} on ${body.domain}`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({ success: true, result: res.data?.result || res.data })
  } catch (err: any) {
    // If timeout but install may have started, return partial success
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      return NextResponse.json({
        success: true,
        result: null,
        message: 'Installation queued — may take a few minutes to complete'
      })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export const maxDuration = 120
