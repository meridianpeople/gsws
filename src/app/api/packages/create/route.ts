import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

const ALLOWED: Record<number, { label: string; category: string }> = {
  4438: { label: 'Linux Unlimited', category: 'linux' },
  4439: { label: 'Windows Unlimited', category: 'windows' },
  4440: { label: 'WordPress Unlimited', category: 'wordpress' },
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { domain, typeId, confirmed } = await req.json()
    if (!domain || !typeId) return NextResponse.json({ error: 'Domain and package type required' }, { status: 400 })

    const pkg = ALLOWED[Number(typeId)]
    if (!pkg) return NextResponse.json({ error: 'Invalid package type' }, { status: 400 })

    // Verify user owns domain
    const owned = db.prepare('SELECT * FROM gsws_user_domains WHERE domain_name = ? AND user_id = ?').get(domain, user.id) as any
    if (!owned) return NextResponse.json({ error: 'You do not own this domain' }, { status: 403 })

    // Check if existing hosting package
    const existingPkg = db.prepare(`
      SELECT * FROM gsws_user_packages
      WHERE domain_name = ? AND user_id = ? AND package_type != 'email'
    `).get(domain, user.id) as any

    // If existing package and not confirmed, return warning
    if (existingPkg && !confirmed) {
      return NextResponse.json({
        requiresConfirmation: true,
        existingPackage: existingPkg.package_label,
        warning: `This domain already has a ${existingPkg.package_label} package. Creating a new package will delete all website files and data. Email accounts and data will be preserved.`,
      }, { status: 409 })
    }

    // If existing package, delete it from 20i first
    if (existingPkg) {
      try {
        await client.delete(`/package/${existingPkg.twentyi_package_id}`)
      } catch (e) {
        console.error('Failed to delete old package:', e)
      }
      db.prepare('DELETE FROM gsws_user_packages WHERE id = ?').run(existingPkg.id)
    }

    // Create new package
    const res = await client.post('/reseller/*/addWeb', {
      type: typeId,
      domain_name: domain,
      documentRoots: { [domain]: 'public_html' },
    })

    const packageId = res.data?.result?.id || res.data?.id || String(Date.now())

    // Record in GSWS
    db.prepare(`
      INSERT OR REPLACE INTO gsws_user_packages (user_id, twentyi_package_id, domain_name, package_type, package_label)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, String(packageId), domain, pkg.category, pkg.label)

    // Update domain with package ID
    db.prepare('UPDATE gsws_user_domains SET twentyi_package_id = ? WHERE domain_name = ? AND user_id = ?')
      .run(String(packageId), domain, user.id)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'package_create', 'package', ?, ?)
    `).run(user.id, domain, `Created ${pkg.label} package for ${domain}${existingPkg ? ` (replaced ${existingPkg.package_label})` : ''}`)

    return NextResponse.json({ success: true, result: res.data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
