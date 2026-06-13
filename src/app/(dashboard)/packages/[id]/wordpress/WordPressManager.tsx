'use client'
import { useState } from 'react'

export default function WordPressManager({ packageId, domainName, wpVersion, wpSettings, plugins, themes, admins, staging, updatesAvailable, wizardRequired }: {
  packageId: string
  domainName: string
  wpVersion: any
  wpSettings: any
  plugins: any[]
  themes: any[]
  admins: any[]
  wizardRequired: boolean
  staging: any[]
  updatesAvailable: any[]
}) {
  const [tab, setTab] = useState<'overview' | 'plugins' | 'themes' | 'users' | 'settings' | 'staging' | 'search'>('overview')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [pluginList, setPluginList] = useState(plugins)
  const [themeList, setThemeList] = useState(themes)
  const [settings, setSettings] = useState(wpSettings)
  const [savingSettings, setSavingSettings] = useState(false)
  const [searchReplace, setSearchReplace] = useState({ search: '', replace: '' })
  const [searching, setSearching] = useState(false)
  const [wizardStep, setWizardStep] = useState(wizardRequired)
  const [wizardForm, setWizardForm] = useState({ blogname: '', adminEmail: '', adminPassword: '', adminUser: '' })
  const [wizardSaving, setWizardSaving] = useState(false)
  const [wizardError, setWizardError] = useState('')

  function switchTab(t: typeof tab) {
    setTab(t)
    history.replaceState(null, '', window.location.pathname + '#wp-' + t)
  }

  async function post(path: string, body: any) {
    const res = await fetch(`/api/packages/${packageId}/wordpress/${path}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed')
    return data
  }

  async function handleUpdatePlugin(plugin: any) {
    setUpdating(plugin.name)
    try {
      await post('update', {})
      setSuccess(`Update queued for ${plugin.title}. Refresh in 1-2 minutes to see the new version.`)
      setTimeout(() => setSuccess(''), 8000)
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 4000) }
    setUpdating(null)
  }

  async function handleTogglePlugin(plugin: any) {
    setUpdating(plugin.name)
    const newStatus = plugin.status === 'active' ? 'inactive' : 'active'
    try {
      await post('plugins', { type: newStatus === 'active' ? 'activate' : 'deactivate', name: plugin.name })
      setPluginList(list => list.map(p => p.name === plugin.name ? { ...p, status: newStatus } : p))
      setSuccess(`${plugin.title} ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message); setTimeout(() => setError(''), 4000) }
    setUpdating(null)
  }

  async function handleUpdateCore() {
    setUpdating('core')
    try {
      await post('update', {})
      setSuccess('WordPress core update started')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setUpdating(null)
  }

  async function handleSaveSettings() {
    setSavingSettings(true)
    try {
      await post('settings', settings)
      setSuccess('WordPress settings saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSavingSettings(false)
  }

  async function handleSearchReplace() {
    if (!searchReplace.search) return
    setSearching(true)
    try {
      await post('searchreplace', searchReplace)
      setSuccess(`Replaced "${searchReplace.search}" with "${searchReplace.replace}"`)
      setSearchReplace({ search: '', replace: '' })
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setSearching(false)
  }

  async function handleActivateTheme(theme: any) {
    setUpdating(theme.name)
    try {
      await post('themes', { type: 'activate', name: theme.name })
      setThemeList(list => list.map(t => ({ ...t, status: t.name === theme.name ? 'active' : (t.status === 'active' ? 'inactive' : t.status) })))
      setSuccess(`${theme.title} activated`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setUpdating(null)
  }

  async function handleUpdateTheme(theme: any) {
    setUpdating(theme.name)
    try {
      await post('update', {})
      setSuccess(`Update queued for ${theme.title}. Refresh in 1-2 minutes to confirm.`)
      setTimeout(() => setSuccess(''), 8000)
    } catch (err: any) { setError(err.message) }
    setUpdating(null)
  }

  const activePlugins = pluginList.filter(p => p.status === 'active').length
  const pluginUpdates = pluginList.filter(p => p.update === 'available').length
  const themeUpdates = themeList.filter(t => t.update === 'available').length
  const activeTheme = themeList.find(t => t.status === 'active')

  async function handleWizardSetup() {
    setWizardSaving(true); setWizardError('')
    try {
      // Set site settings
      const settingsRes = await fetch(`/api/packages/${packageId}/wordpress/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'settings', blogname: wizardForm.blogname }),
      })
      if (!settingsRes.ok) throw new Error('Failed to set site name')

      // Create admin user if provided
      if (wizardForm.adminUser && wizardForm.adminEmail && wizardForm.adminPassword) {
        await fetch(`/api/packages/${packageId}/wordpress/settings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'admin',
            username: wizardForm.adminUser,
            email: wizardForm.adminEmail,
            password: wizardForm.adminPassword,
          }),
        })
      }
      setWizardStep(false)
    } catch (e: any) {
      setWizardError(e.message)
    } finally {
      setWizardSaving(false)
    }
  }

  if (wizardStep) {
    return (
      <div style={{ maxWidth: '520px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Set up WordPress</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Complete the initial setup for your WordPress site</p>
        </div>
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '24px' }}>
          {wizardError && <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{wizardError}</div>}
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Site name</label>
              <input value={wizardForm.blogname} onChange={e => setWizardForm(f => ({ ...f, blogname: e.target.value }))}
                placeholder="My WordPress Site"
                style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ borderTop: '1px solid var(--card-border)', paddingTop: '16px' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#444', margin: '0 0 12px' }}>WordPress admin account</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                <input value={wizardForm.adminUser} onChange={e => setWizardForm(f => ({ ...f, adminUser: e.target.value }))}
                  placeholder="Username"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input value={wizardForm.adminEmail} onChange={e => setWizardForm(f => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="Admin email" type="email"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
                <input value={wizardForm.adminPassword} onChange={e => setWizardForm(f => ({ ...f, adminPassword: e.target.value }))}
                  placeholder="Admin password" type="password"
                  style={{ width: '100%', height: '38px', padding: '0 12px', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={handleWizardSetup} disabled={wizardSaving || !wizardForm.blogname}
              style={{ width: '100%', height: '44px', background: wizardSaving ? '#ccc' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: wizardSaving ? 'not-allowed' : 'pointer' }}>
              {wizardSaving ? 'Setting up...' : 'Complete setup'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'WP version', value: wpVersion.current || '—', icon: '🌐', alert: !wpVersion.isLatest },
          { label: 'Active plugins', value: `${activePlugins}/${pluginList.length}`, icon: '🔌', alert: pluginUpdates > 0 },
          { label: 'Active theme', value: activeTheme?.title || '—', icon: '🎨', alert: themeUpdates > 0 },
          { label: 'Updates', value: updatesAvailable.length > 0 ? `${updatesAvailable.length} available` : 'All up to date', icon: '🔄', alert: updatesAvailable.length > 0 },
        ].map(s => (
          <div key={s.label} style={{ padding: '12px 16px', borderRadius: '10px', background: s.alert ? '#faeeda' : '#fff', border: `1px solid ${s.alert ? '#f0c070' : '#ebebeb'}` }}>
            <p style={{ fontSize: '18px', marginBottom: '4px' }}>{s.icon}</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: s.alert ? '#854f0b' : '#0a0a0a' }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--card-border)', overflowX: 'auto' }}>
        {[
          { key: 'overview', label: '🏠 Overview' },
          { key: 'plugins', label: `🔌 Plugins (${pluginUpdates > 0 ? `${pluginUpdates} update${pluginUpdates > 1 ? 's' : ''}` : pluginList.length})` },
          { key: 'themes', label: `🎨 Themes (${themeUpdates > 0 ? `${themeUpdates} update${themeUpdates > 1 ? 's' : ''}` : themeList.length})` },
          { key: 'users', label: `👤 Users (${admins.length})` },
          { key: 'settings', label: '⚙️ Settings' },
          { key: 'staging', label: '🧪 Staging' },
          { key: 'search', label: '🔍 Search & Replace' },
        ].map(t => (
          <button key={t.key} onClick={() => switchTab(t.key as any)}
            style={{ padding: '8px 14px', fontSize: '12.5px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#1a6ef5' : '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.key ? '#1a6ef5' : 'transparent'}`, marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Updates banner */}
          {updatesAvailable.length > 0 && (
            <div style={{ padding: '16px 20px', background: '#faeeda', borderRadius: '10px', border: '1px solid #f0c070' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#854f0b' }}>⚠️ {updatesAvailable.length} update{updatesAvailable.length > 1 ? 's' : ''} available</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {wpVersion.update && (
                    <button onClick={handleUpdateCore} disabled={updating === 'core'}
                      style={{ height: '28px', padding: '0 12px', background: '#854f0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {updating === 'core' ? 'Updating…' : `Update WP to ${wpVersion.update}`}
                    </button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {updatesAvailable.map((u, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#854f0b' }}>
                    <span>{u.type === 'core' ? '🌐' : u.type === 'plugin' ? '🔌' : '🎨'}</span>
                    <span>{u.name}</span>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>{u.type}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Site info */}
            <div className="gsws-card">
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Site information</h3>
              {[
                ['Site name', wpSettings.blogname || '—'],
                ['Tagline', wpSettings.blogdescription || '—'],
                ['Site URL', wpSettings.siteurl || '—'],
                ['WP version', wpVersion.current || '—'],
                ['Multisite', wpVersion.isMultisite ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 500, color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div className="gsws-card">
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Quick actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {[
                  { label: '🔑 WordPress Admin', desc: 'Log in to WP dashboard', action: () => window.open(`${wpVersion.siteURL}/wp-admin`, '_blank') },
                  { label: '🔌 Manage plugins', desc: `${activePlugins} active, ${pluginUpdates} updates`, action: () => switchTab('plugins') },
                  { label: '🎨 Manage themes', desc: `Active: ${activeTheme?.title || '—'}`, action: () => switchTab('themes') },
                  { label: '👤 Manage users', desc: `${admins.length} admin${admins.length !== 1 ? 's' : ''}`, action: () => switchTab('users') },
                  { label: '🧪 Staging site', desc: staging.length > 0 ? 'Staging active' : 'Create staging', action: () => switchTab('staging') },
                ].map(a => (
                  <button key={a.label} onClick={a.action}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                    <div>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{a.label}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{a.desc}</p>
                    </div>
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PLUGINS */}
      {tab === 'plugins' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{pluginList.length} plugins · {activePlugins} active · {pluginUpdates} updates</p>
            {pluginUpdates > 0 && (
              <button onClick={async () => {
                setUpdating('all')
                try {
                  await post('update', {})
                  setSuccess(`Updates queued for ${pluginUpdates} plugin${pluginUpdates > 1 ? 's' : ''}. Refresh in 1-2 minutes to confirm.`)
                  setTimeout(() => setSuccess(''), 8000)
                } catch (err: any) { setError(err.message) }
                setUpdating(null)
              }} style={{ height: '32px', padding: '0 14px', background: '#854f0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                Update all ({pluginUpdates})
              </button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {pluginList.map(plugin => (
              <div key={plugin.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', border: `1px solid ${plugin.update === 'available' ? '#f0c070' : '#ebebeb'}`, borderRadius: '8px', background: plugin.update === 'available' ? '#fffbf0' : '#fff' }}>
                <div style={{ flex: 1, marginRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{plugin.title}</span>
                    <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 500, background: plugin.status === 'active' ? '#eaf3de' : '#f7f7f7', color: plugin.status === 'active' ? '#3b6d11' : '#9a9a9a' }}>{plugin.status}</span>
                    {plugin.update === 'available' && <span style={{ padding: '1px 6px', borderRadius: '10px', fontSize: '10px', fontWeight: 500, background: '#faeeda', color: '#854f0b' }}>v{plugin.update_version} available</span>}
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>v{plugin.version}</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {plugin.update === 'available' && (
                    <button onClick={() => handleUpdatePlugin(plugin)} disabled={updating === plugin.name}
                      style={{ height: '26px', padding: '0 10px', background: '#854f0b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: updating === plugin.name ? 0.7 : 1 }}>
                      {updating === plugin.name ? '…' : 'Update'}
                    </button>
                  )}
                  <button onClick={() => handleTogglePlugin(plugin)} disabled={updating === plugin.name}
                    style={{ height: '26px', padding: '0 10px', background: plugin.status === 'active' ? '#fcebeb' : '#eaf3de', color: plugin.status === 'active' ? '#a32d2d' : '#3b6d11', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {plugin.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THEMES */}
      {tab === 'themes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{themeList.length} themes installed</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {themeList.map(theme => (
              <div key={theme.name} style={{ padding: '14px', background: 'var(--card-bg)', border: `2px solid ${theme.status === 'active' ? '#1a6ef5' : theme.update === 'available' ? '#f0c070' : '#ebebeb'}`, borderRadius: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🎨</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{theme.title}</p>
                    <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>v{theme.version}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500, background: theme.status === 'active' ? '#e8f0fe' : '#f7f7f7', color: theme.status === 'active' ? '#1a6ef5' : '#9a9a9a' }}>
                    {theme.status === 'active' ? 'Active' : theme.status === 'parent' ? 'Parent' : 'Inactive'}
                  </span>
                  {theme.update === 'available' && (
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500, background: '#faeeda', color: '#854f0b' }}>
                      v{theme.update_version}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {theme.status !== 'active' && theme.status !== 'parent' && (
                    <button onClick={() => handleActivateTheme(theme)} disabled={updating === theme.name}
                      style={{ flex: 1, height: '26px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Activate
                    </button>
                  )}
                  {theme.update === 'available' && (
                    <button onClick={() => handleUpdateTheme(theme)} disabled={updating === theme.name}
                      style={{ flex: 1, height: '26px', background: '#854f0b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      Update
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{admins.length} WordPress admin{admins.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
            {admins.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No admin users found.</div>
            ) : (
              <table className="gsws-table">
                <thead><tr><th>Username</th><th>Display name</th><th>Email</th><th>Role</th><th>Registered</th></tr></thead>
                <tbody>
                  {admins.map((u: any) => (
                    <tr key={u.ID}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{u.user_login}</td>
                      <td style={{ fontSize: '12px', color: '#5a5a5a' }}>{u.display_name}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>{u.user_email}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#e8f0fe', color: '#185fa5' }}>{u.roles}</span></td>
                      <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{new Date(u.user_registered).toLocaleDateString('en-GB')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>WordPress site settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { key: 'blogname', label: 'Site name', placeholder: 'My WordPress Site' },
                { key: 'blogdescription', label: 'Tagline', placeholder: 'Just another WordPress site' },
                { key: 'siteurl', label: 'WordPress address (URL)', placeholder: 'https://example.com' },
                { key: 'home', label: 'Site address (URL)', placeholder: 'https://example.com' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>{field.label}</label>
                  <input value={settings[field.key] || ''} onChange={e => setSettings((s: any) => ({ ...s, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              ))}
            </div>
            <button onClick={handleSaveSettings} disabled={savingSettings}
              style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: savingSettings ? 0.7 : 1 }}>
              {savingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </div>
        </div>
      )}

      {/* STAGING */}
      {tab === 'staging' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>🧪 Staging environment</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Create a staging copy of your site to test changes before pushing to production.
            </p>
            {staging.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {staging.map((s: any, i: number) => (
                  <div key={i} style={{ padding: '14px 16px', background: '#eaf3de', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#3b6d11' }}>Staging site active</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.url || s.domain || 'Staging URL available'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {s.url && <a href={s.url} target="_blank" style={{ height: '28px', padding: '0 12px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '11px', fontWeight: 600, textDecoration: 'none' }}>Visit ↗</a>}
                      <button onClick={async () => {
                        if (!confirm('Push staging to live? This will overwrite your live site.')) return
                        try {
                          await post('staging', { type: 'staging' })
                          setSuccess('Pushing staging to live. This may take a few minutes.')
                          setTimeout(() => setSuccess(''), 8000)
                        } catch (err: any) { setError(err.message) }
                      }} style={{ height: '28px', padding: '0 12px', background: '#166534', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>
                        Push to live ↑
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div style={{ padding: '16px', background: 'var(--card-bg-elevated)', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  No staging environment active. Creating a staging site clones your live site.
                </div>
                <button onClick={async () => {
                  try {
                    await post('staging', { type: 'live' })
                    setSuccess('Staging site creation started — cloning live to staging. This may take a few minutes.')
                    setTimeout(() => setSuccess(''), 8000)
                  } catch (err: any) { setError(err.message) }
                }} style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Clone live → staging
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH & REPLACE */}
      {tab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>🔍 Search & Replace</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Search and replace text across your entire WordPress database. Useful for URL migrations.
            </p>
            <div style={{ padding: '12px 16px', background: '#fcebeb', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#a32d2d' }}>
              ⚠️ This operation modifies your database directly. Always take a backup first.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Search for</label>
                <input value={searchReplace.search} onChange={e => setSearchReplace(s => ({ ...s, search: e.target.value }))}
                  placeholder="http://old-domain.com"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Replace with</label>
                <input value={searchReplace.replace} onChange={e => setSearchReplace(s => ({ ...s, replace: e.target.value }))}
                  placeholder="https://new-domain.com"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
            </div>
            <button onClick={handleSearchReplace} disabled={searching || !searchReplace.search}
              style={{ height: '34px', padding: '0 20px', background: '#a32d2d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !searchReplace.search ? 0.5 : 1 }}>
              {searching ? 'Running…' : 'Run search & replace'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
