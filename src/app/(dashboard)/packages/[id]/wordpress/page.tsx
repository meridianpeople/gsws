import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import WordPressManager from './WordPressManager'

export default async function PackageWordPressPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  if (pkg.package_type !== 'wordpress') {
    return (
      <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>🌐</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Not a WordPress package</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>WordPress tools are only available on WordPress hosting packages.</p>
      </div>
    )
  }

  let wpVersion: any = {}
  let wpSettings: any = {}
  let plugins: any[] = []
  let themes: any[] = []
  let admins: any[] = []
  let staging: any[] = []
  let checksum: any = null

  try {
    const [verRes, settingsRes, pluginsRes, themesRes, adminsRes, stagingRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/wordpressVersion`),
      client.get(`/package/${id}/web/wordpressSettings`),
      client.get(`/package/${id}/web/wordpressPlugins`),
      client.get(`/package/${id}/web/wordpressThemes`),
      client.get(`/package/${id}/web/wordpressAdministrators`),
      client.get(`/package/${id}/web/wordpressStaging`),
    ])
    if (verRes.status === 'fulfilled') wpVersion = verRes.value.data || {}
    if (settingsRes.status === 'fulfilled') wpSettings = settingsRes.value.data || {}
    if (pluginsRes.status === 'fulfilled') plugins = pluginsRes.value.data?.plugins || []
    if (themesRes.status === 'fulfilled') themes = themesRes.value.data || []
    if (adminsRes.status === 'fulfilled') admins = adminsRes.value.data || []
    if (stagingRes.status === 'fulfilled') staging = stagingRes.value.data || []
  } catch {}

  const updatesAvailable = [
    ...(wpVersion.update ? [{ type: 'core', name: `WordPress ${wpVersion.update}` }] : []),
    ...plugins.filter(p => p.update === 'available').map(p => ({ type: 'plugin', name: p.title })),
    ...themes.filter(t => t.update === 'available').map(t => ({ type: 'theme', name: t.title })),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>WordPress</h2>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Manage WordPress for {pkg.domain_name}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {wpVersion.isLatest && (
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#eaf3de', color: '#3b6d11' }}>
              ✓ WordPress {wpVersion.current} — up to date
            </span>
          )}
          {wpVersion.siteURL && (
            <a href={wpVersion.siteURL + '/wp-admin'} target="_blank"
              style={{ height: '34px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              WP Admin ↗
            </a>
          )}
        </div>
      </div>

      <WordPressManager
        packageId={id}
        domainName={pkg.domain_name}
        wpVersion={wpVersion}
        wpSettings={wpSettings}
        plugins={plugins}
        themes={themes}
        admins={admins}
        staging={staging}
        updatesAvailable={updatesAvailable}
        wizardRequired={wpVersion.wizardRequired || false}
      />
    </div>
  )
}
