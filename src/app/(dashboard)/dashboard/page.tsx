import Link from 'next/link'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)

  const packages = user ? db.prepare(`
    SELECT twentyi_package_id as id, domain_name as name, package_type as type,
           package_label as label, status, created_at
    FROM gsws_user_packages WHERE user_id = ? ORDER BY created_at DESC
  `).all(user.id) : []

  const domains = user ? db.prepare(`
    SELECT domain_name as name, registered_at FROM gsws_user_domains
    WHERE user_id = ? ORDER BY registered_at DESC
  `).all(user.id) : []

  const wpCount = packages.filter((p: any) => p.type === 'wordpress').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a', letterSpacing: '-0.3px' }}>
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>
            GeiG Simple Web Service · sws.geig.co.uk
          </p>
        </div>
        <Link href="/packages/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 18px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(26,110,245,0.3)' }}>
          + New package
        </Link>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Active packages', value: packages.length, sub: 'Hosting packages' },
          { label: 'Domains', value: domains.length, sub: 'Registered' },
          { label: 'Account credit', value: `£${Number(user?.credit_balance || 0).toFixed(2)}`, sub: 'Available balance' },
          { label: 'WordPress sites', value: wpCount, sub: 'Managed WP' },
        ].map(m => (
          <div key={m.label} style={{ background: '#ebebeb', borderRadius: '8px', padding: '16px' }}>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#9a9a9a', marginBottom: '6px' }}>{m.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.5px', color: '#0a0a0a', lineHeight: 1 }}>{m.value}</p>
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Packages */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Your hosting packages</h2>
          <Link href="/packages" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>View all →</Link>
        </div>

        {packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', border: '1px dashed #d4d4d4', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '12px' }}>
              No packages yet. Add a domain first then create a hosting package.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link href="/domains/search"
                style={{ padding: '0 16px', height: '34px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none' }}>
                Register domain →
              </Link>
              <Link href="/packages/new"
                style={{ padding: '0 16px', height: '34px', display: 'inline-flex', alignItems: 'center', background: '#f7f7f7', color: '#0a0a0a', borderRadius: '6px', fontSize: '12.5px', border: '1px solid #d4d4d4', textDecoration: 'none' }}>
                Add hosting
              </Link>
            </div>
          </div>
        ) : (
          <table className="gsws-table">
            <thead>
              <tr><th>Domain</th><th>Type</th><th>Status</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {packages.map((pkg: any) => (
                <tr key={pkg.id}>
                  <td style={{ fontWeight: 600, color: '#0a0a0a' }}>{pkg.name}</td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                      background: pkg.type === 'wordpress' ? '#e6f1fb' : pkg.type === 'windows' ? '#faeeda' : '#f1efe8',
                      color: pkg.type === 'wordpress' ? '#185fa5' : pkg.type === 'windows' ? '#854f0b' : '#5a5a5a' }}>
                      {pkg.label}
                    </span>
                  </td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span></td>
                  <td style={{ fontSize: '12px', color: '#9a9a9a' }}>{new Date(pkg.created_at).toLocaleDateString('en-GB')}</td>
                  <td>
                    <Link href={`/packages/${pkg.id}`}
                      style={{ padding: '0 12px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', color: '#0a0a0a', textDecoration: 'none', background: '#fff' }}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Register domain', desc: 'Find & register a new domain', href: '/domains/search', icon: 'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20' },
          { label: 'Add hosting', desc: 'Create a hosting package', href: '/packages/new', icon: 'M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z' },
          { label: 'Top up credit', desc: `Balance: £${Number(user?.credit_balance || 0).toFixed(2)}`, href: '/account/topup', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
        ].map(ql => (
          <Link key={ql.href} href={ql.href}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2">
                <path d={ql.icon}/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{ql.label}</p>
              <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{ql.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
