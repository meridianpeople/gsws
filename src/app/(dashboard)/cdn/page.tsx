import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function CDNPage() {
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const packages = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE user_id = ? AND status = ?').all(user.id, 'active') as any[] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>CDN & Performance</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Manage CDN, caching, security and performance for your packages</p>
      </div>

      {packages.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>📡</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>No hosting packages</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>Create a hosting package to access CDN features</p>
          <Link href="/packages/new" style={{ height: '36px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Create package
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {packages.map((pkg: any) => (
            <Link key={pkg.id} href={`/packages/${pkg.twentyi_package_id}/cdn`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  📡
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>{pkg.domain_name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{pkg.package_label}</p>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['Edge Caching', 'Optimisation', 'Security', 'Blocking', 'Stats'].map(f => (
                    <span key={f} style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500, background: 'var(--card-bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>{f}</span>
                  ))}
                </div>
                <span style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500 }}>Manage CDN →</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CDN info */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: '💾', title: 'Edge Caching', desc: 'Cache static assets globally for faster load times. Control TTL for images, CSS and JS.' },
          { icon: '⚡', title: 'Web Optimisation', desc: 'Minify HTML, CSS and JavaScript. Combine files and optimise images automatically.' },
          { icon: '🚫', title: 'Block Visitors', desc: 'Block visitors by country or IP address. Protect your site from unwanted traffic.' },
        ].map(item => (
          <div key={item.title} style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{item.title}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
