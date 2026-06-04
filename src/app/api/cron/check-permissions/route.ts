import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import client from '@/lib/api/client'

// Daily cron — checks file permissions and notifies user if issues found
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.GSWS_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const packages = db.prepare(`
    SELECT twentyi_package_id as pkg_id, user_id, domain_name
    FROM gsws_user_packages WHERE status = 'active'
  `).all() as any[]

  let checked = 0, issues = 0, errors = 0

  for (const pkg of packages) {
    try {
      const res = await client.get(`/package/${pkg.pkg_id}/web/filePermissions`) as any
      const perms = res?.data
      if (!perms?.permissionCheckId) { checked++; continue }

      const failures = Array.isArray(perms.failures) ? perms.failures : []
      const hasIssues = failures.length > 0 || perms.root || perms.publicHtml

      if (hasIssues) {
        // Check if we already notified recently (avoid spam)
        const recentAlert = db.prepare(`
          SELECT id FROM gsws_notifications
          WHERE user_id = ? AND title = 'File permission issues detected'
          AND created_at > datetime('now', '-3 days')
        `).get(pkg.user_id)

        if (!recentAlert) {
          db.prepare(`
            INSERT INTO gsws_notifications (user_id, type, title, message)
            VALUES (?, 'system', 'File permission issues detected', ?)
          `).run(pkg.user_id,
            `${pkg.domain_name} has ${failures.length} file permission issue(s). Visit Packages → Files → Fix Permissions to resolve.`)
          issues++
        }
      }

      checked++
    } catch (e: any) {
      console.error(`[check-permissions] pkg ${pkg.pkg_id}:`, e.message)
      errors++
    }
  }

  return NextResponse.json({ success: true, checked, issues, errors, timestamp: new Date().toISOString() })
}
