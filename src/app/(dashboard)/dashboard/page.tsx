import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

function MetricIcon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />{d2 && <path d={d2} />}
    </svg>
  )
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const user = await getGswsSession()

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
  const credit = Number(user?.creditBalance || 0).toFixed(2)
  const firstName = user?.name ? user.name.split(' ')[0] : ''

  const metrics = [
    { label: 'Active Packages', value: packages.length, sub: 'Hosting packages', icon: <MetricIcon d="M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />, color: '#60a5fa' },
    { label: 'Domains', value: domains.length, sub: 'Registered', icon: <MetricIcon d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20M2 12h20" d2="M12 2a10 10 0 100 20 10 10 0 000-20z" />, color: '#4ade80' },
    { label: 'VPS Instances', value: 0, sub: 'Provisioned', icon: <MetricIcon d="M5 2h14a1 1 0 011 1v6H4V3a1 1 0 011-1z" d2="M4 9h16v6H4zM4 15h16v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM8 5h.01M8 12h.01M8 19h.01" />, color: '#f59e0b' },
    { label: 'GPU Compute', value: 0, sub: 'Active nodes', icon: <MetricIcon d="M4 4h16v16H4z" d2="M9 9h6v6H9zM9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />, color: '#a78bfa' },
    { label: 'WordPress Sites', value: wpCount, sub: 'Managed WP', icon: <MetricIcon d="M12 2a10 10 0 100 20 10 10 0 000-20z" d2="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />, color: '#22d3ee' },
    { label: 'Account Credit', value: `£${credit}`, sub: 'Available balance', icon: <MetricIcon d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />, color: '#34d399' },
  ]

  const services = [
    { title: 'Hosting', sub: `${packages.length} active plan${packages.length !== 1 ? 's' : ''}`, badge: 'System Healthy', badgeColor: '#14532d', badgeBg: 'rgba(20,83,45,0.2)', href: '/packages', cta: 'Manage', active: packages.length > 0 },
    { title: 'Domains', sub: `${domains.length} active domain${domains.length !== 1 ? 's' : ''}`, badge: domains.length > 0 ? 'Active' : 'No active assets', badgeColor: domains.length > 0 ? '#14532d' : '#555', badgeBg: domains.length > 0 ? 'rgba(20,83,45,0.2)' : 'rgba(80,80,80,0.15)', href: '/domains', cta: domains.length > 0 ? 'Manage' : 'Buy Domain', active: domains.length > 0 },
    { title: 'WordPress', sub: `${wpCount} instance${wpCount !== 1 ? 's' : ''}`, badge: wpCount > 0 ? 'Secure' : 'Not provisioned', badgeColor: wpCount > 0 ? '#1e40af' : '#555', badgeBg: wpCount > 0 ? 'rgba(30,64,175,0.2)' : 'rgba(80,80,80,0.15)', href: '/wordpress', cta: 'Manage WP', active: wpCount > 0 },
    { title: 'VPS', sub: '0 virtual servers', badge: 'Not provisioned', badgeColor: '#555', badgeBg: 'rgba(80,80,80,0.15)', href: '/compute/vps', cta: 'Deploy VPS', active: false },
    { title: 'GPU Compute', sub: '0 active nodes', badge: 'AI Workload Ready', badgeColor: '#0e7490', badgeBg: 'rgba(14,116,144,0.15)', href: '/compute/gpu', cta: 'Launch Studio', active: false },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', marginBottom: '4px' }}>
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Monitor and manage your hosting, domains, VPS, GPU compute, and account services from one workspace.
          </p>
        </div>
        <Link href="/packages/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(26,110,245,0.3)', flexShrink: 0 }}>
          + New package
        </Link>
      </div>

      {/* Metrics — 6 col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
        {metrics.map(m => (
          <div key={m.label} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)' }}>{m.label}</p>
              <span style={{ color: m.color }}>{m.icon}</span>
            </div>
            <p style={{ fontSize: '26px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>{m.value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '6px' }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Provisioned Services */}
      <div>
        <h2 style={{ fontSize: '15px', fontWeight: 600, color: '#fff', marginBottom: '14px' }}>Provisioned Services</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
          {services.map(s => (
            <div key={s.title} style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: s.active ? 1 : 0.6, transition: 'border-color 0.2s' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{s.title}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{s.sub}</p>
                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: s.badgeColor, background: s.badgeBg }}>
                  {s.badge}
                </span>
              </div>
              <Link href={s.href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '20px', height: '34px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#ccc', textDecoration: 'none', transition: 'border-color 0.15s, color 0.15s' }}>
                {s.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Hosting Packages Table */}
      <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>Your Hosting Packages</h2>
          <Link href="/packages" style={{ fontSize: '12px', color: '#1a6ef5', textDecoration: 'none' }}>View all →</Link>
        </div>

        {packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px' }}>
            <div style={{ width: '40px', height: '40px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
              </svg>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>No packages yet. Add a domain first then create a hosting package.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <Link href="/domains/search" style={{ padding: '0 16px', height: '34px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none' }}>
                Register domain →
              </Link>
              <Link href="/packages/new" style={{ padding: '0 16px', height: '34px', display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', color: '#ccc', borderRadius: '6px', fontSize: '12.5px', border: '1px solid #2a2a2a', textDecoration: 'none' }}>
                Add hosting
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                  {['Domain', 'Type', 'Status', 'Created', ''].map(h => (
                    <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg: any) => (
                  <tr key={pkg.id} style={{ borderBottom: '1px solid #161616' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600, color: '#fff' }}>{pkg.name}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                        background: pkg.type === 'wordpress' ? 'rgba(30,64,175,0.2)' : pkg.type === 'windows' ? 'rgba(133,79,11,0.2)' : 'rgba(80,80,80,0.2)',
                        color: pkg.type === 'wordpress' ? '#60a5fa' : pkg.type === 'windows' ? '#f59e0b' : '#aaa' }}>
                        {pkg.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: 'rgba(20,83,45,0.2)', color: '#4ade80' }}>Active</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-tertiary)' }}>{new Date(pkg.created_at).toLocaleDateString('en-GB')}</td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      <Link href={`/packages/${pkg.id}`} style={{ padding: '0 14px', height: '28px', display: 'inline-flex', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '6px', fontSize: '12px', color: '#ccc', textDecoration: 'none' }}>
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick actions — 5 col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
        {[
          { label: 'Register domain', desc: 'Find & register a new domain', href: '/domains/search', iconColor: '#1a6ef5', iconBg: 'rgba(26,110,245,0.1)', icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20' },
          { label: 'Add hosting', desc: 'Create a hosting package', href: '/packages/new', iconColor: '#1a6ef5', iconBg: 'rgba(26,110,245,0.1)', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
          { label: 'Deploy VPS', desc: 'Launch a virtual server', href: '/compute/vps', iconColor: '#6366f1', iconBg: 'rgba(99,102,241,0.1)', icon: 'M20 3H4a1 1 0 00-1 1v4a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM20 11H4a1 1 0 00-1 1v4a1 1 0 001 1h16a1 1 0 001-1v-4a1 1 0 00-1-1z' },
          { label: 'Launch GPU', desc: 'Deploy AI/ML compute', href: '/compute/gpu', iconColor: '#00C8FF', iconBg: 'rgba(0,200,255,0.1)', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
          { label: 'Top up credit', desc: `Balance: £${credit}`, href: '/account/topup', iconColor: '#1a6ef5', iconBg: 'rgba(26,110,245,0.1)', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
        ].map(qa => (
          <Link key={qa.href} href={qa.href} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', background: '#111', border: '1px solid #1e1e1e', borderRadius: '12px', textDecoration: 'none', transition: 'border-color 0.15s' }}
            onMouseEnter={undefined} onMouseLeave={undefined}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: qa.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={qa.iconColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={qa.icon}/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>{qa.label}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{qa.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
