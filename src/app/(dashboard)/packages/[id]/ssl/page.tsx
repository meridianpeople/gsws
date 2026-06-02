import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

export default async function PackageSSLPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let certs: any[] = []
  let forceSSL = false
  try {
    const [certsRes, forceRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/certificates`),
      client.get(`/package/${id}/web/forceSSL`),
    ])
    if (certsRes.status === 'fulfilled') certs = certsRes.value.data || []
    if (forceRes.status === 'fulfilled') forceSSL = forceRes.value.data?.enabled || false
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>SSL / TLS certificates</h2>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>{certs.length} certificate{certs.length !== 1 ? 's' : ''} installed</p>
        </div>
        <button style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Install free SSL
        </button>
      </div>

      {/* Force SSL toggle */}
      <div className="gsws-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Force HTTPS</p>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Redirect all HTTP traffic to HTTPS automatically</p>
        </div>
        <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: forceSSL ? '#eaf3de' : '#f7f7f7', color: forceSSL ? '#3b6d11' : '#9a9a9a' }}>
          {forceSSL ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {certs.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No certificates installed</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '16px' }}>Install a free Let's Encrypt certificate</p>
          <button style={{ height: '36px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            Install free SSL
          </button>
        </div>
      ) : (
        <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="gsws-table">
            <thead>
              <tr><th>Common name</th><th>Provider</th><th>Expires</th><th>Status</th></tr>
            </thead>
            <tbody>
              {certs.map((c: any) => {
                const expires = c.createdAt ? new Date(new Date(c.createdAt).getTime() + 90 * 24 * 60 * 60 * 1000) : null
                const isExpired = expires && expires < new Date()
                const soonExpires = expires && !isExpired && expires < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                return (
                  <tr key={c.id}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{c.commonName}</td>
                    <td style={{ fontSize: '12px', color: '#9a9a9a' }}>{c.provider}</td>
                    <td style={{ fontSize: '12px', color: soonExpires ? '#854f0b' : isExpired ? '#a32d2d' : '#9a9a9a' }}>
                      {expires ? expires.toLocaleDateString('en-GB') : '—'}
                    </td>
                    <td>
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: isExpired ? '#fcebeb' : '#eaf3de', color: isExpired ? '#a32d2d' : '#3b6d11' }}>
                        {isExpired ? 'Expired' : 'Valid'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
