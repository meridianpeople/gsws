'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const APP_ICONS: Record<string, string> = {
  wordpress: '🌐', joomla: '🟠', drupal: '💧', prestashop: '🛒',
  opencart: '🛍️', woocommerce: '🛒', laravel: '🔴', laravel12: '🔴',
  moodle: '📚', mediawiki: '📖', phpbb: '💬', matomo: '📊',
  mautic: '📧', suitecrm: '👥', vtiger: '💼', dolibarr: '📋',
  invoiceninja: '💰', invoiceplane: '🧾', concrete5: '🏗️',
  craftcms: '✏️', typo3: '⚙️', processwire: '🔧', modx: '🎯',
  silverstripe: '🌊', wintercms: '❄️', backdrop: '🎭',
  flarum: '💭', mybb: '🗣️', roundcube: '📬', squirrelmail: '📭',
  freshrss: '📰', kanboard: '📌', osticket: '🎫', mantisbt: '🐛',
  cachet: '📡', freescout: '🦅', limesurvey: '📝', piwigo: '🖼️',
  coppermine: '🖼️', zenphoto: '📷', phpmyfaq: '❓',
  cmsmadesimple: '✂️', geeklog: '📰', e107: '📰', textpattern: '✍️',
  b2evolution: '✍️', serendipity: '✍️', elgg: '🤝', buddypress: '👥',
  gnusocial: '🌐', una: '🤝', phpfusion: '⚡', phpnuke: '💥',
  cubecart: '📦', oscommerce: '🏪', zencart: '🛒', agoracart: '🏪',
  abantecart: '🛒', oscomphoenix: '🔥', cakephp: '🎂', slim: '🔵',
  dotnetcoreapi: '💙', dotnetcoremvc: '💙', sendportal: '📨',
  phplist: '📬', phpmailer: '✉️', reviveadserver: '📢',
  bigtreecms: '🌳', fengoffice: '🏢', bamboo: '💳',
  webcalendar: '📅', teampass: '🔑', openwebanalytics: '📈',
}

const APP_CATEGORIES: Record<string, string[]> = {
  'CMS': ['wordpress', 'joomla', 'drupal', 'concrete5', 'craftcms', 'typo3', 'processwire', 'modx', 'silverstripecms', 'wintercms', 'backdrop', 'bigtreecms', 'cmsmadesimple', 'geeklog', 'e107', 'textpattern', 'b2evolution', 'serendipity', 'phpnuke', 'phpfusion'],
  'E-commerce': ['prestashop', 'opencart', 'cubecart', 'oscommerce', 'zencart', 'agoracart', 'abantecart', 'oscomphoenix'],
  'Forums': ['phpbb', 'mybb', 'simplemachinesforum', 'flarum', 'elgg', 'buddypress', 'gnusocial', 'una'],
  'CRM & Business': ['suitecrm', 'vtiger', 'dolibarr', 'invoiceninja', 'invoiceplane', 'bamboo', 'fengoffice', 'mautic', 'sendportal'],
  'LMS & Education': ['moodle', 'formalms', 'limesurvey', 'tcexam', 'gibbon', 'xerte'],
  'Wiki & Docs': ['mediawiki', 'phpmyfaq', 'freescout'],
  'Analytics': ['matomo', 'openwebanalytics'],
  'Gallery': ['piwigo', 'coppermine', 'zenphoto'],
  'Helpdesk': ['osticket', 'mantisbt', 'troubleticketexpress', 'cachet'],
  'Email & Tools': ['roundcube', 'squirrelmail', 'phpmailer', 'phplist'],
  'Dev Frameworks': ['laravel', 'laravel12', 'cakephp', 'slim', 'dotnetcoreapi', 'dotnetcoremvc'],
  'Other': ['freshrss', 'kanboard', 'webcalendar', 'teampass', 'reviveadserver', 'phproject', 'gnusocial'],
}

