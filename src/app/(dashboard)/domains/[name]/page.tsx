import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function getDomainData(domainName: string) {
  try {
    const [dnsRes, whoisRes] = await Promise.allSettled([
      client.get(`/domain-search/${encodeURIComponent(domainName)}`),
      client.get(`/domain`),
    ])
    const domainInfo = whoisRes.status === 'fulfilled'
      ? (whoisRes.value.data as any[]).find((d: any) => d.name === domainName)
      : null
    return { domainInfo, error: null }
  } catch (err: any) {
    return { domainInfo: null, error: err.message }
  }
}

export default async function DomainManagePage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const domainName = decodeURIComponent(name)

  const cookieStore = await cookies()
  const user = await getGswsSession()

  // Verify user owns this domain
  const owned = user ? db.prepare(
    'SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?'
  ).get(user.id, domainName) as any : null

  if (!owned) {
    return (
      <div style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ color: '#a32d2d', fontSize: '13px' }}>Domain not found or access denied.</p>
        <Link href="/domains" style={{ color: '#1a6ef5', fontSize: '13px' }}>← Back to domains</Link>
      </div>
    )
  }

  const { domainInfo, error } = await getDomainData(domainName)

  const tools = [
    { label: 'DNS records', desc: 'Manage A, MX, CNAME, TXT records', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', href: `/domains/${name}/dns` },
    { label: 'Nameservers', desc: 'View & update nameservers', icon: 'M20 3H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z', href: `/domains/${name}/nameservers` },
    { label: 'WHOIS privacy', desc: 'Control WHOIS disclosure', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', href: `/domains/${name}/privacy` },
    { label: 'Domain contacts', desc: 'Registrant contact info', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', href: `/domains/${name}/contacts` },
    { label: 'DNSSEC', desc: 'DNS security extensions', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', href: `/domains/${name}/dnssec` },
    { label: 'Transfer away', desc: 'Transfer to another registrar', icon: 'M5 12h14M12 5l7 7-7 7', href: `/domains/${name}/transfer` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
            <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link> › {domainName}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{domainName}</h1>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
          {!owned.twentyi_package_id && (
            <Link href={`/packages/new?domain=${domainName}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, textDecoration: 'none' }}>
              + Add hosting
            </Link>
          )}
        </div>
      </div>

      {/* Domain info */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Domain info</h2>
          {[
            ['Domain name', domainName],
            ['Registered', new Date(owned.registered_at).toLocaleDateString('en-GB')],
            ['Expiry', domainInfo?.expiryDate ? new Date(domainInfo.expiryDate).toLocaleDateString('en-GB') : '—'],
            ['Auto-renew', domainInfo?.preferredRenewalAction === 'renew' ? 'Enabled' : 'Disabled'],
            ['Privacy', 'Protected'],
            ['Hosting', owned.twentyi_package_id ? 'Active package' : 'No hosting yet'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #ebebeb', fontSize: '12.5px' }}>
              <span style={{ color: '#9a9a9a' }}>{label}</span>
              <span style={{ fontWeight: 500, color: '#0a0a0a' }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Renewal info</h2>
          {[
            ['Renewal action', domainInfo?.preferredRenewalAction || '—'],
            ['Renewal period', domainInfo?.preferredRenewalMonths ? `${domainInfo.preferredRenewalMonths} months` : '—'],
            ['Grace period', domainInfo?.renewalConstraint?.gracePeriod ? `${domainInfo.renewalConstraint.gracePeriod} days` : '—'],
            ['Redemption', domainInfo?.renewalConstraint?.redemptionPeriod ? `${domainInfo.renewalConstraint.redemptionPeriod} days` : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #ebebeb', fontSize: '12.5px' }}>
              <span style={{ color: '#9a9a9a' }}>{label}</span>
              <span style={{ fontWeight: 500, color: '#0a0a0a' }}>{value}</span>
            </div>
          ))}
          <div style={{ marginTop: '16px' }}>
            <button style={{ width: '100%', height: '34px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              Renew domain
            </button>
          </div>
        </div>
      </div>

      {/* Management tools */}
      <div className="gsws-card">
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '16px' }}>Domain management</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {tools.map(t => (
            <Link key={t.label} href={t.href}
              style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '14px 16px', background: '#f7f7f7', borderRadius: '8px', border: '1px solid #ebebeb', textDecoration: 'none', transition: 'border-color 0.15s' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="1.5">
                <path d={t.icon}/>
              </svg>
              <p style={{ fontSize: '12.5px', fontWeight: 600, color: '#0a0a0a' }}>{t.label}</p>
              <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{t.desc}</p>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
