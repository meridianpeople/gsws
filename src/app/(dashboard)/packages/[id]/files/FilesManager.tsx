'use client'
import { useState } from 'react'

export default function FilesManager({ packageId, domainName, ftpUsers, ftpCredentials, webInfo, filePerms }: {
  packageId: string
  domainName: string
  ftpUsers: any[]
  ftpCredentials: any[]
  webInfo: any
  filePerms: any
}) {
  const [tab, setTab] = useState<'ftp' | 'permissions'>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '')
      if (hash === 'permissions') return 'permissions'
    }
    return 'ftp'
  })
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState('')
  const [fixingPerms, setFixingPerms] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  function switchTab(newTab: 'ftp' | 'permissions') {
    setTab(newTab)
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', window.location.pathname + '#' + newTab)
    }
  }

  const primaryCreds = ftpCredentials[0] || {}
  const primaryFtpUser = ftpUsers[0] || {}

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

  const ftpServer = webInfo.ftpserver || 'ftp.gb.stackcp.com'
  const homeDir = webInfo.homeDirectory || '/'
  const permFailures = Array.isArray(filePerms?.failures) ? filePerms.failures : []
  const hasPermIssues = permFailures.length > 0 || filePerms?.publicHtml === 1 || filePerms?.root === 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Quick access grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: '📁', label: 'File Manager', desc: 'Browse files via FTP client', action: () => window.open(`ftp://${ftpServer}`, '_blank') },
          { icon: '⬆️', label: 'Upload via FTP', desc: `Connect to ${ftpServer}`, action: () => switchTab('ftp') },
          { icon: '🔑', label: 'File Permissions', desc: hasPermIssues ? `${permFailures.length} issues found` : 'All permissions OK', action: () => switchTab('permissions') },
        ].map(item => (
          <div key={item.label} onClick={item.action}
            style={{ padding: '16px', borderRadius: '10px', background: '#fff', border: '1px solid #ebebeb', cursor: 'pointer' }}>
            <p style={{ fontSize: '24px', marginBottom: '8px' }}>{item.icon}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{item.label}</p>
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '3px' }}>{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #ebebeb' }}>
        {[
          { key: 'ftp', label: '📡 FTP access' },
          { key: 'permissions', label: '🔒 File permissions' },
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

          {/* Primary FTP credentials */}
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
                        style={{ height: '24px', padding: '0 8px', background: '#1a3060', color: '#9a9a9a', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
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
              💡 Use any FTP client (FileZilla, Cyberduck, WinSCP) to connect. Use SFTP on port 22 for encrypted transfers.
            </div>
          </div>

          {/* FTP Users table */}
          <div className="gsws-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>FTP accounts ({ftpUsers.length})</h3>
            </div>
            {ftpUsers.length === 0 ? (
              <p style={{ fontSize: '13px', color: '#9a9a9a' }}>No FTP accounts found.</p>
            ) : (
              <table className="gsws-table">
                <thead>
                  <tr><th>Username</th><th>Home directory</th><th>Status</th><th>Last access</th></tr>
                </thead>
                <tbody>
                  {ftpUsers.map((u: any) => (
                    <tr key={u.Id}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{u.Username}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: '#9a9a9a' }}>{u.JailFrom || '/'}</td>
                      <td>
                        <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: u.Enabled ? '#eaf3de' : '#f7f7f7', color: u.Enabled ? '#3b6d11' : '#9a9a9a' }}>
                          {u.Enabled ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: '#9a9a9a' }}>
                        {u.UnlockedUntil ? new Date(u.UnlockedUntil).toLocaleDateString('en-GB') : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* FTP client guide */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '12px' }}>Recommended FTP clients</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {[
                { name: 'FileZilla', desc: 'Free, cross-platform', url: 'https://filezilla-project.org', icon: '🦎' },
                { name: 'Cyberduck', desc: 'Mac & Windows', url: 'https://cyberduck.io', icon: '🦆' },
                { name: 'WinSCP', desc: 'Windows only', url: 'https://winscp.net', icon: '🖥️' },
              ].map(client => (
                <a key={client.name} href={client.url} target="_blank"
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid #ebebeb', borderRadius: '8px', textDecoration: 'none' }}>
                  <span style={{ fontSize: '20px' }}>{client.icon}</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#0a0a0a' }}>{client.name}</p>
                    <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{client.desc}</p>
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
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>File permission checker</h3>
                <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>
                  Scans your files and flags any with incorrect permissions
                </p>
              </div>
              <button onClick={handleFixPermissions} disabled={fixingPerms}
                style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: fixingPerms ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: fixingPerms ? 0.7 : 1 }}>
                {fixingPerms ? 'Fixing…' : 'Fix all permissions'}
              </button>
            </div>

            {!filePerms ? (
              <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #d4d4d4', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Permission scan data not available. Click "Fix all permissions" to run a scan.</p>
              </div>
            ) : hasPermIssues ? (
              <div>
                <div style={{ padding: '12px 16px', background: '#faeeda', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: '#854f0b' }}>
                  ⚠️ {permFailures.length} file{permFailures.length !== 1 ? 's' : ''} with incorrect permissions detected.
                  {filePerms.publicHtml ? ' public_html directory permissions incorrect.' : ''}
                  {filePerms.root ? ' Root directory permissions incorrect.' : ''}
                </div>
                {permFailures.slice(0, 10).map((item: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#fcebeb', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', color: '#a32d2d', flex: 1, marginRight: '12px' }}>{item.file?.split('/').pop() || item.file}</span>
                    <span style={{ color: '#9a9a9a', flexShrink: 0 }}>current: {item.perms?.c} → recommended: {item.perms?.r}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '16px', background: '#eaf3de', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>✅</span>
                <p style={{ fontSize: '13px', color: '#3b6d11', fontWeight: 500 }}>All file permissions are correct.</p>
              </div>
            )}
          </div>

          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '12px' }}>Permission recommendations</h3>
            {[
              { path: 'Directories', perm: '755', desc: 'Owner can read/write/execute; others can read/execute' },
              { path: 'PHP/HTML files', perm: '644', desc: 'Owner can read/write; others can read only' },
              { path: 'Config files (wp-config.php)', perm: '600', desc: 'Owner can read/write only; others no access' },
              { path: '.htaccess', perm: '644', desc: 'Owner can read/write; others can read only' },
            ].map(r => (
              <div key={r.path} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 700, color: '#1a6ef5', width: '36px', flexShrink: 0 }}>{r.perm}</span>
                <span style={{ fontWeight: 500, color: '#0a0a0a', width: '200px', flexShrink: 0 }}>{r.path}</span>
                <span style={{ color: '#9a9a9a' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
