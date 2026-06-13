'use client'
import { useState } from 'react'

interface PHPVersion {
  FullVersion: string
  Handler: string
  Title: string
}

interface PHPDirective {
  DirectiveName: string
  DirectiveDefault: string
  DirectiveType: string
}

const RECOMMENDED = ['php85', 'php84', 'php83', 'php82', 'php81']

export default function PHPVersionSelector({
  packageId,
  currentVersion,
  availableVersions,
  phpConfig,
  domainName,
}: {
  packageId: string
  currentVersion: string
  availableVersions: PHPVersion[]
  phpConfig: PHPDirective[]
  domainName: string
}) {
  const [selected, setSelected] = useState(currentVersion)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [showAllConfig, setShowAllConfig] = useState(false)
  const [configValues, setConfigValues] = useState<Record<string, string>>(
    Object.fromEntries((Array.isArray(phpConfig) ? phpConfig : []).map(d => [d.DirectiveName, d.DirectiveDefault]))
  )

  async function handleSaveVersion() {
    if (selected === currentVersion) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/php/version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update PHP version')
      setSuccess(`PHP updated to ${availableVersions.find(v => v.Handler === selected)?.Title}`)
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveConfig() {
    setSavingConfig(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/php/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainName, config: configValues }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update PHP config')
      setSuccess('PHP configuration updated successfully')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const current = availableVersions.find(v => v.Handler === currentVersion)
  const directives = Array.isArray(phpConfig) ? phpConfig : []
  const visibleDirectives = showAllConfig ? directives : directives.slice(0, 8)

  return (
    <>
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>
      )}
      {success && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>
      )}

      {/* Current version */}
      <div className="gsws-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Current PHP version</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {current?.Title || currentVersion} · {current?.FullVersion || '—'}
          </p>
        </div>
        <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, background: RECOMMENDED.includes(currentVersion) ? '#eaf3de' : '#faeeda', color: RECOMMENDED.includes(currentVersion) ? '#3b6d11' : '#854f0b', fontFamily: 'ui-monospace, monospace' }}>
          {currentVersion}
        </span>
      </div>

      {/* Version selector */}
      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Select PHP version</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '16px' }}>
          {availableVersions.slice().reverse().map(v => {
            const isRec = RECOMMENDED.includes(v.Handler)
            const isCurrent = v.Handler === currentVersion
            const isSelected = v.Handler === selected
            return (
              <div key={v.Handler} onClick={() => setSelected(v.Handler)}
                style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', border: `2px solid ${isSelected ? '#1a6ef5' : isCurrent ? '#c0dd97' : '#ebebeb'}`, background: isSelected ? '#e8f0fe' : isCurrent ? '#f0f9e8' : '#fff', position: 'relative' }}>
                {isRec && !isCurrent && (
                  <div style={{ position: 'absolute', top: '-8px', left: '50%', transform: 'translateX(-50%)', background: '#3b6d11', color: '#fff', fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                    Recommended
                  </div>
                )}
                <p style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#1a6ef5' : '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{v.Title}</p>
                <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{v.FullVersion}</p>
                {isCurrent && <p style={{ fontSize: '10px', color: '#3b6d11', marginTop: '2px', fontWeight: 600 }}>Current</p>}
              </div>
            )
          })}
        </div>
        {selected !== currentVersion && (
          <div style={{ padding: '12px 16px', background: '#faeeda', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#854f0b' }}>
            ⚠️ Changing PHP version will restart your web server. Brief downtime may occur.
          </div>
        )}
        <button onClick={handleSaveVersion} disabled={saving || selected === currentVersion}
          style={{ height: '36px', padding: '0 24px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving || selected === currentVersion ? 'not-allowed' : 'pointer', opacity: saving || selected === currentVersion ? 0.5 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Updating…' : 'Update PHP version'}
        </button>
      </div>

      {/* PHP directives - editable */}
      {directives.length > 0 && (
        <div className="gsws-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>PHP directives</h3>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{directives.length} configurable directives</p>
            </div>
            <button onClick={handleSaveConfig} disabled={savingConfig}
              style={{ height: '32px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: savingConfig ? 'wait' : 'pointer', opacity: savingConfig ? 0.7 : 1, fontFamily: 'inherit' }}>
              {savingConfig ? 'Saving…' : 'Save config'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {visibleDirectives.map((d: PHPDirective) => (
              <div key={d.DirectiveName} style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: '12px', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--card-border)' }}>
                <div>
                  <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-primary)' }}>{d.DirectiveName}</span>
                  <span style={{ marginLeft: '8px', fontSize: '10px', color: 'var(--text-secondary)' }}>default: {d.DirectiveDefault || '—'}</span>
                </div>
                <input
                  value={configValues[d.DirectiveName] ?? d.DirectiveDefault}
                  onChange={e => setConfigValues(v => ({ ...v, [d.DirectiveName]: e.target.value }))}
                  style={{ height: '28px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '12px', fontFamily: 'ui-monospace, monospace', padding: '0 8px', background: 'var(--card-bg)', color: 'var(--text-primary)', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          {directives.length > 8 && (
            <button onClick={() => setShowAllConfig(s => !s)}
              style={{ marginTop: '12px', fontSize: '12px', color: '#1a6ef5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
              {showAllConfig ? 'Show less' : `Show all ${directives.length} directives`}
            </button>
          )}
        </div>
      )}
    </>
  )
}
