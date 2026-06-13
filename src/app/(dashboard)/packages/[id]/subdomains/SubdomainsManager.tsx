'use client'
import { useState } from 'react'

export default function SubdomainsManager({ packageId, domainName, webNames, initialSubdomains }: {
  packageId: string
  domainName: string
  webNames: string[]
  initialSubdomains: any
}) {
  // Convert {fullname: docroot} object to array if needed
  const toArray = (s: any) => Array.isArray(s)
    ? s
    : Object.entries(s || {}).map(([fullname, docroot]) => ({ fullname, docroot: docroot as string }))
  const [subdomains, setSubdomains] = useState(() => toArray(initialSubdomains))
  const [selectedDomain, setSelectedDomain] = useState(webNames[0] || domainName)
  const [showAdd, setShowAdd] = useState(false)
  const [newSub, setNewSub] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleDelete(subdomain: string) {
    try {
      const res = await fetch(`/api/packages/${packageId}/subdomains`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subdomain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSubdomains(s => s.filter((x: any) => x.fullname !== subdomain))
      setSuccess(`${subdomain} deleted`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
  }

  async function handleAdd() {
    if (!newSub) return
    setSaving(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/subdomains`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSub, domain: selectedDomain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSubdomains(s => [...s, { fullname: `${newSub}.${selectedDomain}`, docroot: `/${newSub}` }])
      setNewSub('')
      setShowAdd(false)
      setSuccess(`${newSub}.${selectedDomain} created`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subdomains.length} subdomain{subdomains.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(s => !s)}
          style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add subdomain
        </button>
      </div>

      {showAdd && (
        <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Add subdomain</h3>
          {webNames.length > 1 && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Domain</label>
              <select value={selectedDomain} onChange={e => setSelectedDomain(e.target.value)}
                style={{ height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 8px', fontFamily: 'inherit' }}>
                {webNames.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '12px' }}>
            <input value={newSub} onChange={e => setNewSub(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="shop"
              style={{ width: '160px', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>.{selectedDomain}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} disabled={saving || !newSub}
              style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newSub ? 0.5 : 1 }}>
              {saving ? 'Creating…' : 'Create subdomain'}
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ height: '32px', padding: '0 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
        {subdomains.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>🌐</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No subdomains</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Create subdomains like shop.{domainName}</p>
          </div>
        ) : (
          <table className="gsws-table">
            <thead><tr><th>Subdomain</th><th>Document root</th><th></th></tr></thead>
            <tbody>
              {subdomains.map((s: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{s.fullname}</td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{s.docroot?.startsWith('/') ? s.docroot : `/${s.docroot}`}</td>
                  <td>
                    <button onClick={() => handleDelete(s.fullname)} style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
