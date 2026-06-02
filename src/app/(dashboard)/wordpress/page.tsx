import Link from 'next/link'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export default async function WordPressPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const wpPackages = user ? db.prepare("SELECT * FROM gsws_user_packages WHERE user_id = ? AND package_type = 'wordpress'").all(user.id) as any[] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>WordPress</h1>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>Manage your WordPress hosting packages</p>
      </div>
      {wpPackages.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No WordPress packages</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '16px' }}>Create a WordPress hosting package to get started</p>
          <Link href="/packages/new" style={{ height: '36px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Create WordPress package
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {wpPackages.map((pkg: any) => (
            <Link key={pkg.id} href={`/packages/${pkg.twentyi_package_id}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', textDecoration: 'none' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{pkg.domain_name}</p>
                <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>{pkg.package_label}</p>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#e6f1fb', color: '#185fa5' }}>WordPress</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
