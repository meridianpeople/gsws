import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

const EMAIL_PACKAGE_TYPE = 48219
const EMAIL_PACKAGE_LABEL = 'Unlimited Email Hosting'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const { domain } = await req.json()
    if (!domain) return NextResponse.json({ error: 'Domain required' }, { status: 400 })

    const existing = db.prepare('SELECT user_id FROM gsws_user_domains WHERE domain_name = ?').get(domain) as any
    if (existing && existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Domain already registered' }, { status: 409 })
    }

    // Step 1 — register domain
    await client.post('/reseller/*/addDomain', {
      name: domain,
      privacyService: true,
      years: 1,
    })

    // Step 2 — get 20i domain ID
    let twentyiDomainId: number | null = null
    try {
      const domainList = await client.get('/domain')
      const found = domainList.data.find((d: any) => d.name === domain)
      if (found) twentyiDomainId = found.id
    } catch {}

    // Step 3 — auto-create email hosting package
    let emailPackageId: string | null = null
    try {
      const pkgRes = await client.post('/reseller/*/addWeb', {
        type: EMAIL_PACKAGE_TYPE,
        domain_name: domain,
        documentRoots: { [domain]: 'public_html' },
      })
      emailPackageId = pkgRes.data?.result?.id || pkgRes.data?.id || null
    } catch (e) {
      console.error('Email package creation failed:', e)
    }

    // Step 4 — record ownership in GSWS
    db.prepare(`
      INSERT OR REPLACE INTO gsws_user_domains (user_id, domain_name, twentyi_domain_id, twentyi_package_id)
      VALUES (?, ?, ?, ?)
    `).run(user.id, domain, twentyiDomainId, emailPackageId)

    // Step 5 — record email package in user packages
    if (emailPackageId) {
      db.prepare(`
        INSERT OR REPLACE INTO gsws_user_packages (user_id, twentyi_package_id, domain_name, package_type, package_label)
        VALUES (?, ?, ?, 'email', ?)
      `).run(user.id, String(emailPackageId), domain, EMAIL_PACKAGE_LABEL)
    }

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'domain_register', 'domain', ?, ?)
    `).run(user.id, domain, `Registered ${domain} with auto email hosting`)

    return NextResponse.json({
      success: true,
      domain,
      emailPackage: emailPackageId ? { id: emailPackageId, label: EMAIL_PACKAGE_LABEL } : null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
