'use client'
import { useState } from 'react'

export default function FilesManager({ packageId, domainName, ftpUsers, ftpCredentials, webInfo, filePerms, initialSshKeys }: {
  packageId: string
  domainName: string
  ftpUsers: any[]
  ftpCredentials: any[]
  webInfo: any
  filePerms: any
  initialSshKeys: any[]
}) {
  const [tab, setTab] = useState<'ftp' | 'permissions' | 'ssh'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (['ftp','permissions','ssh'].includes(hash)) return hash as any
    }
    return 'ftp'
  })
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState('')
  const [fixingPerms, setFixingPerms] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [sshKeys, setSshKeys] = useState<any[]>(initialSshKeys)
  const [newKey, setNewKey] = useState({ key: '', handle: '' })
  const [addingKey, setAddingKey] = useState(false)
  const [showAddKey, setShowAddKey] = useState(false)

  const primaryCreds = ftpCredentials[0] || {}
  const primaryFtpUser = ftpUsers[0] || {}
  const ftpServer = webInfo.ftpserver || 'ftp.gb.stackcp.com'
  const homeDir = webInfo.homeDirectory || '/'
  const permFailures = Array.isArray(filePerms?.failures) ? filePerms.failures : []
  const hasPermIssues = permFailures.length > 0 || filePerms?.publicHtml === 1 || filePerms?.root === 1

  function switchTab(newTab: 'ftp' | 'permissions' | 'ssh') {
    setTab(newTab)
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', window.location.pathname + '#' + newTab)
    }
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(''), 2000)
  }

  async function handleFixPermissions() {
    setFixingPerms(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/files/permissions`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSuccess('File permissions fixed! Refreshing…')
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setFixingPerms(false)
    }
  }

  async function handleAddSshKey() {
    if (!newKey.key || !newKey.handle) return
    setAddingKey(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/files/sshkeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ add: [{ key: newKey.key.trim(), handle: newKey.handle }] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSshKeys(k => [...k, { key: newKey.key.trim(), handle: newKey.handle }])
      setNewKey({ key: '', handle: '' })
      setShowAddKey(false)
      setSuccess('SSH key added successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setAddingKey(false)
    }
  }

  async function handleRemoveSshKey(handle: string, index: number) {
    try {
      await fetch(`/api/packages/${packageId}/files/sshkeys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete: [handle] }),
      })
      setSshKeys(keys => keys.filter((_, j) => j !== index))
      setSuccess('SSH key removed')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const sshUsername = primaryFtpUser.Username || domainName

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Quick access */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: '📁', label: 'File Manager', desc: 'Browse files via FTP client', tab: 'ftp' },
          { icon: '🔒', label: 'File Permissions', desc: hasPermIssues ? `${permFailures.length} issues found` : 'All permissions OK', tab: 'permissions' },
          { icon: '🔑', label: 'SSH Access', desc: `${sshKeys.length} key${sshKeys.length !== 1 ? 's' : ''} configured`, tab: 'ssh' },
        ].map(item => (
          <div key={item.tab} onClick={() => switchTab(item.tab as any)}
            style={{ padding: '16px', borderRadius: '10px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', cursor: 'pointer' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.label}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--card-border)' }}>
        {[
          { key: 'ftp', label: '📡 FTP access' },
          { key: 'permissions', label: '🔒 File permissions' },
          { key: 'ssh', label: '🔑 SSH access' },
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key as any)}
            style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#1a6ef5' : '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.key ? '#1a6ef5' : 'transparent'}`, marginBottom: '-1px' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* FTP Tab */}
      {tab === 'ftp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '1px solid #1a3060' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>🔑 Primary FTP credentials</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { label: 'FTP server', value: ftpServer, key: 'server' },
                { label: 'Port', value: '21', key: 'port' },
                { label: 'Protocol', value: webInfo.ftpProtocol || 'FTP', key: 'proto' },
                { label: 'Username', value: primaryFtpUser.Username || domainName, key: 'user' },
                { label: 'Password', value: primaryCreds.password || '••••••••', key: 'pass', secret: true },
                { label: 'Home directory', value: homeDir, key: 'home' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#1a2840', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#6699cc', width: '120px', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>
                    {item.secret && !showPassword[item.key] ? '••••••••' : item.value}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    {item.secret && (
                      <button onClick={() => setShowPassword(s => ({ ...s, [item.key]: !s[item.key] }))}
                        style={{ height: '24px', padding: '0 8px', background: '#1a3060', color: 'var(--text-secondary)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {showPassword[item.key] ? 'Hide' : 'Show'}
                      </button>
                    )}
                    {item.value !== '••••••••' && (
                      <button onClick={() => copyToClipboard(item.value, item.key)}
                        style={{ height: '24px', padding: '0 8px', background: copied === item.key ? '#3b6d11' : '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                        {copied === item.key ? '✓' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '14px', padding: '10px 12px', background: '#1a2840', borderRadius: '6px', fontSize: '12px', color: '#6699cc' }}>
              💡 Use FileZilla, Cyberduck or WinSCP to connect. Use SFTP on port 22 for encrypted transfers.
            </div>
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>FTP accounts ({ftpUsers.length})</h3>
            {ftpUsers.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No FTP accounts found.</p>
            ) : (
              <table className="gsws-table">
                <thead>
                  <tr><th>Username</th><th>Home directory</th><th>Status</th><th>Last access</th></tr>
                </thead>
                <tbody>
                  {ftpUsers.map((u: any) => (
                    <tr key={u.Id}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{u.Username}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{u.JailFrom || '/'}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: u.Enabled ? '#eaf3de' : '#f7f7f7', color: u.Enabled ? '#3b6d11' : '#9a9a9a' }}>{u.Enabled ? 'Active' : 'Disabled'}</span></td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{u.UnlockedUntil ? new Date(u.UnlockedUntil).toLocaleDateString('en-GB') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Recommended FTP clients</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { name: 'FileZilla', desc: 'Free, cross-platform', url: 'https://filezilla-project.org', icon: '🦎' },
                { name: 'Cyberduck', desc: 'Mac & Windows', url: 'https://cyberduck.io', icon: '🦆' },
                { name: 'WinSCP', desc: 'Windows only', url: 'https://winscp.net', icon: '🖥️' },
              ].map(item => (
                <a key={item.name} href={item.url} target="_blank"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--card-border)', borderRadius: '8px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{item.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {tab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>File permission checker</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Scans your files and flags any with incorrect permissions</p>
              </div>
              <button onClick={handleFixPermissions} disabled={fixingPerms}
                style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: fixingPerms ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: fixingPerms ? 0.7 : 1 }}>
                {fixingPerms ? 'Fixing…' : 'Fix all permissions'}
              </button>
            </div>
            {!filePerms ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--card-border-hover)', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No permission data. Click "Fix all permissions" to scan.</p>
              </div>
            ) : hasPermIssues ? (
              <div>
                <div style={{ padding: '12px 16px', background: '#faeeda', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#854f0b' }}>
                  ⚠️ {permFailures.length} file{permFailures.length !== 1 ? 's' : ''} with incorrect permissions.
                </div>
                {permFailures.slice(0, 10).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fcebeb', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', color: '#a32d2d', flex: 1, marginRight: '12px' }}>{item.file?.split('/').pop() || item.file}</span>
                    <span style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>{item.perms?.c} → {item.perms?.r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#eaf3de', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: 500, color: '#3b6d11' }}>✅ All file permissions are correct.</p>
              </div>
            )}
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Permission recommendations</h3>
            {[
              { path: 'Directories', perm: '755', desc: 'Owner can read/write/execute; others can read/execute' },
              { path: 'PHP/HTML files', perm: '644', desc: 'Owner can read/write; others can read only' },
              { path: 'Config files', perm: '600', desc: 'Owner only' },
              { path: '.htaccess', perm: '644', desc: 'Owner can read/write; others can read only' },
            ].map(r => (
              <div key={r.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#1a6ef5', width: '36px', flexShrink: 0 }}>{r.perm}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', width: '160px', flexShrink: 0 }}>{r.path}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SSH Tab */}
      {tab === 'ssh' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '1px solid #1a3060' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>🔑 SSH connection details</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
              {[
                { label: 'SSH host', value: 'ssh.gb.stackcp.com', key: 'sshhost' },
                { label: 'Port', value: '22', key: 'sshport' },
                { label: 'Username', value: sshUsername, key: 'sshuser' },
                { label: 'Auth method', value: 'Public key', key: 'sshauth' },
              ].map(item => (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#1a2840', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#6699cc', width: '120px', flexShrink: 0 }}>{item.label}</span>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>{item.value}</span>
                  <button onClick={() => copyToClipboard(item.value, item.key)}
                    style={{ height: '24px', padding: '0 8px', background: copied === item.key ? '#3b6d11' : '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                    {copied === item.key ? '✓' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>
            <div style={{ padding: '10px 12px', background: '#1a2840', borderRadius: '6px', fontSize: '12px', color: '#6699cc' }}>
              💡 Connect: <span style={{ fontFamily: 'ui-monospace, monospace', color: '#fff' }}>ssh {sshUsername}@ssh.gb.stackcp.com</span>
            </div>
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>How to generate an SSH key pair</h3>
            {[
              { os: 'Linux / Mac', cmd: 'ssh-keygen -t ed25519 -C "your@email.com"' },
              { os: 'Windows (PowerShell)', cmd: 'ssh-keygen -t ed25519 -C "your@email.com"' },
            ].map(item => (
              <div key={item.os} style={{ marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>{item.os}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--card-bg-elevated)', borderRadius: '6px' }}>
                  <code style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-primary)' }}>{item.cmd}</code>
                  <button onClick={() => copyToClipboard(item.cmd, item.os)}
                    style={{ height: '24px', padding: '0 8px', background: copied === item.os ? '#3b6d11' : '#ebebeb', color: copied === item.os ? '#fff' : '#0a0a0a', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: '8px' }}>
                    {copied === item.os ? '✓' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Your public key will be at <code style={{ fontFamily: 'ui-monospace, monospace' }}>~/.ssh/id_ed25519.pub</code> — paste its contents below.
            </p>
          </div>

          <div className="gsws-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Public SSH keys ({sshKeys.length})</h3>
              <button onClick={() => setShowAddKey(s => !s)}
                style={{ height: '30px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                + Add public key
              </button>
            </div>

            {showAddKey && (
              <div style={{ padding: '16px', background: '#f7f9ff', border: '1px solid #d4e0ff', borderRadius: '8px', marginBottom: '14px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Public key (OpenSSH format)</label>
                  <textarea value={newKey.key} onChange={e => setNewKey(k => ({ ...k, key: e.target.value }))}
                    placeholder="ssh-ed25519 AAAA... your@email.com"
                    rows={4}
                    style={{ width: '100%', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', fontFamily: 'ui-monospace, monospace', padding: '8px 10px', boxSizing: 'border-box', resize: 'vertical' }} />
                </div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Label</label>
                  <input value={newKey.handle} onChange={e => setNewKey(k => ({ ...k, handle: e.target.value }))}
                    placeholder="e.g. My Laptop"
                    style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddSshKey} disabled={addingKey || !newKey.key || !newKey.handle}
                    style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newKey.key || !newKey.handle ? 0.5 : 1 }}>
                    {addingKey ? 'Adding…' : 'Add key'}
                  </button>
                  <button onClick={() => setShowAddKey(false)}
                    style={{ height: '32px', padding: '0 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {sshKeys.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed var(--card-border-hover)', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No SSH keys. Add a public key to enable SSH access.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sshKeys.map((k: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--card-bg-elevated)', borderRadius: '8px' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{k.handle}</p>
                      <p style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: 'var(--text-secondary)', marginTop: '2px' }}>{k.key?.substring(0, 50)}…</p>
                    </div>
                    <button onClick={() => handleRemoveSshKey(k.handle, i)}
                      style={{ padding: '0 10px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
