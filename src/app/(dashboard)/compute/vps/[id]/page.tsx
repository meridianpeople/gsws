'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const ICON = {
  cpu: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>,
  ram: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01M14 12h.01M18 12h.01M6 10v4M10 10v4M14 10v4M18 10v4"/></svg>,
  disk: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3"/></svg>,
  ip: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  region: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  os: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  user: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  terminal: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
  camera: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  shield: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  dns: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>,
  zap: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  vnc: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><circle cx="12" cy="10" r="2"/></svg>,
}

export default function VPSDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState<any>(null)
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('Overview')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [images, setImages] = useState<any[]>([])
  const [imageSearch, setImageSearch] = useState('')
  const [imageFilter, setImageFilter] = useState('all')
  const [firewall, setFirewall] = useState<any>(null)
  const [dnsZones, setDnsZones] = useState<any[]>([])
  const [showAddRule, setShowAddRule] = useState(false)
  const [newRule, setNewRule] = useState({ protocol: 'tcp', port: '', cidr: '0.0.0.0/0', action: 'accept', displayName: '' })
  const [savingRule, setSavingRule] = useState(false)
  const [editingFwName, setEditingFwName] = useState(false)
  const [newFwName, setNewFwName] = useState('')

  useEffect(() => { loadVPS() }, [id])
  useEffect(() => {
    if (tab === 'Snapshots') loadSnapshots()
    if (tab === 'Images') loadImages()
    if (tab === 'Firewall') loadFirewall()
    if (tab === 'DNS') loadDnsZones()
  }, [tab])

  async function loadVPS() {
    try {
      const res = await fetch(`/api/compute/vps/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(data.order); setInstance(data.instance)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }
  async function loadSnapshots() {
    try { const d = await fetch(`/api/compute/vps/${id}/snapshots`).then(r => r.json()); setSnapshots(d.snapshots || []) } catch {}
  }
  async function loadFirewall() {
    try { const d = await fetch(`/api/compute/vps/${id}/firewall`).then(r => r.json()); setFirewall(d.firewall || null) } catch {}
  }
  async function loadDnsZones() {
    try { const d = await fetch(`/api/compute/vps/${id}/dns`).then(r => r.json()); setDnsZones(d.zones || []) } catch {}
  }
  async function loadImages() {
    try { const d = await fetch(`/api/compute/vps/${id}/images`).then(r => r.json()); setImages(d.images || []) } catch {}
  }
  async function doAction(action: string, body?: any) {
    setActionLoading(action); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/compute/vps/${id}/actions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...body }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message || `${action} successful`); loadVPS()
    } catch (err: any) { setError(err.message) }
    finally { setActionLoading('') }
  }

  const hasBackup = instance?.addOns?.some((a: any) => a.id === 1305 || a.id === 1306) || false
  const hasPrivateNet = instance?.addOns?.some((a: any) => a.id === 1401) || false
  const TABS = ['Overview', 'Snapshots', 'Images', ...(hasBackup ? ['Backups'] : []), ...(hasPrivateNet ? ['Network'] : []), 'Firewall', 'DNS', 'Actions']

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <div style={{ width: '20px', height: '20px', border: '2px solid #e5e5e5', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
  if (!order) return <div style={{ color: '#dc2626', padding: '24px', fontSize: '13px' }}>VPS not found</div>

  const pd = order.provider_data ? JSON.parse(order.provider_data) : null
  const ip = instance?.ipConfig?.v4?.ip || pd?.ipConfig?.v4?.ip || order.ssh_host || '—'
  const status = instance?.status || order.status
  const name = order.notes?.replace('Imported: ', '') || pd?.displayName || order.service_key

  const tabIcons: Record<string, any> = {
    Overview: ICON.cpu, Snapshots: ICON.camera, Images: ICON.disk,
    Firewall: ICON.shield, DNS: ICON.dns, Actions: ICON.zap,
    Backups: ICON.camera, Network: ICON.ip,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        .vps-tab-btn:hover { background: #f7f7f7 !important; }
        .vps-action-btn:hover { opacity: 0.85; }
        .vps-card:hover { border-color: #d4d4d4 !important; }
        .vps-row:hover { background: #fafafa !important; }
        input:focus, select:focus { outline: 2px solid #0a0a0a !important; outline-offset: -1px; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        <Link href="/compute/vps" style={{ fontSize: '12px', color: '#9a9a9a', textDecoration: 'none', letterSpacing: '0.01em' }}>VPS</Link>
        <span style={{ color: '#d4d4d4', fontSize: '12px' }}>›</span>
        <span style={{ fontSize: '12px', color: '#666' }}>{name}</span>
      </div>

      {/* Hero header */}
      <div style={{ background: '#0a0a0a', borderRadius: '14px', padding: '24px 28px', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(ellipse at top right, #1a1a2e 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.12em', color: '#666', textTransform: 'uppercase', marginBottom: '8px' }}>Cloud VPS · {pd?.region || 'EU'}</p>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f5f5f5', margin: '0 0 12px', letterSpacing: '-0.02em' }}>{name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9a9a9a', fontFamily: "'DM Mono', monospace" }}>
                {ICON.ip}<span style={{ color: '#e5e5e5' }}>{ip}</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9a9a9a' }}>
                {ICON.cpu}<span style={{ color: '#e5e5e5' }}>{pd?.cpuCores || '—'} vCPU</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9a9a9a' }}>
                {ICON.ram}<span style={{ color: '#e5e5e5' }}>{pd?.ramMb ? `${pd.ramMb/1024}GB` : '—'} RAM</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#9a9a9a' }}>
                {ICON.disk}<span style={{ color: '#e5e5e5' }}>{pd?.diskMb ? `${pd.diskMb/1024}GB` : '—'} SSD</span>
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: status === 'running' ? '#0d2818' : '#2d1515', color: status === 'running' ? '#4ade80' : '#f87171', border: `1px solid ${status === 'running' ? '#166534' : '#7f1d1d'}` }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: status === 'running' ? '#4ade80' : '#f87171', display: 'inline-block' }} />
                {status}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {[
              { label: 'Start', action: 'start', color: '#4ade80', bg: '#0d2818', border: '#166534', disabled: status === 'running' },
              { label: 'Stop', action: 'stop', color: '#f87171', bg: '#2d1515', border: '#7f1d1d', disabled: status !== 'running' },
              { label: 'Restart', action: 'restart', color: '#e5e5e5', bg: '#1a1a1a', border: '#333', disabled: false },
            ].map(({ label, action, color, bg, border, disabled }) => (
              <button key={action} onClick={() => doAction(action)} disabled={!!actionLoading || disabled} className="vps-action-btn"
                style={{ height: '34px', padding: '0 14px', background: bg, color, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1, fontFamily: 'inherit', transition: 'opacity 0.15s' }}>
                {label}
              </button>
            ))}
            <button onClick={() => { const v = instance?.vncIp || pd?.vncIp; if (v) window.open(`https://${v}:${instance?.vncPort || pd?.vncPort}`, '_blank') }}
              disabled={!instance?.vncIp && !pd?.vncIp} className="vps-action-btn"
              style={{ height: '34px', padding: '0 14px', background: '#1a1030', color: '#a78bfa', border: '1px solid #4c1d95', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px', transition: 'opacity 0.15s' }}>
              {ICON.vnc} VNC
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && <div style={{ padding: '11px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '13px', color: '#b91c1c', marginBottom: '12px' }}>{error}</div>}
      {success && <div style={{ padding: '11px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '13px', color: '#15803d', marginBottom: '12px' }}>{success}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '16px', borderBottom: '1px solid #ebebeb', paddingBottom: '0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className="vps-tab-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 14px', fontSize: '12px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#0a0a0a' : '#888', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #0a0a0a' : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px', transition: 'all 0.1s', fontFamily: 'inherit', borderRadius: '0', whiteSpace: 'nowrap' }}>
            <span style={{ opacity: tab === t ? 1 : 0.5 }}>{tabIcons[t]}</span>
            {t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { icon: ICON.ip, label: 'IP ADDRESS', value: ip, mono: true },
              { icon: ICON.cpu, label: 'vCPU', value: pd?.cpuCores ? `${pd.cpuCores} cores` : '—' },
              { icon: ICON.ram, label: 'MEMORY', value: pd?.ramMb ? `${pd.ramMb/1024} GB RAM` : '—' },
              { icon: ICON.disk, label: 'STORAGE', value: pd?.diskMb ? `${pd.diskMb/1024} GB SSD` : '—' },
              { icon: ICON.os, label: 'OPERATING SYSTEM', value: pd?.osType || instance?.osType || 'Linux' },
              { icon: ICON.user, label: 'SSH USER', value: order.ssh_user || 'admin', mono: true },
              { icon: ICON.region, label: 'REGION', value: pd?.regionName || pd?.region || 'EU' },
              { icon: ICON.ip, label: 'IPv6', value: pd?.ipConfig?.v6?.ip || '—', mono: true },
              { icon: ICON.zap, label: 'PLAN', value: order.service_key },
            ].map(({ icon, label, value, mono }) => (
              <div key={label} className="vps-card"
                style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '14px 16px', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px', color: '#9a9a9a' }}>
                  {icon}
                  <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</span>
                </div>
                <p style={{ fontSize: mono ? '12px' : '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: mono ? "'DM Mono', monospace" : 'inherit' } as any}>{value}</p>
              </div>
            ))}
          </div>

          {/* Terminal CTA */}
          <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', background: '#1a1a1a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
                {ICON.terminal}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#f5f5f5', marginBottom: '1px' }}>Browser Terminal</p>
                <p style={{ fontSize: '11px', color: '#666' }}>SSH directly in your browser — no client needed</p>
              </div>
            </div>
            <Link href="/cli" style={{ height: '32px', padding: '0 16px', background: '#f5f5f5', color: '#0a0a0a', borderRadius: '7px', fontSize: '12px', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px', letterSpacing: '-0.01em' }}>
              Open Terminal →
            </Link>
          </div>

          {/* Backup upsell */}
          {!hasBackup && (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '30px', height: '30px', background: '#f7f7f7', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>{ICON.camera}</div>
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#0a0a0a' }}>Auto Backup not enabled</p>
                  <p style={{ fontSize: '11px', color: '#9a9a9a' }}>Daily snapshots with 7-day retention</p>
                </div>
              </div>
              <button style={{ height: '30px', padding: '0 12px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', color: '#333', fontFamily: 'inherit' }}>Enable</button>
            </div>
          )}
        </div>
      )}

      {/* SNAPSHOTS */}
      {tab === 'Snapshots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Snapshots</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Point-in-time captures of your VPS state</p>
            </div>
            <button onClick={() => doAction('snapshot')} disabled={!!actionLoading}
              style={{ height: '34px', padding: '0 16px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {ICON.camera} {actionLoading === 'snapshot' ? 'Creating...' : 'Create Snapshot'}
            </button>
          </div>
          {snapshots.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: '#f7f7f7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9a9a9a' }}>{ICON.camera}</div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}>No snapshots yet</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a' }}>Create a snapshot to save the current state of your VPS</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #ebebeb' }}>
                    {['Name', 'Created', 'Size', ''].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s: any) => (
                    <tr key={s.snapshotId} className="vps-row" style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.1s' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0a0a0a' }}>{s.name || s.snapshotId}</td>
                      <td style={{ padding: '12px 16px', color: '#666', fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{s.createdDate?.substring(0, 10)}</td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>{s.diskMb ? `${(s.diskMb/1024).toFixed(1)} GB` : '—'}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => doAction('rollback', { snapshotId: s.snapshotId })}
                          style={{ padding: '4px 10px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Restore</button>
                        <button onClick={() => doAction('delete_snapshot', { snapshotId: s.snapshotId })}
                          style={{ padding: '4px 10px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', color: '#dc2626', fontFamily: 'inherit', fontWeight: 500 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* IMAGES */}
      {tab === 'Images' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Reinstall OS</p>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Choose an operating system to install. <strong style={{ color: '#dc2626' }}>All data will be permanently wiped.</strong></p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input value={imageSearch} onChange={e => setImageSearch(e.target.value)} placeholder="Search images..."
              style={{ flex: 1, height: '36px', border: '1px solid #d4d4d4', borderRadius: '7px', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit' }} />
            {['all', 'Linux', 'Windows'].map(f => (
              <button key={f} onClick={() => setImageFilter(f)}
                style={{ height: '36px', padding: '0 14px', background: imageFilter === f ? '#0a0a0a' : '#f7f7f7', color: imageFilter === f ? '#fff' : '#333', border: `1px solid ${imageFilter === f ? '#0a0a0a' : '#d4d4d4'}`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.1s' }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#fafafa', borderBottom: '1px solid #ebebeb' }}>
                  {['Image', 'Type', 'Version', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9a9a9a', fontSize: '13px' }}>Loading images...</td></tr>
                ) : images.filter((img: any) => (imageFilter === 'all' || img.osType === imageFilter) && (!imageSearch || img.name.toLowerCase().includes(imageSearch.toLowerCase()))).map((img: any) => (
                  <tr key={img.imageId} className="vps-row" style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.1s' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0a0a0a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '15px' }}>{img.osType === 'Windows' ? '🪟' : '🐧'}</span>
                        {img.name}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', background: img.osType === 'Windows' ? '#eff6ff' : '#f0fdf4', color: img.osType === 'Windows' ? '#1d4ed8' : '#15803d' }}>{img.osType}</span>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#666', fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{img.version}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => { if (confirm(`Install ${img.name}? All data will be permanently wiped.`)) doAction('reinstall', { imageId: img.imageId }) }} disabled={!!actionLoading}
                        style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontFamily: 'inherit' }}>
                        Install
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{images.filter((img: any) => (imageFilter === 'all' || img.osType === imageFilter) && (!imageSearch || img.name.toLowerCase().includes(imageSearch.toLowerCase()))).length} of {images.length} images</p>
        </div>
      )}

      {/* FIREWALL */}
      {tab === 'Firewall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Firewall</p>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Control inbound and outbound traffic to your VPS</p>
          </div>
          {firewall ? (
            <>
              <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#15803d' }}>{ICON.shield}</div>
                  {editingFwName ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input value={newFwName} onChange={e => setNewFwName(e.target.value)}
                        style={{ height: '30px', border: '1px solid #0a0a0a', borderRadius: '5px', padding: '0 8px', fontSize: '13px', fontWeight: 600, width: '200px', fontFamily: 'inherit' }} />
                      <button onClick={async () => {
                        try {
                          const res = await fetch(`/api/compute/vps/${id}/firewall`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firewallId: firewall.firewallId, name: newFwName }) })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error)
                          setSuccess('Renamed'); setEditingFwName(false); loadFirewall()
                        } catch (err: any) { setError(err.message) }
                      }} style={{ height: '30px', padding: '0 10px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>Save</button>
                      <button onClick={() => setEditingFwName(false)} style={{ height: '30px', padding: '0 10px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{firewall.name}</p>
                        <button onClick={() => { setNewFwName(firewall.name); setEditingFwName(true) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9a9a', fontSize: '11px', padding: '0', lineHeight: 1 }}>✏️</button>
                      </div>
                      <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#15803d', marginTop: '2px' }}>{firewall.status}</p>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowAddRule(r => !r)}
                  style={{ height: '32px', padding: '0 14px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {ICON.shield} + Add Rule
                </button>
              </div>

              {showAddRule && (
                <div style={{ background: '#f7f7f7', border: '1px solid #e5e5e5', borderRadius: '10px', padding: '16px 20px' }}>
                  <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#666', marginBottom: '12px' }}>New inbound rule</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 140px 180px 120px 1fr', gap: '8px', alignItems: 'end' }}>
                    {[
                      { label: 'Protocol', el: <select value={newRule.protocol} onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value }))} style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', padding: '0 8px', fontSize: '12px', fontFamily: 'inherit', background: '#fff' }}><option value="tcp">TCP</option><option value="udp">UDP</option><option value="icmp">ICMP</option><option value="">Any</option></select> },
                      { label: 'Port / Range', el: <input value={newRule.port} onChange={e => setNewRule(r => ({ ...r, port: e.target.value }))} placeholder="22 or 8000-9000" style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', padding: '0 10px', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' as const }} /> },
                      { label: 'Source CIDR', el: <input value={newRule.cidr} onChange={e => setNewRule(r => ({ ...r, cidr: e.target.value }))} placeholder="0.0.0.0/0" style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', padding: '0 10px', fontSize: '12px', fontFamily: 'inherit', boxSizing: 'border-box' as const }} /> },
                      { label: 'Action', el: <select value={newRule.action} onChange={e => setNewRule(r => ({ ...r, action: e.target.value }))} style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', padding: '0 8px', fontSize: '12px', fontFamily: 'inherit', background: '#fff' }}><option value="accept">Accept</option><option value="drop">Drop</option></select> },
                    ].map(({ label, el }) => (
                      <div key={label}>
                        <label style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>{label}</label>
                        {el}
                      </div>
                    ))}
                    <button onClick={async () => {
                      setSavingRule(true)
                      try {
                        const existingRules = firewall.rules?.inbound || []
                        const ports = newRule.port ? (newRule.port.includes('-') ? [{ from: parseInt(newRule.port.split('-')[0]), to: parseInt(newRule.port.split('-')[1]) }] : [parseInt(newRule.port)]) : []
                        const ruleObj = { protocol: newRule.protocol, destPorts: ports, srcCidr: { ipv4: [newRule.cidr], ipv6: [] }, action: newRule.action, status: 'active', displayName: `${newRule.protocol || 'any'} ${newRule.port || 'all'}` }
                        const res = await fetch(`/api/compute/vps/${id}/firewall`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ firewallId: firewall.firewallId, rules: { inbound: [...existingRules.filter((r: any) => r.displayName !== 'Block all traffic'), ruleObj] } }) })
                        const data = await res.json()
                        if (!res.ok) throw new Error(data.error)
                        setSuccess('Rule added'); setShowAddRule(false); setNewRule({ protocol: 'tcp', port: '', cidr: '0.0.0.0/0', action: 'accept', displayName: '' }); loadFirewall()
                      } catch (err: any) { setError(err.message) }
                      finally { setSavingRule(false) }
                    }} disabled={savingRule} style={{ height: '36px', padding: '0 16px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-end', marginTop: '18px' }}>
                      {savingRule ? 'Saving...' : 'Add'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #ebebeb' }}>
                      {['Rule', 'Protocol', 'Ports', 'Source', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '10px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(firewall.rules?.inbound || []).length === 0 ? (
                      <tr><td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#9a9a9a' }}>No rules configured</td></tr>
                    ) : (firewall.rules?.inbound || []).map((r: any, i: number) => (
                      <tr key={i} className="vps-row" style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.1s' }}>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0a0a0a' }}>{r.displayName || '—'}</td>
                        <td style={{ padding: '11px 16px', color: '#666', fontFamily: "'DM Mono', monospace" }}>{r.protocol || 'any'}</td>
                        <td style={{ padding: '11px 16px', color: '#666', fontFamily: "'DM Mono', monospace" }}>{r.destPorts?.length > 0 ? r.destPorts.join(', ') : 'all'}</td>
                        <td style={{ padding: '11px 16px', color: '#666', fontFamily: "'DM Mono', monospace", fontSize: '11px' }}>{r.srcCidr?.ipv4?.join(', ') || '0.0.0.0/0'}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: r.action === 'accept' ? '#f0fdf4' : '#fef2f2', color: r.action === 'accept' ? '#15803d' : '#dc2626' }}>{r.action}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '48px', textAlign: 'center' }}>
              <div style={{ width: '40px', height: '40px', background: '#f7f7f7', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: '#9a9a9a' }}>{ICON.shield}</div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}>No firewall configured</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '16px' }}>Create a firewall to control traffic to this instance</p>
              <button onClick={() => doAction('create_firewall').then(() => loadFirewall())} disabled={!!actionLoading}
                style={{ height: '36px', padding: '0 16px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {actionLoading === 'create_firewall' ? 'Creating...' : '+ Create Firewall'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DNS */}
      {tab === 'DNS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>DNS Zones</p>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Manage DNS zones for <span style={{ fontFamily: "'DM Mono', monospace" }}>{ip}</span></p>
          </div>
          {dnsZones.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
              {dnsZones.map((z: any) => (
                <div key={z.name} className="vps-row" style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', background: '#f0f4ff', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>{ICON.dns}</div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{z.name}</p>
                      <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{z.records?.length || 0} records</p>
                    </div>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', background: '#f0fdf4', color: '#15803d' }}>Active</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '12px' }}>{dnsZones.length > 0 ? 'Add DNS Zone' : 'Create DNS Zone'}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input id="dns-zone-name" placeholder="example.com"
                style={{ flex: 1, height: '36px', border: '1px solid #d4d4d4', borderRadius: '7px', padding: '0 12px', fontSize: '13px', fontFamily: 'inherit' }} />
              <button onClick={() => {
                const zn = (document.getElementById('dns-zone-name') as HTMLInputElement)?.value?.trim()
                if (!zn) { alert('Enter a domain name'); return }
                doAction('create_dns_zone', { zoneName: zn })
              }} disabled={!!actionLoading}
                style={{ height: '36px', padding: '0 16px', background: '#0a0a0a', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {actionLoading === 'create_dns_zone' ? 'Creating...' : '+ Create Zone'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      {tab === 'Actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Actions</p>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Manage your VPS lifecycle and recovery options</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: ICON.camera, label: 'Create Snapshot', category: 'BACKUP', desc: 'Save the current disk state for later restore', action: 'snapshot', accent: '#15803d', accentBg: '#f0fdf4' },
              { icon: ICON.zap, label: 'Graceful Shutdown', category: 'POWER', desc: 'Send ACPI signal — OS shuts down cleanly', action: 'shutdown', accent: '#854d0e', accentBg: '#fefce8' },
              { icon: ICON.shield, label: 'Rescue Mode', category: 'RECOVERY', desc: 'Boot into rescue system for emergency access', action: 'rescue', accent: '#6d28d9', accentBg: '#f5f3ff' },
              { icon: ICON.user, label: 'Reset Password', category: 'SECURITY', desc: 'Send new root credentials to your email', action: 'reset_credentials', accent: '#1d4ed8', accentBg: '#eff6ff' },
            ].map(({ icon, label, category, desc, action, accent, accentBg }) => (
              <div key={action} className="vps-card"
                style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px', transition: 'border-color 0.15s' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ width: '34px', height: '34px', background: accentBg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent }}>{icon}</div>
                  <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9a9a9a' }}>{category}</span>
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '3px' }}>{label}</p>
                  <p style={{ fontSize: '11px', color: '#9a9a9a', lineHeight: 1.5 }}>{desc}</p>
                </div>
                <button onClick={() => doAction(action)} disabled={!!actionLoading}
                  style={{ height: '30px', padding: '0 12px', background: accentBg, color: accent, border: `1px solid ${accent}30`, borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', alignSelf: 'flex-start', transition: 'opacity 0.15s' }}>
                  {actionLoading === action ? 'Processing...' : label}
                </button>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div style={{ background: '#fff', border: '1px solid #fecaca', borderRadius: '12px', padding: '18px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#dc2626', marginBottom: '12px' }}>Danger Zone</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '3px' }}>Cancel VPS</p>
                <p style={{ fontSize: '11px', color: '#9a9a9a', lineHeight: 1.5 }}>Schedule termination at end of billing period. All data will be permanently deleted.</p>
              </div>
              <button onClick={() => { if (confirm('Cancel this VPS? It will be terminated at the end of the billing period and all data deleted permanently.')) doAction('cancel') }} disabled={!!actionLoading}
                style={{ height: '34px', padding: '0 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}>
                Cancel VPS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backups tab */}
      {tab === 'Backups' && (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '24px' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>Auto Backup</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Your VPS is enrolled in automatic daily backups with 7-day retention.</p>
        </div>
      )}

      {/* Network tab */}
      {tab === 'Network' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          {[
            { label: 'IPv4', value: ip, mono: true },
            { label: 'IPv6', value: pd?.ipConfig?.v6?.ip || '—', mono: true },
            { label: 'Gateway', value: pd?.ipConfig?.v4?.gateway || '—', mono: true },
            { label: 'MAC Address', value: pd?.macAddress || '—', mono: true },
            { label: 'Data Centre', value: pd?.dataCenter || '—' },
            { label: 'Region', value: pd?.regionName || '—' },
          ].map(({ label, value, mono }) => (
            <div key={label} className="vps-card" style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '14px 16px', transition: 'border-color 0.15s' }}>
              <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontSize: mono ? '12px' : '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: mono ? "'DM Mono', monospace" : 'inherit' }}>{value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
