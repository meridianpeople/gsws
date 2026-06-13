'use client'
import { useState } from 'react'

export default function RedirectsManager({ packageId, domainName, initialRedirects, webNames }: {
  packageId: string
  domainName: string
  initialRedirects: any[]
  webNames: string[]
}) {
  const [redirects, setRedirects] = useState(initialRedirects)
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [newRed, setNewRed] = useState({ domain: webNames[0] || domainName, from: '', to: '', type: '301' })

  function showOk(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(''), 3000) }
  function showErr(msg: string) { setError(msg); setTimeout(() => setError(''), 6000) }

  async function handleAdd() {
    if (!newRed.from || !newRed.to) return
    setSaving(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/redirects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRed),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRedirects(r => [...r, { ...newRed }])
      setNewRed({ domain: webNames[0] || domainName, from: '', to: '', type: '301' })
      setShowAdd(false)
      showOk('Redirect created')
    } catch (err: any) { showErr(err.message) }
    setSaving(false)
  }

  async function handleDelete(r: any) {
    const key = `${r.domain}${r.from}`
    setDeleting(key)
    try {
      const res = await fetch(`/api/packages/${packageId}/redirects`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: r.domain, from: r.from, type: r.type }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRedirects(rs => rs.filter(x => !(x.domain === r.domain && x.from === r.from && x.type === r.type)))
      showOk('Redirect deleted')
    } catch (err: any) { showErr(err.message) }
    setDeleting(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{redirects.length} redirect{redirects.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd(s => !s)}
          style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Add redirect
        </button>
      </div>

      {showAdd && (
        <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Add redirect</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Domain</label>
                <select value={newRed.domain} onChange={e => setNewRed(r => ({ ...r, domain: e.target.value }))}
                  style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 8px', fontFamily: 'inherit' }}>
                  {webNames.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div style={{ flex: '0 0 90px' }}>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Type</label>
                <select value={newRed.type} onChange={e => setNewRed(r => ({ ...r, type: e.target.value }))}
                  style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 8px', fontFamily: 'inherit' }}>
                  <option value="301">301 Permanent</option>
                  <option value="302">302 Temporary</option>
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>From path</label>
              <input value={newRed.from} onChange={e => setNewRed(r => ({ ...r, from: e.target.value }))}
                placeholder="/old-page"
                style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 10px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>To URL</label>
              <input value={newRed.to} onChange={e => setNewRed(r => ({ ...r, to: e.target.value }))}
                placeholder="https://example.com/new-page"
                style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 10px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} disabled={saving || !newRed.from || !newRed.to}
              style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newRed.from || !newRed.to ? 0.5 : 1 }}>
              {saving ? 'Saving…' : 'Create redirect'}
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ height: '32px', padding: '0 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
        {redirects.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>↪️</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No redirects</p>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Redirect old URLs to new ones automatically</p>
          </div>
        ) : (
          <table className="gsws-table">
            <thead><tr><th>From</th><th>To</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {redirects.map((r: any, i: number) => {
                const key = `${r.domain}${r.from}`
                return (
                  <tr key={i}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{r.domain}</span>{r.from}
                    </td>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#1a6ef5', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{String(r.to)}</td>
                    <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: r.type === '301' ? '#eaf3de' : '#faeeda', color: r.type === '301' ? '#3b6d11' : '#854f0b' }}>{r.type}</span></td>
                    <td>
                      <button onClick={() => handleDelete(r)} disabled={deleting === key}
                        style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {deleting === key ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
