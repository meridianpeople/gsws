'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'

function InstalledContent({ packageId }: { packageId: string }) {
  const params = useSearchParams()
  const app = params.get('app') || ''
  const appName = params.get('appName') || app
  const directory = params.get('directory') || '/'
  const domain = params.get('domain') || ''
  const tempUrl = params.get('tempUrl') || ''
  const dbName = params.get('dbName') || ''
  const dbServer = params.get('dbServer') || ''
  const dbUser = params.get('dbUser') || ''
  const dbPassword = params.get('dbPassword') || ''

  const siteUrl = `https://${domain}${directory === '/' ? '' : directory}`
  const tempSiteUrl = tempUrl ? `https://${tempUrl}${directory === '/' ? '' : directory}` : ''
  const brandedTempUrl = domain ? `https://${domain.replace(/\./g, '-')}.preview.sws.geig.co.uk${directory === '/' ? '' : directory}` : ''

  function copy(text: string) { navigator.clipboard.writeText(text) }

  const APP_ICONS: Record<string, string> = {
    wordpress: '🌐', joomla: '🟠', drupal: '💧', prestashop: '🛒', dolibarr: '📋',
    opencart: '🛍️', laravel: '🔴', moodle: '📚', mediawiki: '📖', phpbb: '💬',
    matomo: '📊', suitecrm: '👥', vtiger: '💼', invoiceninja: '💰',
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Success header */}
      <div style={{ textAlign: 'center', padding: '32px 20px', background: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--card-border)' }}>
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>{APP_ICONS[app] || '📦'}</div>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
          {appName} is installing!
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Your application is being installed in the background. This usually takes 2–5 minutes.
          You'll be able to access it at the URLs below once complete.
        </p>
      </div>

      {/* URLs */}
      <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '1px solid #1a3060' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>🔗 Access URLs</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ padding: '10px 14px', background: '#1a2840', borderRadius: '8px' }}>
            <p style={{ fontSize: '10px', color: '#6699cc', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live URL</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <a href={siteUrl} target="_blank" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '13px', color: '#5599ff', textDecoration: 'none', flex: 1 }}>{siteUrl}</a>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => copy(siteUrl)} style={{ height: '24px', padding: '0 8px', background: '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                <a href={siteUrl} target="_blank" style={{ height: '24px', padding: '0 8px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Open ↗</a>
              </div>
            </div>
          </div>
          {tempSiteUrl && (
            <div style={{ padding: '10px 14px', background: '#1a2840', borderRadius: '8px' }}>
              <p style={{ fontSize: '10px', color: '#6699cc', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Preview URL (available before DNS propagation)</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <a href={tempSiteUrl} target="_blank" style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-secondary)', textDecoration: 'none', flex: 1 }}>{tempSiteUrl}</a>
                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                  <button onClick={() => copy(tempSiteUrl)} style={{ height: '24px', padding: '0 8px', background: '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Copy</button>
                  <a href={tempSiteUrl} target="_blank" style={{ height: '24px', padding: '0 8px', background: '#2a3a50', color: 'var(--text-secondary)', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>Open ↗</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Database credentials */}
      {dbName && (
        <div style={{ padding: '20px', borderRadius: '10px', background: '#0a1628', border: '1px solid #1a3060' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>🗄️ Database credentials</p>
          <p style={{ fontSize: '11px', color: '#f87171', marginBottom: '14px' }}>⚠️ Save these now — you will not see them again</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { label: 'Database name', value: dbName },
              { label: 'Database server', value: dbServer },
              { label: 'Username', value: dbUser },
              { label: 'Password', value: dbPassword },
            ].filter(i => i.value).map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', background: '#1a2840', borderRadius: '6px' }}>
                <span style={{ fontSize: '11px', color: '#6699cc', width: '130px', flexShrink: 0 }}>{item.label}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#fff', flex: 1 }}>{item.value}</span>
                <button onClick={() => copy(item.value)} style={{ height: '22px', padding: '0 8px', background: '#1a3060', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next steps */}
      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Next steps</h3>
        {[
          { step: '1', text: 'Wait 2–5 minutes for installation to complete', done: false },
          { step: '2', text: `Visit ${siteUrl} to complete the web installer`, done: false },
          { step: '3', text: 'Use the database credentials above during setup', done: false },
          { step: '4', text: 'Save your admin credentials somewhere secure', done: false },
        ].map(s => (
          <div key={s.step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '13px', color: '#5a5a5a' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a6ef5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>{s.step}</span>
            <span>{s.text}</span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <a href={siteUrl} target="_blank"
          style={{ flex: 1, height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 700, textDecoration: 'none' }}>
          Open {appName} ↗
        </a>
        <Link href={`/packages/${packageId}/applications`}
          style={{ height: '42px', padding: '0 20px', display: 'flex', alignItems: 'center', background: 'var(--card-bg)', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '13px', fontWeight: 500, textDecoration: 'none', border: '1px solid var(--card-border-hover)' }}>
          ← Back to apps
        </Link>
      </div>

    </div>
  )
}

export default function InstalledPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading…</div>}>
      <InstalledContent packageId={params.id} />
    </Suspense>
  )
}
