import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import client from '@/lib/api/client'

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.GSWS_BRIDGE_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const packages = db.prepare(`
    SELECT DISTINCT twentyi_package_id as pkg_id, user_id, domain_name
    FROM gsws_user_packages WHERE status = 'active'
  `).all() as any[]

  let checked = 0, alerted80 = 0, alerted100 = 0, errors = 0

  for (const pkg of packages) {
    try {
      // Get email domains — returns { "domain.com": [...], ... }
      const emailRes = await client.get(`/package/${pkg.pkg_id}/email`) as any
      const emailDomains = emailRes?.data || emailRes
      if (!emailDomains || typeof emailDomains !== 'object') continue

      for (const domain of Object.keys(emailDomains)) {
        // Use encodeURIComponent for domain (same as UI)
        const enc = encodeURIComponent(domain)
        const mailboxRes = await client.get(`/package/${pkg.pkg_id}/email/${enc}/mailbox`) as any
        const mailboxes = mailboxRes?.data?.mailbox || mailboxRes?.mailbox || []
        const mailboxList = Array.isArray(mailboxes) ? mailboxes : Object.values(mailboxes as object)

        for (const mailbox of mailboxList as any[]) {
          const local = mailbox.local
          if (!local) continue

          const usageMB = parseFloat(mailbox.usageMB || 0)
          const quotaMB = parseFloat(mailbox.quotaMB || 10240)
          const usagePct = quotaMB > 0 ? (usageMB / quotaMB) * 100 : 0

          const existing = db.prepare(`
            SELECT * FROM gsws_mailbox_storage
            WHERE package_id = ? AND domain = ? AND mailbox_local = ?
          `).get(pkg.pkg_id, domain, local) as any

          db.prepare(`
            INSERT OR REPLACE INTO gsws_mailbox_storage
            (user_id, package_id, domain, mailbox_local, usage_mb, quota_mb, alerted_80, alerted_100, checked_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(pkg.user_id, pkg.pkg_id, domain, local, usageMB, quotaMB,
            existing?.alerted_80 || 0, existing?.alerted_100 || 0)

          checked++

          if (usagePct >= 80 && usagePct < 100 && !existing?.alerted_80) {
            db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Mailbox storage at 80%', ?)`)
              .run(pkg.user_id, `${local}@${domain} is at ${usagePct.toFixed(0)}% capacity (${usageMB.toFixed(0)}MB / ${quotaMB}MB). Consider purchasing additional storage.`)
            db.prepare(`UPDATE gsws_mailbox_storage SET alerted_80 = 1 WHERE package_id = ? AND domain = ? AND mailbox_local = ?`)
              .run(pkg.pkg_id, domain, local)
            alerted80++
          }

          if (usagePct >= 100 && !existing?.alerted_100) {
            db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Mailbox storage full', ?)`)
              .run(pkg.user_id, `${local}@${domain} is full (${usageMB.toFixed(0)}MB / ${quotaMB}MB). New emails may be rejected.`)
            db.prepare(`UPDATE gsws_mailbox_storage SET alerted_100 = 1 WHERE package_id = ? AND domain = ? AND mailbox_local = ?`)
              .run(pkg.pkg_id, domain, local)
            alerted100++
          }

          if (usagePct < 80 && (existing?.alerted_80 || existing?.alerted_100)) {
            db.prepare(`UPDATE gsws_mailbox_storage SET alerted_80 = 0, alerted_100 = 0 WHERE package_id = ? AND domain = ? AND mailbox_local = ?`)
              .run(pkg.pkg_id, domain, local)
          }
        }
      }
    } catch (err: any) {
      console.error(`[mailbox-storage cron] pkg ${pkg.pkg_id}:`, err.message)
      errors++
    }
  }

  return NextResponse.json({ success: true, checked, alerted80, alerted100, errors, packages: packages.length, timestamp: new Date().toISOString() })
}
