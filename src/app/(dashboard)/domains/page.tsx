import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function DomainsPage() {
  const cookieStore = await cookies()
  const user = await getGswsSession()

  const domains = user ? db.prepare(`
    SELECT domain_name as name, twentyi_package_id, registered_at
    FROM gsws_user_domains WHERE user_id = ? ORDER BY registered_at DESC
  `).all(user.id) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Domains</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Add a domain before creating any hosting package or service.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href="/domains/transfer" style={{ display: 'inline-flex', alignItems: 'center', height: '38px', padding: '0 16px', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--card-bg)' }}>
            Transfer in
          </Link>
          <Link href="/domains/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(26,110,245,0.3)' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            Search & register domain
          </Link>
        </div>
      </div>

      {domains.length === 0 && (
        <div style={{ background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 100%)', border: '1px solid #1a3060', borderRadius: '12px', padding: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>Register your first domain</h2>
            <p style={{ fontSize: '13px', color: '#6699cc', maxWidth: '420px', lineHeight: 1.6 }}>
              Every GeiG Simple Web Service starts with a domain. Search for your perfect name and get it live in minutes — free WHOIS privacy included.
            </p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '14px', fontSize: '12px', color: '#5599ff' }}>
              <span>✓ Free WHOIS privacy</span>
              <span>✓ Auto-renewal</span>
              <span>✓ Instant activation</span>
              <span>✓ Free SSL</span>
            </div>
          </div>
          <Link href="/domains/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', flexShrink: 0, height: '48px', padding: '0 32px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Find your domain →
          </Link>
        </div>
      )}

      {domains.length > 0 && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg-elevated)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {domains.length} domain{domains.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <table className="gsws-table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Registered</th>
                <th>Privacy</th>
                <th>Hosting</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d: any) => (
                <tr key={d.name}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}>{d.name}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {new Date(d.registered_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Protected</span>
                  </td>
                  <td>
                    {d.twentyi_package_id ? (
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#e6f1fb', color: '#185fa5' }}>Hosted</span>
                    ) : (
                      <Link href={`/packages/new?domain=${d.name}`}
                        style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#faeeda', color: '#854f0b', textDecoration: 'none' }}>
                        + Add hosting
                      </Link>
                    )}
                  </td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
                  </td>
                  <td>
                    <Link href={`/domains/${d.name}`}
                      style={{ padding: '0 12px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-primary)', textDecoration: 'none', background: 'var(--card-bg)' }}>
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
  )
}
