import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import PackageTabs from './PackageTabs'

async function getPackageData(packageId: string) {
  try {
    const res = await client.get(`/package/${packageId}/web`)
    return { web: res.data, error: null }
  } catch (err: any) {
    return { web: null, error: err.message }
  }
}

export default async function PackageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()

  const pkg = user ? db.prepare(`
    SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?
  `).get(id, user.id) as any : null

  if (!pkg) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#a32d2d', fontSize: '13px' }}>Package not found or access denied.</p>
        <Link href="/packages" style={{ color: '#1a6ef5', fontSize: '13px' }}>← Back to packages</Link>
      </div>
    )
  }

  const { web, error } = await getPackageData(id)
  const info = web?.info || {}
  const ftpUsers = web?.ftpUsers || []
  const names = web?.names || [pkg.domain_name]
  const ssl = info.usage?.ServerAliasCertificates || {}
  const sslDomains = Object.values(ssl).flat() as string[]

  const tabs = [
    { label: 'Overview', href: `/packages/${id}` },
    { label: 'Email', href: `/packages/${id}/email` },
    { label: 'Files', href: `/packages/${id}/files` },
    { label: 'DNS', href: `/packages/${id}/dns` },
    { label: 'SSL', href: `/packages/${id}/ssl` },
    { label: 'CDN', href: `/packages/${id}/cdn` },
    { label: 'Databases', href: `/packages/${id}/databases` },
    { label: 'PHP', href: `/packages/${id}/php` },
    { label: 'Backups', href: `/packages/${id}/backups` },
    { label: 'Security', href: `/packages/${id}/security` },
    { label: 'Applications', href: `/packages/${id}/applications` },
    ...(pkg.package_type === 'wordpress' ? [{ label: 'WordPress', href: `/packages/${id}/wordpress` }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
            <Link href="/packages" style={{ color: '#1a6ef5' }}>Packages</Link> › {pkg.domain_name}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>
            {pkg.domain_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: pkg.package_type === 'wordpress' ? '#e6f1fb' : pkg.package_type === 'windows' ? '#faeeda' : '#f1efe8', color: pkg.package_type === 'wordpress' ? '#185fa5' : pkg.package_type === 'windows' ? '#854f0b' : '#5a5a5a' }}>{pkg.package_label}</span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
            {info.zone && <span style={{ fontSize: '11px', color: '#9a9a9a' }}>📍 {info.zone}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {info.temporaryUrls && Object.values(info.temporaryUrls)[0] && (
            <a href={`https://${Object.values(info.temporaryUrls)[0]}`} target="_blank"
              style={{ height: '34px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', color: '#0a0a0a', textDecoration: 'none', background: '#fff' }}>
              Preview ↗
            </a>
          )}
          <a href={`https://${pkg.domain_name}`} target="_blank"
            style={{ height: '34px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
            Visit site ↗
          </a>
        </div>
      </div>

      <PackageTabs tabs={tabs} />

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>
          Could not load package data: {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Package info</h2>
          {[
            ['Domain', pkg.domain_name],
            ['Package type', pkg.package_label],
            ['Platform', pkg.package_type],
            ['IPv4 address', info.ip4Address || '—'],
            ['IPv6 address', info.ip6Address || '—'],
            ['Web server', info.webserver || '—'],
            ['Location', info.zone || '—'],
            ['Home directory', info.homeDirectory || '—'],
            ['Created', new Date(pkg.created_at).toLocaleDateString('en-GB')],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
              <span style={{ color: '#9a9a9a' }}>{label}</span>
              <span style={{ fontWeight: 500, color: '#0a0a0a', fontFamily: ['IPv4 address','IPv6 address','Home directory'].includes(label as string) ? 'ui-monospace, monospace' : 'inherit', fontSize: '12px' }}>{value as string}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Usage</h2>
            {[
              ['Databases', info.usage?.MySqlDatabases || 0],
              ['Domain aliases', info.usage?.ServerAliases || 0],
              ['SSL certificates', sslDomains.length],
              ['FTP accounts', ftpUsers.length],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
                <span style={{ color: '#9a9a9a' }}>{label}</span>
                <span style={{ fontWeight: 600, color: '#0a0a0a' }}>{value as number} / ∞</span>
              </div>
            ))}
          </div>

          <div className="gsws-card">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>FTP access</h2>
            {[
              ['FTP server', info.ftpserver || 'ftp.gb.stackcp.com'],
              ['Protocol', info.ftpProtocol || 'FTP'],
              ['Username', ftpUsers[0]?.Username || pkg.domain_name],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
                <span style={{ color: '#9a9a9a' }}>{label}</span>
                <span style={{ fontWeight: 500, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace', fontSize: '11px' }}>{value as string}</span>
              </div>
            ))}
            <Link href={`/packages/${id}/files`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '10px', fontSize: '12px', color: '#1a6ef5', textDecoration: 'none', fontWeight: 500 }}>
              Manage FTP accounts →
            </Link>
          </div>
        </div>
      </div>

      {sslDomains.length > 0 && (
        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>SSL certificates</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sslDomains.map((d: string) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#eaf3de', border: '1px solid #c0dd97', borderRadius: '20px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2.5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#3b6d11', fontFamily: 'ui-monospace, monospace' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {names.length > 0 && (
        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Domain names ({names.length})</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {names.map((n: string) => (
              <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: '#f7f7f7', border: '1px solid #ebebeb', borderRadius: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{n}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'Email accounts', href: `/packages/${id}/email`, icon: '📧' },
          { label: 'File manager', href: `/packages/${id}/files`, icon: '📁' },
          { label: 'Databases', href: `/packages/${id}/databases`, icon: '🗄️' },
          { label: 'SSL / TLS', href: `/packages/${id}/ssl`, icon: '🔒' },
          { label: 'DNS records', href: `/packages/${id}/dns`, icon: '🌐' },
          { label: 'Backups', href: `/packages/${id}/backups`, icon: '💾' },
          { label: 'Security', href: `/packages/${id}/security`, icon: '🛡️' },
          { label: 'PHP settings', href: `/packages/${id}/php`, icon: '⚙️' },
          { label: 'Applications', href: `/packages/${id}/applications`, icon: '📦' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '14px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '18px' }}>{a.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#0a0a0a' }}>{a.label}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
