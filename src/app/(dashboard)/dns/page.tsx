import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function DNSPage() {
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const packages = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE user_id = ? AND status = ?').all(user.id, 'active') as any[] : []
  const domains = user ? db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ?').all(user.id) as any[] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>DNS</h1>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>Manage DNS records for your domains and packages</p>
      </div>
      {packages.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#9a9a9a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Hosting packages</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {packages.map((pkg: any) => (
              <Link key={pkg.id} href={`/packages/${pkg.twentyi_package_id}/dns`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>🌐</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{pkg.domain_name}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500 }}>Manage DNS →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {domains.length > 0 && (
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#9a9a9a', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Registered domains</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {domains.map((d: any) => (
              <Link key={d.id} href={`/domains/${d.domain_name}/dns`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>🔗</span>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{d.domain_name}</p>
                </div>
                <span style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500 }}>Manage DNS →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
      {packages.length === 0 && domains.length === 0 && (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>No domains or packages</p>
        </div>
      )}
    </div>
  )
}
