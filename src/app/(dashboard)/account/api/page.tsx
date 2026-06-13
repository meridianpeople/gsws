'use client'
import { useState, useEffect } from 'react'

export default function APICredentialsPage() {
  const [creds, setCreds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newScopes, setNewScopes] = useState('read')
  const [newCred, setNewCred] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => { loadCreds() }, [])

  async function loadCreds() {
    setLoading(true)
    try {
      const res = await fetch('/api/account/api-credentials')
      const data = await res.json()
      setCreds(data.credentials || [])
    } finally { setLoading(false) }
  }

  async function createCred() {
    setCreating(true); setError(''); setNewCred(null)
    try {
      const res = await fetch('/api/account/api-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, scopes: newScopes }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setNewCred(data)
      setNewName('')
      loadCreds()
    } catch { setError('Failed to create credentials') }
    finally { setCreating(false) }
  }

  async function deleteCred(id: number) {
    if (!confirm('Delete this API credential? This cannot be undone.')) return
    try {
      await fetch('/api/account/api-credentials', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      loadCreds()
    } catch {}
  }

  async function toggleCred(id: number, is_active: boolean) {
    try {
      await fetch('/api/account/api-credentials', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active }),
      })
      loadCreds()
    } catch {}
  }

  return (
    <div style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>API Credentials</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Generate client ID and secret to access the GSWS API programmatically.
          See <a href="/api-reference" style={{ color: '#1a6ef5' }}>API Reference</a> for available endpoints.
        </p>
      </div>

      {/* New credential created */}
      {newCred && (
        <div style={{ padding: '16px', background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '10px', marginBottom: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '12px' }}>
            ✅ Credentials created — save your secret now, it won't be shown again
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>CLIENT ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', wordBreak: 'break-all' }}>
                {newCred.clientId}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>CLIENT SECRET</div>
              <div style={{ fontFamily: 'monospace', fontSize: '13px', background: 'var(--card-bg)', padding: '8px 12px', borderRadius: '6px', border: '1px solid #e5e7eb', wordBreak: 'break-all' }}>
                {newCred.clientSecret}
              </div>
            </div>
          </div>
          <button onClick={() => setNewCred(null)}
            style={{ marginTop: '12px', padding: '6px 14px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>
            I've saved my credentials
          </button>
        </div>
      )}

      {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

      {/* Create new */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>Create new credential</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', alignItems: 'end' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. My App"
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Scopes</label>
            <select value={newScopes} onChange={e => setNewScopes(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', background: 'var(--card-bg)', boxSizing: 'border-box' }}>
              <option value="read">Read only</option>
              <option value="read,write">Read + Write</option>
              <option value="read,write,delete">Full access</option>
            </select>
          </div>
          <button onClick={createCred} disabled={creating || !newName}
            style={{ padding: '9px 20px', background: creating || !newName ? '#e5e7eb' : '#1a6ef5', color: creating || !newName ? '#9a9a9a' : '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: creating || !newName ? 'not-allowed' : 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
            {creating ? 'Creating...' : '+ Generate'}
          </button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '10px 0 0' }}>Maximum 5 credentials per account</p>
      </div>

      {/* Existing credentials */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>
          Your credentials <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>({creds.length}/5)</span>
        </h3>
        {loading ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>
        ) : creds.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No credentials yet — create one above</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {creds.map(c => (
              <div key={c.id} style={{ padding: '14px', border: '1px solid #f3f4f6', borderRadius: '8px', display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{c.name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{c.scopes}</div>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  <div style={{ color: '#111', marginBottom: '2px' }}>{c.client_id}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Secret: {c.client_secret_preview}</div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  <div>{c.is_active ? '🟢 Active' : '🔴 Disabled'}</div>
                  <div style={{ marginTop: '2px' }}>{c.last_used_at ? 'Last used: ' + new Date(c.last_used_at).toLocaleDateString('en-GB') : 'Never used'}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => toggleCred(c.id, !c.is_active)}
                    style={{ padding: '5px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                    {c.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button onClick={() => deleteCred(c.id)}
                    style={{ padding: '5px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage example */}
      <div style={{ background: '#0a1628', borderRadius: '12px', padding: '20px', marginTop: '20px', color: '#e5e7eb' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 12px' }}>Usage example</h3>
        <pre style={{ margin: 0, fontSize: '12px', color: '#a5f3fc', overflow: 'auto' }}>{`curl https://sws.geig.co.uk/api/packages/list \\
  -H "X-Client-ID: gsws_your_client_id" \\
  -H "X-Client-Secret: your_client_secret"`}</pre>
        <p style={{ fontSize: '11px', color: '#6b7280', margin: '10px 0 0' }}>
          API key authentication is in addition to session-based auth. See API Reference for full documentation.
        </p>
      </div>
    </div>
  )
}
