'use client'
import { useState } from 'react'

export default function SecurityManager({ packageId, domainName, malwareScan, malwareReport, initialForceSSL, hotlinkProtection }: {
  packageId: string
  domainName: string
  malwareScan: any[]
  malwareReport: any
  initialForceSSL: boolean
  hotlinkProtection: any
}) {
  const [forceSSL, setForceSSL] = useState(initialForceSSL)
  const [scanning, setScanning] = useState(false)
  const [togglingSSL, setTogglingSSL] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleToggleSSL() {
    setTogglingSSL(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/security/forcessl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !forceSSL }),
      })
      const data = await res.json()
      if (!res.ok && res.status !== 409) throw new Error(data.error || 'Failed')
      setForceSSL(f => !f)
      setSuccess(`Force HTTPS ${!forceSSL ? 'enabled' : 'disabled'}`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setTogglingSSL(false)
    }
  }

  async function handleScan() {
    setScanning(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/security/scan`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to start scan')
      setSuccess('Malware scan started. Results will appear shortly.')
      setTimeout(() => setSuccess(''), 5000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setScanning(false)
    }
  }

  const hasThreats = Array.isArray(malwareReport?.threats) && malwareReport.threats.length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Security overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { icon: hasThreats ? '⚠️' : '✅', label: 'Malware status', value: hasThreats ? 'Threats found' : 'Clean', color: hasThreats ? '#a32d2d' : '#3b6d11', bg: hasThreats ? '#fcebeb' : '#eaf3de' },
          { icon: forceSSL ? '🔒' : '⚠️', label: 'Force HTTPS', value: forceSSL ? 'Enabled' : 'Disabled', color: forceSSL ? '#3b6d11' : '#854f0b', bg: forceSSL ? '#eaf3de' : '#faeeda' },
          { icon: '🛡️', label: 'Auto-protection', value: 'Active', color: '#3b6d11', bg: '#eaf3de' },
        ].map(s => (
          <div key={s.label} style={{ padding: '14px 16px', borderRadius: '8px', background: s.bg }}>
            <p style={{ fontSize: '20px', marginBottom: '6px' }}>{s.icon}</p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '2px' }}>{s.label}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Force HTTPS */}
      <div className="gsws-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🔒 Force HTTPS</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Redirect all HTTP traffic to HTTPS automatically</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: forceSSL ? '#3b6d11' : '#9a9a9a', fontWeight: 500 }}>{forceSSL ? 'On' : 'Off'}</span>
          <div onClick={handleToggleSSL}
            style={{ width: '44px', height: '24px', borderRadius: '12px', background: forceSSL ? '#1a6ef5' : '#d4d4d4', position: 'relative', cursor: togglingSSL ? 'wait' : 'pointer', transition: 'background 0.2s' }}>
            <div style={{ position: 'absolute', top: '2px', left: forceSSL ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--card-bg)', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
      </div>

      {/* Malware scan */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🦠 Malware scanner</p>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Scans your website files for malicious code daily</p>
          </div>
          <button onClick={handleScan} disabled={scanning}
            style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: scanning ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: scanning ? 0.7 : 1 }}>
            {scanning ? 'Scanning…' : 'Run scan now'}
          </button>
        </div>

        {/* Scan history */}
        {malwareScan.length > 0 && (
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>Recent scan history</p>
            {malwareScan.slice(0, 3).map((scan: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--card-bg-elevated)', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ fontWeight: 500, color: scan.status === 'completed' ? '#3b6d11' : '#854f0b' }}>
                  {scan.status === 'completed' ? '✅ Scan completed' : scan.status?.startsWith('in_progress') ? '🔄 Scan in progress' : scan.status === 'new' ? '🔄 Scan queued' : '🔄 ' + (scan.status || 'Running')}
                </span>
                {scan.created && <span style={{ color: 'var(--text-secondary)' }}>{new Date(scan.created).toLocaleDateString('en-GB')}</span>}
              </div>
            ))}
          </div>
        )}
        {hasThreats ? (
          <div style={{ padding: '12px 16px', background: '#fcebeb', borderRadius: '8px', border: '1px solid #f5c1c1' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#a32d2d', marginBottom: '6px' }}>⚠️ Threats detected in last scan</p>
            {malwareReport.threats.slice(0, 5).map((threat: any, i: number) => (
              <p key={i} style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#a32d2d', marginTop: '4px' }}>{threat.file || threat}</p>
            ))}
          </div>
        ) : (
          <div style={{ padding: '12px 16px', background: '#eaf3de', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', fontWeight: 500, color: '#3b6d11' }}>✅ No threats detected. Your website is clean.</p>
          </div>
        )}
      </div>

      {/* Hotlink protection */}
      <div className="gsws-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🔗 Hotlink protection</p>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Prevent other websites from embedding your images and files</p>
        </div>
        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: hotlinkProtection?.enabled ? '#eaf3de' : '#f7f7f7', color: hotlinkProtection?.enabled ? '#3b6d11' : '#9a9a9a' }}>
          {hotlinkProtection?.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Security tips */}
      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>Security recommendations</h3>
        {[
          { done: forceSSL, tip: 'Force HTTPS to encrypt all traffic', action: !forceSSL ? 'Enable above' : null },
          { done: !hasThreats, tip: 'Keep your website free of malware', action: hasThreats ? 'Review scan results' : null },
          { done: true, tip: 'SSL certificate installed and valid', action: null },
          { done: true, tip: 'Daily malware scanning active', action: null },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--card-border)', fontSize: '12px' }}>
            <span style={{ fontSize: '14px', flexShrink: 0 }}>{r.done ? '✅' : '⚠️'}</span>
            <span style={{ flex: 1, color: r.done ? '#0a0a0a' : '#854f0b' }}>{r.tip}</span>
            {r.action && <span style={{ fontSize: '11px', color: '#1a6ef5', cursor: 'pointer' }}>{r.action}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
