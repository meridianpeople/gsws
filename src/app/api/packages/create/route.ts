import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

const ALLOWED: Record<number, { label: string; category: string; serviceKey: string }> = {
  4438: { label: 'Linux Unlimited', category: 'linux', serviceKey: 'linux_unlimited' },
  4439: { label: 'Windows Unlimited', category: 'windows', serviceKey: 'windows_unlimited' },
  4440: { label: 'WordPress Unlimited', category: 'wordpress', serviceKey: 'wordpress_unlimited' },
}

const VAT_RATE = 0.20

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })

  try {
    const { domain, typeId, confirmed, externalDomain } = await req.json()
    if (!domain || !typeId) return NextResponse.json({ error: 'Domain and package type required' }, { status: 400 })

    const pkg = ALLOWED[Number(typeId)]
    if (!pkg) return NextResponse.json({ error: 'Invalid package type' }, { status: 400 })

    // Get pricing
    const catalogue = db.prepare("SELECT * FROM gsws_service_catalogue WHERE service_key=? AND service_type='hosting' AND active=1").get(pkg.serviceKey) as any
    const monthlyExVat = catalogue?.sell_price || 6.00
    const monthlyIncVat = Math.round(monthlyExVat * (1 + VAT_RATE) * 100) / 100

    // Check credit balance
    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id=?').get(user.id) as any
    const balance = credits?.balance || 0
    if (balance < monthlyIncVat) {
      return NextResponse.json({
        error: `Insufficient credit. First month costs £${monthlyIncVat.toFixed(2)} (inc. VAT) but your balance is £${balance.toFixed(2)}.`,
        required: monthlyIncVat, balance,
      }, { status: 402 })
    }

    // For owned domains, verify ownership. For external domains, skip check
    if (!externalDomain) {
      const owned = db.prepare('SELECT * FROM gsws_user_domains WHERE domain_name=? AND user_id=?').get(domain, user.id) as any
      if (!owned) return NextResponse.json({ error: 'You do not own this domain. Use an external domain if pointing via DNS.' }, { status: 403 })
    }

    // Check existing hosting package
    const existingPkg = db.prepare("SELECT * FROM gsws_user_packages WHERE domain_name=? AND user_id=? AND package_type!='email'").get(domain, user.id) as any
    if (existingPkg && !confirmed) {
      return NextResponse.json({
        requiresConfirmation: true,
        existingPackage: existingPkg.package_label,
        warning: `This domain already has a ${existingPkg.package_label} package. Creating a new package will delete all website files and data. Email accounts and data will be preserved.`,
      }, { status: 409 })
    }

    // Delete old package if replacing
    if (existingPkg) {
      try { await client.delete(`/package/${existingPkg.twentyi_package_id}`) } catch {}
      db.prepare('DELETE FROM gsws_user_packages WHERE id=?').run(existingPkg.id)
    }

    // Create package at 20i
    const res = await client.post('/reseller/*/addWeb', {
      type: typeId,
      domain_name: domain,
      documentRoots: { [domain]: 'public_html' },
    })

    const packageId = res.data?.result?.id || res.data?.id || String(Date.now())

    // Push SWS SSH public key to new package (silent — enables terminal access)
    try {
      const pubKeyPath = process.env.SWS_SSH_PUBLIC_KEY_PATH
      if (pubKeyPath && fs.existsSync(pubKeyPath)) {
        const pubKey = fs.readFileSync(pubKeyPath, 'utf8').trim()
        await client.post(`/package/${packageId}/web/sshkeys`, {
          add: [{ key: pubKey, handle: 'sws-terminal' }],
          delete: []
        })
      }
    } catch { /* non-fatal — terminal will fall back to password auth */ }

    // Deduct first month from credit
    const newBalance = Math.round((balance - monthlyIncVat) * 100) / 100
    db.prepare('INSERT OR REPLACE INTO gsws_user_credits (user_id, balance) VALUES (?, ?)').run(user.id, newBalance)
    db.prepare(`
      INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'hosting', ?, ?, ?)
    `).run(user.id, -monthlyIncVat, `${pkg.label} hosting - first month (ex VAT £${monthlyExVat.toFixed(2)} + VAT £${(monthlyIncVat - monthlyExVat).toFixed(2)})`, domain, newBalance)

    // Record package
    db.prepare(`INSERT OR REPLACE INTO gsws_user_packages (user_id, twentyi_package_id, domain_name, package_type, package_label) VALUES (?, ?, ?, ?, ?)`
    ).run(user.id, String(packageId), domain, pkg.category, pkg.label)

    // Update domain record if owned
    if (!externalDomain) {
      db.prepare('UPDATE gsws_user_domains SET twentyi_package_id=? WHERE domain_name=? AND user_id=?').run(String(packageId), domain, user.id)
    } else {
      // Register external domain in gsws_user_domains for tracking
      db.prepare('INSERT OR IGNORE INTO gsws_user_domains (user_id, domain_name, twentyi_package_id) VALUES (?, ?, ?)').run(user.id, domain, String(packageId))
    }

    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'package_create', 'package', ?, ?)`
    ).run(user.id, domain, `Created ${pkg.label} for ${domain}, charged £${monthlyIncVat.toFixed(2)}`)

    return NextResponse.json({ success: true, packageId, charged: monthlyIncVat, newBalance })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
