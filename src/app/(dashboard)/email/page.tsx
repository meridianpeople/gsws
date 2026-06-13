import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function EmailPage() {
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const packages = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE user_id = ? AND status = ?').all(user.id, 'active') as any[] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Email</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Manage email for your hosting packages</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {packages.map((pkg: any) => (
          <Link key={pkg.id} href={`/packages/${pkg.twentyi_package_id}/email`}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '20px' }}>📧</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>{pkg.domain_name}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{pkg.package_label}</p>
              </div>
            </div>
            <span style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500 }}>Manage email →</span>
          </Link>
        ))}
        {packages.length === 0 && (
          <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>📧</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No hosting packages</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px' }}>Create a hosting package to manage email</p>
          </div>
        )}
      </div>
    </div>
  )
}
