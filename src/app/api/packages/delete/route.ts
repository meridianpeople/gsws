import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { deletePackage } from '@/lib/api/packages'
import db from '@/lib/db'

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { packageId } = await req.json()
  if (!packageId) return NextResponse.json({ error: 'packageId required' }, { status: 400 })

  // Verify ownership
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(packageId, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Package not found' }, { status: 404 })

  // Check for managed lock
  const { checkManagedLock } = await import('@/lib/managed')
  const mLock = checkManagedLock(user.id, 'hosting', packageId)
  if (mLock) return NextResponse.json({ error: mLock.error }, { status: mLock.status })

  try {
    await deletePackage(packageId)
    db.prepare(`UPDATE gsws_user_packages SET status = 'deleted', updated_at = datetime('now') WHERE twentyi_package_id = ?`).run(packageId)
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'package_delete', 'package', ?, ?)`).run(
      user.id, packageId, `Package ${pkg.domain_name} deleted`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
