import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.GSWS_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let updated = 0, deleted = 0, errors = 0

  try {
    const res = await client.get('/package') as any
    const twentyiPkgs = (res?.data || res || []) as any[]
    const twentyiMap = new Map(twentyiPkgs.map((p: any) => [String(p.id), p]))

    const gswsPkgs = db.prepare('SELECT * FROM gsws_user_packages').all() as any[]

    for (const pkg of gswsPkgs) {
      try {
        const live = twentyiMap.get(pkg.twentyi_package_id)
        if (!live) {
          db.prepare(`UPDATE gsws_user_packages SET status = 'deleted' WHERE twentyi_package_id = ?`)
            .run(pkg.twentyi_package_id)
          deleted++
          continue
        }
        const liveStatus = live.enabled ? 'active' : 'suspended'
        const liveName = live.name || live.names?.[0] || pkg.domain_name
        const liveLabel = live.packageTypeName || pkg.package_label

        if (pkg.status !== liveStatus || pkg.domain_name !== liveName || pkg.package_label !== liveLabel) {
          db.prepare(`
            UPDATE gsws_user_packages SET status = ?, domain_name = ?, package_label = ?, updated_at = datetime('now')
            WHERE twentyi_package_id = ?
          `).run(liveStatus, liveName, liveLabel, pkg.twentyi_package_id)
          updated++
        }
      } catch (e: any) {
        console.error('[sync-packages cron]', e.message)
        errors++
      }
    }
  } catch (e: any) {
    console.error('[sync-packages cron] fatal:', e.message)
    errors++
  }

  return NextResponse.json({ success: true, updated, deleted, errors, timestamp: new Date().toISOString() })
}
