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

  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id)
  if (!pkg) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  try {
    const { version } = await req.json()
    if (!version) return NextResponse.json({ error: 'Version required' }, { status: 400 })

    await client.post(`/package/${id}/web/phpVersion`, { version })

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'php_version_change', 'package', ?, ?, ?)
    `).run(user.id, id, `PHP version changed to ${version}`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
