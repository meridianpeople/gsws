'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const TABS_BASE = ['Overview', 'Snapshots', 'Images', 'Firewall', 'DNS', 'Actions']

export default function VPSDetailPage() {
  const { id } = useParams()
  const router = useRouter()
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

  useEffect(() => {
    loadVPS()
  }, [id])

  useEffect(() => {
    if (tab === 'Snapshots') loadSnapshots()
    if (tab === 'Images') loadImages()
  }, [tab])

  async function loadVPS() {
    try {
      const res = await fetch(`/api/compute/vps/${id}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setOrder(data.order)
      setInstance(data.instance)
    } catch (err: any) { setError(err.message) }
    finally { setLoading(false) }
  }

  async function loadSnapshots() {
    try {
      const res = await fetch(`/api/compute/vps/${id}/snapshots`)
      const data = await res.json()
      setSnapshots(data.snapshots || [])
    } catch {}
  }

  async function loadImages() {
    try {
      const res = await fetch(`/api/compute/vps/${id}/images`)
      const data = await res.json()
      setImages(data.images || [])
    } catch {}
  }

  async function doAction(action: string, body?: any) {
    setActionLoading(action); setError(''); setSuccess('')
    try {
      const res = await fetch(`/api/compute/vps/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess(data.message || `${action} successful`)
      loadVPS()
    } catch (err: any) { setError(err.message) }
    finally { setActionLoading('') }
  }

  const hasBackup = instance?.addOns?.some((a: any) => a.id === 1305 || a.id === 1306) || false
  const hasPrivateNet = instance?.addOns?.some((a: any) => a.id === 1401) || false
  const TABS = ['Overview', 'Snapshots', 'Images',
    ...(hasBackup ? ['Backups'] : []),
    ...(hasPrivateNet ? ['Network'] : []),
    'Firewall', 'DNS', 'Actions'
  ]

  if (loading) return <div style={{ color: '#9a9a9a', fontSize: '13px', padding: '24px' }}>Loading...</div>
  if (!order) return <div style={{ color: '#dc2626', padding: '24px' }}>VPS not found</div>

  const pd = order.provider_data ? JSON.parse(order.provider_data) : null
  const ip = instance?.ipConfig?.v4?.ip || pd?.ipConfig?.v4?.ip || order.ssh_host || '—'
  const status = instance?.status || order.status
  const statusColor = status === 'running' || status === 'active' ? '#3b6d11' : status === 'stopped' ? '#dc2626' : '#854d0e'
  const statusBg = status === 'running' || status === 'active' ? '#eaf3de' : status === 'stopped' ? '#fef2f2' : '#fefce8'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Link href="/compute/vps" style={{ fontSize: '13px', color: '#9a9a9a', textDecoration: 'none' }}>VPS</Link>
            <span style={{ color: '#9a9a9a' }}>›</span>
            <span style={{ fontSize: '13px', color: '#0a0a0a' }}>{order.notes?.replace('Imported: ', '') || order.service_key}</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>
            {order.notes?.replace('Imported: ', '') || `VPS #${order.id}`}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ padding: '2px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: statusBg, color: statusColor }}>
              ● {status}
            </span>
            <span style={{ fontSize: '12px', color: '#9a9a9a', fontFamily: 'monospace' }}>{ip}</span>
            <span style={{ fontSize: '12px', color: '#9a9a9a' }}>{order.service_key}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => doAction('start')} disabled={!!actionLoading || status === 'running'}
            style={{ height: '34px', padding: '0 14px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ▶ Start
          </button>
          <button onClick={() => doAction('stop')} disabled={!!actionLoading || status !== 'running'}
            style={{ height: '34px', padding: '0 14px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ■ Stop
          </button>
          <button onClick={() => doAction('restart')} disabled={!!actionLoading}
            style={{ height: '34px', padding: '0 14px', background: '#f7f7f7', color: '#333', border: '1px solid #d4d4d4', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            ↺ Restart
          </button>
          <button onClick={() => {
            const vncUrl = `https://${instance?.vncIp || pd?.vncIp}:${instance?.vncPort || pd?.vncPort}`
            window.open(vncUrl, '_blank')
          }} disabled={!instance?.vncIp && !pd?.vncIp}
            style={{ height: '34px', padding: '0 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            🖥 VNC
          </button>
        </div>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>{success}</div>}

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #ebebeb', display: 'flex', gap: '0' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1a6ef5' : '#666', background: 'none', border: 'none', borderBottom: tab === t ? '2px solid #1a6ef5' : '2px solid transparent', cursor: 'pointer', marginBottom: '-1px' }}>
            {t}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {tab === 'Overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'IP Address', value: ip },
            { label: 'Status', value: status },
            { label: 'Plan', value: order.service_key },
            { label: 'Region', value: instance?.region || 'EU' },
            { label: 'OS', value: instance?.osType || pd?.osType || 'Linux' },
            { label: 'SSH User', value: order.ssh_user || 'admin' },
            { label: 'vCPU', value: instance?.cpuCores ? `${instance.cpuCores} vCPU` : '—' },
            { label: 'RAM', value: instance?.ramMb ? `${Math.round(instance.ramMb / 1024)}GB` : '—' },
            { label: 'Disk', value: instance?.diskMb ? `${Math.round(instance.diskMb / 1024)}GB SSD` : '—' },
            { label: 'Created', value: order.created_at?.substring(0, 10) || '—' },
            { label: 'Expires', value: order.expires_at?.substring(0, 10) || '—' },
            { label: 'IPv6', value: instance?.ipConfig?.v6?.ip || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9a9a9a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: label === 'IP Address' || label === 'IPv6' ? 'monospace' : 'inherit' }}>{value}</p>
            </div>
          ))}

          {/* Add-on upsells */}
          {!hasBackup && (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', padding: '14px 16px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '2px' }}>Auto Backup</p>
                <p style={{ fontSize: '11px', color: '#9a9a9a' }}>Daily automated backups with 7-day retention — add to next renewal</p>
              </div>
              <button style={{ height: '32px', padding: '0 14px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', color: '#333', whiteSpace: 'nowrap' }}>
                Add Backup
              </button>
            </div>
          )}

          {/* Terminal shortcut */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '8px', padding: '14px 16px', gridColumn: 'span 2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#e5e5e5', marginBottom: '2px' }}>Terminal Access</p>
              <p style={{ fontSize: '11px', color: '#6b7280' }}>Open a browser shell — no SSH client needed</p>
            </div>
            <Link href="/cli" style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', borderRadius: '7px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
              Open Terminal →
            </Link>
          </div>
        </div>
      )}

      {/* Snapshots tab */}
      {tab === 'Snapshots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Point-in-time snapshots of your VPS</p>
            <button onClick={() => doAction('snapshot')} disabled={!!actionLoading}
              style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
              {actionLoading === 'snapshot' ? 'Creating...' : '+ Create Snapshot'}
            </button>
          </div>
          {snapshots.length === 0 ? (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No snapshots</p>
              <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Create a snapshot to save the current state of your VPS</p>
            </div>
          ) : (
            <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #ebebeb' }}>
                    {['Name', 'Created', 'Size', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((s: any) => (
                    <tr key={s.snapshotId} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.name || s.snapshotId}</td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>{s.createdDate?.substring(0, 10)}</td>
                      <td style={{ padding: '12px 16px', color: '#666' }}>{s.diskMb ? `${(s.diskMb/1024).toFixed(1)}GB` : '—'}</td>
                      <td style={{ padding: '12px 16px', display: 'flex', gap: '6px' }}>
                        <button onClick={() => doAction('rollback', { snapshotId: s.snapshotId })}
                          style={{ padding: '4px 10px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>
                          Restore
                        </button>
                        <button onClick={() => doAction('delete_snapshot', { snapshotId: s.snapshotId })}
                          style={{ padding: '4px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', color: '#dc2626' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Images tab */}
      {tab === 'Images' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '10px 14px' }}>
            ⚠️ Installing a new OS will permanently wipe all data on this VPS.
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={imageSearch}
              onChange={e => setImageSearch(e.target.value)}
              placeholder="Search images..."
              style={{ flex: 1, height: '36px', border: '1px solid #d4d4d4', borderRadius: '7px', padding: '0 12px', fontSize: '13px', outline: 'none' }}
            />
            {['all', 'Linux', 'Windows'].map(f => (
              <button key={f} onClick={() => setImageFilter(f)}
                style={{ height: '36px', padding: '0 14px', background: imageFilter === f ? '#1a6ef5' : '#f7f7f7', color: imageFilter === f ? '#fff' : '#333', border: `1px solid ${imageFilter === f ? '#1a6ef5' : '#d4d4d4'}`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#f7f7f7', borderBottom: '1px solid #ebebeb' }}>
                  {['Image', 'Type', 'Version', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {images.length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#9a9a9a' }}>Loading images...</td></tr>
                ) : images
                  .filter((img: any) => {
                    const matchOs = imageFilter === 'all' || img.osType === imageFilter
                    const matchSearch = !imageSearch || img.name.toLowerCase().includes(imageSearch.toLowerCase()) || img.version?.toLowerCase().includes(imageSearch.toLowerCase())
                    return matchOs && matchSearch
                  })
                  .map((img: any) => (
                  <tr key={img.imageId} style={{ borderBottom: '1px solid #f0f0f0' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                    onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0a0a0a' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>{img.osType === 'Windows' ? '🪟' : '🐧'}</span>
                        {img.name}
                      </div>
                    </td>
                    <td style={{ padding: '11px 16px' }}>
                      <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: img.osType === 'Windows' ? '#eff6ff' : '#eaf3de', color: img.osType === 'Windows' ? '#1a6ef5' : '#3b6d11' }}>
                        {img.osType}
                      </span>
                    </td>
                    <td style={{ padding: '11px 16px', color: '#666', fontSize: '12px' }}>{img.version}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <button onClick={() => {
                        if (confirm(`Install ${img.name}? All data on this VPS will be permanently wiped.`)) {
                          doAction('reinstall', { imageId: img.imageId })
                        }
                      }} disabled={!!actionLoading}
                        style={{ padding: '5px 12px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
                        Install
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{images.filter((img: any) => (imageFilter === 'all' || img.osType === imageFilter) && (!imageSearch || img.name.toLowerCase().includes(imageSearch.toLowerCase()))).length} of {images.length} images shown</p>
        </div>
      )}

      {/* Backups tab - only shown if addon active */}
      {tab === 'Backups' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Automatic daily backups with retention management.</p>
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '24px' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>Auto Backup active</p>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Your VPS is being backed up automatically. Contact support to manage retention settings.</p>
          </div>
        </div>
      )}

      {/* Network tab - only shown if addon active */}
      {tab === 'Network' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {[
            { label: 'IPv4 Address', value: ip },
            { label: 'IPv6 Address', value: instance?.ipConfig?.v6?.ip || '—' },
            { label: 'Gateway', value: instance?.ipConfig?.v4?.gateway || '—' },
            { label: 'MAC Address', value: instance?.macAddress || '—' },
            { label: 'Data Centre', value: instance?.dataCenter || '—' },
            { label: 'Region', value: instance?.regionName || instance?.region || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', padding: '14px 16px' }}>
              <p style={{ fontSize: '11px', color: '#9a9a9a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{label}</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'monospace' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Firewall tab */}
      {tab === 'Firewall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Firewall rules control inbound and outbound traffic to your VPS.</p>
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No firewall configured</p>
            <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '16px' }}>Create a firewall to control traffic to this instance</p>
            <button onClick={() => doAction('create_firewall')} disabled={!!actionLoading}
              style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Create Firewall
            </button>
          </div>
        </div>
      )}

      {/* DNS tab */}
      {tab === 'DNS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Manage DNS zones for your VPS IP address <strong style={{ fontFamily: 'monospace' }}>{ip}</strong></p>
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No DNS zones configured</p>
            <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '16px' }}>Create a DNS zone to manage records for a domain pointing to this VPS</p>
            <button onClick={() => doAction('create_dns_zone')} disabled={!!actionLoading}
              style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              + Create DNS Zone
            </button>
          </div>
        </div>
      )}

      {/* Actions tab */}
      {tab === 'Actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Create Snapshot', desc: 'Save current state — can be restored later', action: 'snapshot', color: '#3b6d11', bg: '#eaf3de' },
              { label: 'Graceful Shutdown', desc: 'Send shutdown signal — OS closes cleanly', action: 'shutdown', color: '#854d0e', bg: '#fefce8' },
              { label: 'Rescue Mode', desc: 'Boot into rescue system for emergency access', action: 'rescue', color: '#7c3aed', bg: '#f5f3ff' },
              { label: 'Reset Password', desc: 'Reset root/admin password via email', action: 'reset_credentials', color: '#1a6ef5', bg: '#eff6ff' },
            ].map(({ label, desc, action, color, bg }) => (
              <div key={action} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '18px' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px' }}>{label}</p>
                <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '12px' }}>{desc}</p>
                <button onClick={() => doAction(action)} disabled={!!actionLoading}
                  style={{ height: '32px', padding: '0 14px', background: bg, color, border: `1px solid ${color}33`, borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                  {actionLoading === action ? 'Processing...' : label}
                </button>
              </div>
            ))}
          </div>

          {/* Danger zone */}
          <div style={{ border: '1px solid #fca5a5', borderRadius: '10px', padding: '18px', background: '#fef2f2' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>⚠️ Danger Zone</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '2px' }}>Cancel VPS</p>
                <p style={{ fontSize: '12px', color: '#9a9a9a' }}>Schedule cancellation at end of billing period. Data will be permanently deleted.</p>
              </div>
              <button onClick={() => { if (confirm('Cancel this VPS? It will be terminated at end of billing period and all data deleted.')) doAction('cancel') }} disabled={!!actionLoading}
                style={{ height: '34px', padding: '0 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                Cancel VPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
