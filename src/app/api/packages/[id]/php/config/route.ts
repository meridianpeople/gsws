import { NextRequest, NextResponse } from 'next/server'
import { validateSession, requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })

  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  try {
    const { domain, config } = await req.json()
    if (!config) return NextResponse.json({ error: 'Config required' }, { status: 400 })

    // Get phpConfig ID (domain name used as ID)
    const configRes = await client.get(`/package/${id}/web/phpConfig`)
    const configData = configRes.data || {}
    const configId = Object.keys(configData)[0] || domain

    await client.post(`/package/${id}/web/phpConfig/${encodeURIComponent(configId)}/updateConfig`, { config })

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'php_config_update', 'package', ?, ?, ?)
    `).run(user.id, id, `PHP config updated for ${domain}`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
