import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if (!db.prepare('SELECT id FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id))
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  try {
    const permsRes = await client.get(`/package/${id}/web/filePermissions`)
    const perms = permsRes.data
    if (!perms?.permissionCheckId) return NextResponse.json({ success: true, message: 'No issues found' })

    const failures = Array.isArray(perms.failures) ? perms.failures : []
    if (failures.length === 0 && !perms.root && !perms.publicHtml) {
      return NextResponse.json({ success: true, message: 'No issues found' })
    }

    // Build files array with recommended permissions as integers
    const files = failures.map((f: any) => ({
      file: f.file,
      perms: parseInt(f.perms?.r || '644', 10),
    }))

    await client.post(`/package/${id}/web/filePermissions`, {
      permissionCheckId: perms.permissionCheckId,
      files,
    })

    return NextResponse.json({ success: true, fixed: files.length })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