export default function ApplicationsManager({ packageId, domainName, oneClicks, installed }: {
  packageId: string
  domainName: string
  oneClicks: any
  installed: any[]
}) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [installing, setInstalling] = useState<string | null>(null)
  const [showInstall, setShowInstall] = useState<any>(null)
  const [installForm, setInstallForm] = useState({ directory: '', adminEmail: '', adminUser: 'admin', adminPassword: '' })
  const [success, setSuccess] = useState('')
  const [installResult, setInstallResult] = useState<any>(null)
  const [error, setError] = useState('')

  const apps = Object.entries(oneClicks)
    .filter(([, info]: any) => info.knownInformation)
    .map(([name, info]: any) => ({ name, ...info }))

  const filtered = apps.filter(app => {
    const matchSearch = !search || app.displayName.toLowerCase().includes(search.toLowerCase()) || app.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'All' || (APP_CATEGORIES[category] || []).includes(app.name)
    return matchSearch && matchCat
  })

  const categories = ['All', ...Object.keys(APP_CATEGORIES)]

  async function handleInstall() {
    if (!showInstall) return
    setInstalling(showInstall.name)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/applications/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oneclick: showInstall.name,
          domain: domainName,
          httpsDomain: domainName,
          directory: installForm.directory || '/',
          installInput: {
            admin_email: installForm.adminEmail,
            admin_user: installForm.adminUser,
            admin_password: installForm.adminPassword,
          }
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Installation failed')
      // Get temp URL from web info
      const webRes = await fetch(`/api/packages/${packageId}/web/info`)
      const webData = await webRes.json().catch(() => ({}))
      const tempUrls = webData.temporaryUrls || {}
      const tempUrl = tempUrls[domainName] || Object.values(tempUrls)[0] || ''

      const params = new URLSearchParams({
        app: showInstall.name,
        appName: showInstall.displayName,
        directory: installForm.directory || '/',
        domain: domainName,
        tempUrl,
        ...(data.result?.database ? { dbName: data.result.database.name, dbServer: data.result.database.server } : {}),
        ...(data.result?.user ? { dbUser: data.result.user.username, dbPassword: data.result.user.password } : {}),
      })
      setShowInstall(null)
      setInstallForm({ directory: '', adminEmail: '', adminUser: 'admin', adminPassword: '' })
      router.push(`/packages/${packageId}/applications/installed?${params.toString()}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setInstalling(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Install credentials */}
      {installResult && (
        <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '2px solid #1a6ef5' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{APP_ICONS[installResult.app?.name] || '📦'}</span>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>✅ {installResult.app?.displayName} installing!</p>
                <p style={{ fontSize: '11px', color: '#f87171', marginTop: '2px' }}>⚠️ Save these credentials now — shown only once</p>
              </div>
            </div>
            <button onClick={() => setInstallResult(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}>×</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'App URL', value: `https://${domainName}${installResult.directory}` },
              ...(installResult.database ? [
                { label: 'DB name', value: installResult.database.name },
                { label: 'DB server', value: installResult.database.server },
              ] : []),
              ...(installResult.user ? [
                { label: 'DB username', value: installResult.user.username },
                { label: 'DB password', value: installResult.user.password },
              ] : []),
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#1a2840', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6699cc', width: '100px', flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>{item.value}</span>
                <button onClick={() => navigator.clipboard.writeText(item.value)}
                  style={{ height: '22px', padding: '0 8px', background: '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                  Copy
                </button>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '12px' }}>
            Installation runs in background and may take a few minutes. Visit the URL above once complete.
          </p>
        </div>
      )}

      {/* Install modal */}
      {showInstall && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <span style={{ fontSize: '32px' }}>{APP_ICONS[showInstall.name] || '📦'}</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>Install {showInstall.displayName}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>on {domainName}</p>
              </div>
            </div>

            {showInstall.description && (
              <p style={{ fontSize: '12px', color: '#5a5a5a', marginBottom: '16px', lineHeight: 1.5 }}>{showInstall.description}</p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Install directory (leave empty for root)</label>
                <input value={installForm.directory} onChange={e => setInstallForm(f => ({ ...f, directory: e.target.value }))}
                  placeholder="e.g. /blog or /shop (leave empty for root)"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Admin email</label>
                <input type="email" value={installForm.adminEmail} onChange={e => setInstallForm(f => ({ ...f, adminEmail: e.target.value }))}
                  placeholder="admin@example.com"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>
              <div className="gsws-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Admin username</label>
                  <input value={installForm.adminUser} onChange={e => setInstallForm(f => ({ ...f, adminUser: e.target.value }))}
                    placeholder="admin"
                    style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Admin password</label>
                  <input type="password" value={installForm.adminPassword} onChange={e => setInstallForm(f => ({ ...f, adminPassword: e.target.value }))}
                    placeholder="Strong password"
                    style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
            </div>

            {showInstall.avg_install_time && (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                ⏱️ Average install time: ~{Math.round(showInstall.avg_install_time)} minutes
              </p>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleInstall} disabled={!!installing}
                style={{ flex: 1, height: '38px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: installing ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: installing ? 0.7 : 1 }}>
                {installing ? 'Installing…' : `Install ${showInstall.displayName}`}
              </button>
              <button onClick={() => setShowInstall(null)}
                style={{ height: '38px', padding: '0 16px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Installed apps */}
      {installed.length > 0 && (
        <div className="gsws-card">
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Installed applications ({installed.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {installed.map((app: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f0f9e8', border: '1px solid #c0dd97', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{APP_ICONS[app.softwareId || app.name] || '📦'}</span>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{app.softwareName || app.name}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{app.directory || '/'} · v{app.version || '—'}</p>
                  </div>
                </div>
                <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Installed</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and filter */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${apps.length} applications…`}
          style={{ flex: 1, height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', padding: '0 12px', fontFamily: 'inherit' }} />
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0 }}>{filtered.length} apps</span>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: category === cat ? '#1a6ef5' : '#f7f7f7', color: category === cat ? '#fff' : '#5a5a5a', border: `1px solid ${category === cat ? '#1a6ef5' : '#ebebeb'}`, cursor: 'pointer', fontFamily: 'inherit' }}>
            {cat}
          </button>
        ))}
      </div>

      {/* App grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {filtered.map(app => (
          <div key={app.name}
            style={{ padding: '16px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#1a6ef5'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(26,110,245,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ebebeb'; e.currentTarget.style.boxShadow = 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>{APP_ICONS[app.name] || '📦'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{app.displayName}</p>
                {app.latest && <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>v{app.latest}</p>}
              </div>
            </div>
            {app.description && (
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                {app.description}
              </p>
            )}
            <button onClick={() => setShowInstall(app)}
              style={{ height: '30px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', marginTop: 'auto' }}>
              Install
            </button>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No applications found matching your search.
          </div>
        )}
      </div>
    </div>
  )
}
