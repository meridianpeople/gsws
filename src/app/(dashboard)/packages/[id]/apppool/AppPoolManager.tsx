'use client'
import { useState } from 'react'

const PIPELINE_MODES = ['Classic', 'Integrated']
const RUNTIME_VERSIONS = ['v2.0', 'v4.0', 'No Managed Code']

export default function AppPoolManager({ packageId, domainName, config }: {
  packageId: string
  domainName: string
  config: any
}) {
  const [pipeline, setPipeline] = useState(config.ApplicationPoolPipelineMode || 'Classic')
  const [runtime, setRuntime] = useState(config.ApplicationPoolRuntimeVersion || 'v4.0')
  const [saving, setSaving] = useState(false)
  const [recycling, setRecycling] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/apppool`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ApplicationPoolPipelineMode: pipeline, ApplicationPoolRuntimeVersion: runtime }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSuccess('App pool configuration saved')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) { setError(err.message) }
    setSaving(false)
  }

  async function handleRecycle() {
    if (!confirm('Recycle the application pool? This will briefly restart your site.')) return
    setRecycling(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/apppool/recycle`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSuccess('Application pool recycled successfully')
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setRecycling(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Application Pool configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Pipeline mode</label>
            <select value={pipeline} onChange={e => setPipeline(e.target.value)}
              style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 10px' }}>
              {PIPELINE_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px' }}>
              {pipeline === 'Integrated' ? 'Recommended for ASP.NET 2.0+' : 'Use for legacy ASP.NET applications'}
            </p>
          </div>
          <div>
            <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>.NET runtime version</label>
            <select value={runtime} onChange={e => setRuntime(e.target.value)}
              style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 10px' }}>
              {RUNTIME_VERSIONS.map(v => <option key={v}>{v}</option>)}
            </select>
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px' }}>
              {runtime === 'v4.0' ? 'Recommended for modern ASP.NET' : runtime === 'v2.0' ? 'Legacy ASP.NET 2.0/3.5' : 'For static sites or non-.NET apps'}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save configuration'}
          </button>
          <button onClick={handleRecycle} disabled={recycling}
            style={{ height: '34px', padding: '0 16px', background: '#fff', color: '#854f0b', border: '1px solid #f0c070', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {recycling ? 'Recycling…' : '♻️ Recycle App Pool'}
          </button>
        </div>
      </div>

      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '12px' }}>Current configuration</h3>
        {[
          ['Pipeline mode', config.ApplicationPoolPipelineMode || '—'],
          ['Runtime version', config.ApplicationPoolRuntimeVersion || '—'],
          ['Config ID', String(config.VirtualHostWindowsConfigurationId || '—')],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
            <span style={{ color: '#9a9a9a' }}>{label}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 500, color: '#0a0a0a' }}>{value}</span>
          </div>
        ))}
      </div>

      <div className="gsws-card">
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>About App Pool recycling</h3>
        <p style={{ fontSize: '12px', color: '#9a9a9a', lineHeight: 1.6 }}>
          Recycling the application pool restarts the IIS worker process for your site. This clears cached memory and can resolve performance issues. Your site will be briefly unavailable during recycling (usually under 5 seconds).
        </p>
      </div>
    </div>
  )
}
