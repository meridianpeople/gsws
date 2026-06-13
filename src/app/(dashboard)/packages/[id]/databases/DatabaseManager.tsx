'use client'
import { useState } from 'react'

export default function DatabaseManager({ packageId, initialDatabases, storedDbs }: {
  packageId: string
  initialDatabases: any[]
  storedDbs: any[]
}) {
  const [databases, setDatabases] = useState(initialDatabases)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [newDb, setNewDb] = useState({ name: '', password: '' })
  const [createdDb, setCreatedDb] = useState<any>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState('')
  const [viewingDb, setViewingDb] = useState<any>(null)
  const [resettingPwd, setResettingPwd] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [showResetForm, setShowResetForm] = useState(false)

  function getPMAUrl(host: string, name: string) {
    return `https://pma.stackcp.com/?server=${encodeURIComponent(host)}&db=${encodeURIComponent(name)}`
  }

  function copyToClipboard(text: string, field: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleCreate() {
    if (!newDb.name) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/databases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDb),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create database')
      setCreatedDb(data.database)
      setNewDb({ name: '', password: '' })
      setShowCreate(false)
      // Refresh list
      const refreshRes = await fetch(`/api/packages/${packageId}/databases`)
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json()
        setDatabases(refreshData.databases || databases)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function handleResetPassword(d: any) {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    if (!d.mysqlUserId) {
      setError('MySQL user ID not found')
      return
    }
    setResettingPwd(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/databases`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: d.mysqlUserId, password: newPassword }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to reset password')
      setSuccess(`Password updated for ${d.name}`)
      setNewPassword('')
      setShowResetForm(false)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setResettingPwd(false)
    }
  }

  async function handleDelete(d: any) {
    if (!confirm(`Delete database ${d.name}? This cannot be undone.`)) return
    setDeleting(d.id)
    try {
      const res = await fetch(`/api/packages/${packageId}/databases`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dbId: d.id, dbName: d.name }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setDatabases(dbs => dbs.filter(db => db.id !== d.id))
      setSuccess(`Database ${d.name} deleted`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Created database credentials - show once */}
      {createdDb && (
        <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '2px solid #1a6ef5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>🎉</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Database created successfully!</p>
              <p style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>⚠️ Save these credentials now — the password will not be shown again.</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Database name', value: createdDb.name, field: 'name' },
              { label: 'Username', value: createdDb.username, field: 'user' },
              { label: 'Password', value: createdDb.password, field: 'pass' },
              { label: 'Host', value: createdDb.host, field: 'host' },
              { label: 'Port', value: '3306', field: 'port' },
            ].map(item => (
              <div key={item.field} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#1a2840', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6699cc', width: '120px' }}>{item.label}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>{item.value}</span>
                <button onClick={() => copyToClipboard(item.value, item.field)}
                  style={{ height: '24px', padding: '0 10px', background: copied === item.field ? '#3b6d11' : '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  {copied === item.field ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
            <a href={getPMAUrl(createdDb.host, createdDb.name)} target="_blank"
              style={{ height: '32px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Open phpMyAdmin ↗
            </a>
            <button onClick={() => setCreatedDb(null)}
              style={{ height: '32px', padding: '0 14px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #2a3a50', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              I've saved the credentials
            </button>
          </div>
        </div>
      )}

      {/* Create form */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{databases.length} database{databases.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowCreate(s => !s)}
          style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Create database
        </button>
      </div>

      {showCreate && (
        <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Create MySQL database</h3>
          <div className="gsws-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Database name</label>
              <input value={newDb.name} onChange={e => setNewDb(d => ({ ...d, name: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') }))}
                placeholder="my_database"
                style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>Letters, numbers and underscores only</p>
            </div>
            <div>
              <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Password (leave blank to auto-generate)</label>
              <input value={newDb.password} onChange={e => setNewDb(d => ({ ...d, password: e.target.value }))}
                placeholder="Auto-generated if empty"
                style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
          </div>
          <div style={{ padding: '10px 12px', background: '#faeeda', borderRadius: '6px', fontSize: '12px', color: '#854f0b', marginBottom: '12px' }}>
            ⚠️ The database password will only be shown once after creation. Make sure to save it.
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleCreate} disabled={creating || !newDb.name}
              style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: creating || !newDb.name ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !newDb.name ? 0.5 : 1 }}>
              {creating ? 'Creating…' : 'Create database'}
            </button>
            <button onClick={() => setShowCreate(false)}
              style={{ height: '32px', padding: '0 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Connection info */}
      {databases.length > 0 && (
        <div className="gsws-card">
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Connection details</h3>
          {[
            ['Host', databases[0]?.host || 'shareddb.hosting.stackcp.net'],
            ['Port', '3306'],
            ['phpMyAdmin', 'pma.stackcp.com'],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', fontWeight: 500, color: 'var(--text-primary)' }}>{value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Databases table */}
      {databases.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '10px' }}>🗄️</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>No databases</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Create your first MySQL database</p>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
          <table className="gsws-table">
            <thead>
              <tr><th>Name</th><th>Host</th><th>Size used</th><th>Quota</th><th></th></tr>
            </thead>
            <tbody>
              {databases.map((d: any) => (
                <tr key={d.id}>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{d.name}</td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{d.host}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.quotaUsed ? `${Number(d.quotaUsed).toFixed(1)} MB` : '—'}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.quotaMb ? `${d.quotaMb} MB` : 'Unlimited'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => { setViewingDb(viewingDb?.id === d.id ? null : d); setShowResetForm(false); setNewPassword('') }}
                        style={{ padding: '0 10px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid #1a6ef5', borderRadius: '4px', fontSize: '11px', color: '#1a6ef5', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>
                        View credentials
                      </button>
                      <button onClick={() => { setViewingDb(d); setShowResetForm(true); setNewPassword('') }}
                        style={{ padding: '0 10px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid #854f0b', borderRadius: '4px', fontSize: '11px', color: '#854f0b', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Change password
                      </button>
                      <a href={getPMAUrl(d.host, d.name)} target="_blank"
                        style={{ padding: '0 10px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '11px', color: '#5a5a5a', background: 'var(--card-bg)', textDecoration: 'none' }}>
                        phpMyAdmin ↗
                      </a>
                      <button onClick={() => handleDelete(d)} disabled={deleting === d.id}
                        style={{ padding: '0 10px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {deleting === d.id ? '…' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Credentials viewer */}
      {viewingDb && (
        <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '1px solid #1a3060' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>🔑 Database credentials — {viewingDb.name}</p>
            <button onClick={() => setViewingDb(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '18px' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { label: 'Database name', value: viewingDb.name },
              { label: 'Username', value: viewingDb.name },
              { label: 'Host', value: viewingDb.host },
              { label: 'Port', value: '3306' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#1a2840', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6699cc', width: '120px' }}>{item.label}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>{item.value}</span>
                <button onClick={() => copyToClipboard(item.value, item.label)}
                  style={{ height: '24px', padding: '0 10px', background: copied === item.label ? '#3b6d11' : '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  {copied === item.label ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
            <div style={{ padding: '10px 12px', background: '#1a2840', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#6699cc' }}>Password</span>
                <button onClick={() => setShowResetForm(s => !s)}
                  style={{ height: '22px', padding: '0 10px', background: '#1a3060', color: '#5599ff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Reset password
                </button>
              </div>
              {showResetForm ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    style={{ flex: 1, height: '30px', border: '1px solid #2a3a50', borderRadius: '4px', fontSize: '12px', padding: '0 8px', background: '#0a1628', color: '#fff', fontFamily: 'inherit' }}
                  />
                  <button onClick={() => handleResetPassword(viewingDb)} disabled={resettingPwd}
                    style={{ height: '30px', padding: '0 12px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    {resettingPwd ? '…' : 'Save'}
                  </button>
                  <button onClick={() => { setShowResetForm(false); setNewPassword('') }}
                    style={{ height: '30px', padding: '0 10px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid #2a3a50', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Click "Reset password" to set a new database password.</p>
              )}
            </div>
          </div>
          <div style={{ marginTop: '12px' }}>
            <a href={getPMAUrl(viewingDb.host, viewingDb.name)} target="_blank"
              style={{ height: '32px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              Open phpMyAdmin ↗
            </a>
          </div>
        </div>
      )}
    </div>
  )
}