'use client'
import { useState } from 'react'

export default function SSLManager({ packageId, domainName, initialCerts, initialForceSSL, webNames }: {
  packageId: string
  domainName: string
  initialCerts: any[]
  initialForceSSL: boolean
  webNames: string[]
}) {
  const [certs, setCerts] = useState(initialCerts)
  const [forceSSL, setForceSSL] = useState(initialForceSSL)
  const [installing, setInstalling] = useState(false)
  const [togglingSSL, setTogglingSSL] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showInstall, setShowInstall] = useState(false)
  const [selectedName, setSelectedName] = useState(webNames[0] || domainName)

  function showOk(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(''), 4000) }
  function showErr(msg: string) { setError(msg); setTimeout(() => setError(''), 6000) }

  async function handleInstallSSL() {
    setInstalling(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/ssl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: selectedName, enabled: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to install SSL')
      showOk(`Free SSL certificate requested for ${selectedName}. This may take a few minutes.`)
      setShowInstall(false)
      setTimeout(() => window.location.reload(), 3000)
    } catch (err: any) {
      showErr(err.message)
    } finally {
      setInstalling(false)
    }
  }

  async function handleToggleForceSSL() {
    setTogglingSSL(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/security/forcessl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !forceSSL }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setForceSSL(f => !f)
      showOk(`Force HTTPS ${!forceSSL ? 'enabled' : 'disabled'}`)
    } catch (err: any) {
      showErr(err.message)
    } finally {
      setTogglingSSL(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>SSL / TLS certificates</h2>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>{certs.length} certificate{certs.length !== 1 ? 's' : ''} installed</p>
        </div>
        <button onClick={() => setShowInstall(s => !s)}
          style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Install free SSL
        </button>
      </div>

      {/* Install SSL panel */}
      {showInstall && (
        <div className="gsws-card" style={{ border: '1.5px solid #1a6ef5', background: '#f0f5ff' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '12px' }}>Install free Let's Encrypt certificate</h3>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '6px' }}>Domain name</label>
            <select value={selectedName} onChange={e => setSelectedName(e.target.value)}
              style={{ width: '100%', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', background: '#fff' }}>
              {webNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '12px' }}>
            A wildcard certificate will be installed covering {selectedName} and *.{selectedName}. Make sure DNS is pointed to 20i nameservers.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleInstallSSL} disabled={installing}
              style={{ height: '32px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: installing ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: installing ? 0.7 : 1 }}>
              {installing ? 'Installing…' : 'Install certificate'}
            </button>
            <button onClick={() => setShowInstall(false)}
              style={{ height: '32px', padding: '0 16px', background: '#fff', color: '#5a5a5a', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Force HTTPS toggle */}
      <div className="gsws-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Force HTTPS</p>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Redirect all HTTP traffic to HTTPS automatically</p>
        </div>
        <button onClick={handleToggleForceSSL} disabled={togglingSSL}
          style={{ height: '28px', padding: '0 14px', border: 'none', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: togglingSSL ? 'not-allowed' : 'pointer', fontFamily: 'inherit', background: forceSSL ? '#eaf3de' : '#f7f7f7', color: forceSSL ? '#3b6d11' : '#9a9a9a', transition: 'all 0.2s' }}>
          {togglingSSL ? '…' : forceSSL ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Certificates list */}
      {certs.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '12px' }}>🔒</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No certificates installed</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '16px' }}>Install a free Let's Encrypt certificate to secure your site</p>
          <button onClick={() => setShowInstall(true)}
            style={{ height: '36px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
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
                      <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: isExpired ? '#fcebeb' : soonExpires ? '#faeeda' : '#eaf3de', color: isExpired ? '#a32d2d' : soonExpires ? '#854f0b' : '#3b6d11' }}>
                        {isExpired ? 'Expired' : soonExpires ? 'Expiring soon' : 'Valid'}
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
