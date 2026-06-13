'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

function IcoGPU() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3"/></svg> }
function IcoTerminal() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> }
function IcoStop() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> }
function IcoPlay() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
function IcoReboot() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function IcoTrash() { return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg> }
function IcoPencil() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> }

export default function GPUDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [order, setOrder] = useState<any>(null)
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [confirmDestroy, setConfirmDestroy] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [logs, setLogs] = useState('')
  const [showLogs, setShowLogs] = useState(false)
  const [loadingLogs, setLoadingLogs] = useState(false)

  useEffect(() => { if (id) loadData() }, [id])

  async function loadData() {
    try {
      const res = await fetch(`/api/compute/gpu/${id}`)
      const d = await res.json()
      setOrder(d.order)
      setInstance(d.instance)
    } catch {}
    setLoading(false)
  }

  async function doAction(action: string) {
    if (action === 'destroy' && !confirmDestroy) { setConfirmDestroy(true); return }
    setActionLoading(action); setError('')
    try {
      const res = await fetch(`/api/compute/gpu/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error || 'Action failed'); return }
      if (action === 'destroy') { router.push('/compute/gpu'); return }
      setConfirmDestroy(false)
      await loadData()
    } catch { setError('Action failed') }
    finally { setActionLoading('') }
  }

  async function fetchLogs() {
    setShowLogs(true); setLoadingLogs(true)
    try {
      const res = await fetch(`/api/compute/gpu/${id}/logs`)
      const d = await res.json()
      setLogs(d.logs || 'No logs available')
    } catch { setLogs('Failed to fetch logs') }
    setLoadingLogs(false)
  }

  async function doRename() {
    if (!newName.trim()) return
    setActionLoading('rename')
    try {
      await fetch(`/api/compute/gpu/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', label: newName.trim() })
      })
      setRenaming(false)
      await loadData()
    } catch {}
    setActionLoading('')
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
  if (!order) return <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>Instance not found</div>

  const isActive = order.status === 'active'
  const gpuName = instance?.gpu_name || order.tier
  const vram = instance?.gpu_ram ? `${Math.round(instance.gpu_ram / 1024)}GB` : '16GB'
  const cpu = instance?.cpu_cores ? `${instance.cpu_cores} cores` : '—'
  const ram = instance?.cpu_ram ? `${Math.round(instance.cpu_ram / 1024)}GB` : '—'
  const gpuUtil = instance?.gpu_util !== undefined ? `${(instance.gpu_util * 100).toFixed(1)}%` : '0.0%'
  const gpuTemp = (instance?.gpu_temp !== undefined && instance?.gpu_temp !== null && instance.gpu_temp > 0) ? `${Number(instance.gpu_temp).toFixed(0)}°C` : '—'
  const cpuUtil = instance?.cpu_util !== undefined ? `${(instance.cpu_util * 100).toFixed(1)}%` : '0.0%'
  const disk = instance?.disk_space ? `${instance.disk_space}GB` : `${order.disk_gb || 20}GB`
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null
  const hoursLeft = expiresAt ? Math.max(0, (expiresAt.getTime() - Date.now()) / 3600000) : 0

  const statItems = [
    { label: 'GPU', value: gpuName },
    { label: 'VRAM', value: vram },
    { label: 'CPU', value: cpu },
    { label: 'RAM', value: ram },
    { label: 'GPU UTIL', value: gpuUtil },
    { label: 'GPU TEMP', value: gpuTemp },
    { label: 'CPU UTIL', value: cpuUtil },
    { label: 'DISK', value: disk },
  ]

  const billingItems = [
    { label: 'RATE', value: `£${order.price_inc_vat?.toFixed(3)}/${order.billing_period === 'hourly' ? 'hr' : order.billing_period}` },
    { label: 'PERIOD', value: order.billing_period },
    { label: 'EXPIRES', value: expiresAt ? expiresAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
    { label: 'TIME LEFT', value: `${hoursLeft.toFixed(1)} hrs` },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Link href="/compute/gpu" style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>GPU Compute</Link>
        <span style={{ color: 'var(--text-secondary)' }}>›</span>
        <span style={{ fontSize: '13px', color: 'var(--text-primary)' }}>#{order.id} · {order.tier}</span>
      </div>

      {/* Dark hero */}
      <div style={{ background: '#0a0a0a', borderRadius: '14px', padding: '22px 26px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', background: '#1a1a1a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
            <IcoGPU />
          </div>
          <div>
            {renaming ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') doRename(); if (e.key === 'Escape') setRenaming(false) }}
                  autoFocus
                  style={{ fontSize: '15px', fontWeight: 700, background: '#1a1a1a', border: '1px solid #444', borderRadius: '6px', padding: '4px 10px', color: '#fff', fontFamily: 'inherit', width: '180px' }} />
                <button onClick={doRename} style={{ fontSize: '11px', padding: '4px 10px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Save</button>
                <button onClick={() => setRenaming(false)} style={{ fontSize: '11px', padding: '4px 10px', background: '#333', color: '#aaa', border: 'none', borderRadius: '6px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{gpuName}</h1>
                <button onClick={() => { setNewName(instance?.label || gpuName); setRenaming(true) }}
                  style={{ background: 'none', border: '1px solid #333', borderRadius: '5px', padding: '2px 8px', color: 'var(--text-secondary)', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <IcoPencil /> Rename
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', fontFamily: "'DM Mono', monospace" }}>
              Instance #{order.provider_instance_id} · Port {order.ssh_port}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: isActive ? '#166534' : '#333', color: isActive ? '#4ade80' : '#9a9a9a' }}>
            ● {order.status}
          </span>
          {order.ssh_host && (
            <Link href={`/cli?type=gpu&orderId=${order.id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
              <IcoTerminal /> Open Terminal
            </Link>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>
      )}

      {/* Stats */}
      <div className="gsws-grid-multi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {statItems.map(({ label, value }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Billing */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '18px 20px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '14px' }}>Billing</p>
        <div className="gsws-grid-multi" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {billingItems.map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '18px 20px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '14px' }}>Actions</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {isActive && (
            <button onClick={() => doAction('stop')} disabled={!!actionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#fffbeb', color: '#854d0e', border: '1px solid #fde68a', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <IcoStop /> {actionLoading === 'stop' ? 'Stopping...' : 'Stop'}
            </button>
          )}
          {!isActive && (
            <button onClick={() => doAction('start')} disabled={!!actionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <IcoPlay /> {actionLoading === 'start' ? 'Starting...' : 'Start'}
            </button>
          )}
          {isActive && (
            <button onClick={() => doAction('reboot')} disabled={!!actionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <IcoReboot /> {actionLoading === 'reboot' ? 'Rebooting...' : 'Reboot'}
            </button>
          )}
          <button onClick={() => doAction('destroy')} disabled={!!actionLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: confirmDestroy ? '#dc2626' : '#fef2f2', color: confirmDestroy ? '#fff' : '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <IcoTrash /> {actionLoading === 'destroy' ? 'Destroying...' : confirmDestroy ? 'Confirm Destroy' : 'Destroy'}
          </button>
          <button onClick={() => doAction('reinstall')} disabled={!!actionLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {actionLoading === 'reinstall' ? 'Reinstalling...' : 'Reinstall'}
          </button>
          <button onClick={fetchLogs}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: 'var(--card-bg-elevated)', color: '#333', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Logs
          </button>
          {confirmDestroy && (
            <button onClick={() => setConfirmDestroy(false)}
              style={{ height: '34px', padding: '0 14px', background: 'var(--card-bg-elevated)', color: 'var(--text-secondary)', border: '1px solid #e5e5e5', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Logs panel */}
      {showLogs && (
        <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Instance Logs</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => doAction('reinstall')} disabled={!!actionLoading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#f5f3ff', color: '#6d28d9', border: '1px solid #ddd6fe', borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            {actionLoading === 'reinstall' ? 'Reinstalling...' : 'Reinstall'}
          </button>
          <button onClick={fetchLogs} style={{ fontSize: '11px', padding: '3px 10px', background: '#1a1a1a', color: 'var(--text-secondary)', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Refresh</button>
              <button onClick={() => setShowLogs(false)} style={{ fontSize: '11px', padding: '3px 10px', background: '#1a1a1a', color: 'var(--text-secondary)', border: '1px solid #333', borderRadius: '5px', cursor: 'pointer' }}>Close</button>
            </div>
          </div>
          {loadingLogs ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Fetching logs...</p>
          ) : (
            <pre style={{ color: '#4ade80', fontSize: '11px', fontFamily: "'DM Mono', monospace", overflowX: 'auto', whiteSpace: 'pre-wrap', maxHeight: '400px', overflowY: 'auto', margin: 0 }}>{logs}</pre>
          )}
        </div>
      )}

      {/* SSH */}
      {order.ssh_host && (
        <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '16px 20px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>SSH Connection</p>
          <code style={{ fontSize: '13px', color: '#4ade80', fontFamily: "'DM Mono', monospace" }}>
            ssh -p {order.ssh_port} root@{instance?.public_ipaddr || order.ssh_host}
          </code>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            IP: {instance?.public_ipaddr || '—'} · Port: {order.ssh_port}
          </p>
        </div>
      )}
    </div>
  )
}
