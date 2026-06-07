'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

function IconGPU() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3"/></svg> }
function IconTerminal() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg> }
function IconPlay() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> }
function IconStop() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg> }
function IconReboot() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg> }
function IconTrash() { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg> }

export default function GPUDetailPage() {
  const { id } = useParams() as { id: string }
  const [order, setOrder] = useState<any>(null)
  const [instance, setInstance] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState('')

  useEffect(() => { loadData() }, [])

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
    if (action === 'destroy' && confirm !== 'destroy') { setConfirm('destroy'); return }
    setActionLoading(action); setError('')
    try {
      const res = await fetch(`/api/compute/gpu/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })
      const d = await res.json()
      if (!res.ok) { setError(d.error); return }
      if (action === 'destroy') { window.location.href = '/compute/gpu'; return }
      await loadData()
    } catch { setError('Action failed') }
    finally { setActionLoading(''); setConfirm('') }
  }

  if (loading) return <div style={{ padding: '48px', textAlign: 'center', color: '#9a9a9a', fontFamily: 'DM Sans' }}>Loading...</div>
  if (!order) return <div style={{ padding: '48px', textAlign: 'center', color: '#9a9a9a' }}>Instance not found</div>

  const isActive = order.status === 'active'
  const isStopped = order.status === 'stopped'
  const gpu = instance?.gpu_name || order.tier
  const vram = instance ? `${Math.round((instance.gpu_mem_bw || instance.gpu_ram || 16000) / 1000)}GB` : '—'
  const cpuUtil = instance?.cpu_util !== undefined ? `${(instance.cpu_util * 100).toFixed(1)}%` : '—'
  const gpuUtil = instance?.gpu_util !== undefined ? `${(instance.gpu_util * 100).toFixed(1)}%` : '—'
  const gpuTemp = instance?.gpu_temp ? `${instance.gpu_temp.toFixed(0)}°C` : '—'
  const expiresAt = order.expires_at ? new Date(order.expires_at) : null
  const hoursLeft = expiresAt ? Math.max(0, (expiresAt.getTime() - Date.now()) / 3600000) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'DM Sans', sans-serif", maxWidth: '900px' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Breadcrumb + header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <Link href="/compute/gpu" style={{ fontSize: '13px', color: '#9a9a9a', textDecoration: 'none' }}>GPU Compute</Link>
          <span style={{ color: '#9a9a9a' }}>›</span>
          <span style={{ fontSize: '13px', color: '#0a0a0a' }}>#{order.id} · {order.tier}</span>
        </div>

        {/* Dark hero header */}
        <div style={{ background: '#0a0a0a', borderRadius: '14px', padding: '24px 28px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', background: '#1a1a1a', borderRadius: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ade80' }}>
              <IconGPU />
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
                {instance?.gpu_name || `${order.tier} GPU`}
              </h1>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px', fontFamily: "'DM Mono', monospace" }}>
                #{order.provider_instance_id} · {order.ssh_host}:{order.ssh_port}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 700,
              background: isActive ? '#166534' : '#333', color: isActive ? '#4ade80' : '#9a9a9a' }}>
              ● {order.status}
            </span>
            {order.ssh_host && (
              <Link href={`/cli?type=gpu&orderId=${order.id}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
                <IconTerminal /> Open Terminal
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#dc2626' }}>{error}</div>}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'GPU', value: instance?.gpu_name || order.tier },
          { label: 'VRAM', value: instance?.gpu_ram ? `${Math.round(instance.gpu_ram / 1024)}GB` : '16GB' },
          { label: 'CPU', value: instance?.cpu_cores ? `${instance.cpu_cores} cores` : '—' },
          { label: 'RAM', value: instance?.cpu_ram ? `${Math.round(instance.cpu_ram / 1024)}GB` : '—' },
          { label: 'GPU UTIL', value: gpuUtil },
          { label: 'GPU TEMP', value: gpuTemp },
          { label: 'CPU UTIL', value: cpuUtil },
          { label: 'DISK', value: instance?.disk_space ? `${instance.disk_space}GB` : `${order.disk_gb || 20}GB` },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '6px' }}>{label}</p>
            <p style={{ fontSize: '16px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.01em', fontFamily: "'DM Mono', monospace" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Billing */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '18px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '14px' }}>Billing</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Rate', value: `£${order.price_inc_vat?.toFixed(3)}/${order.billing_period === 'hourly' ? 'hr' : order.billing_period}` },
            { label: 'Period', value: order.billing_period },
            { label: 'Expires', value: expiresAt ? expiresAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—' },
            { label: 'Time left', value: isActive ? `${hoursLeft.toFixed(1)} hrs` : '—' },
          ].map(({ label, value }) => (
            <div key={label}>
              <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</p>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '18px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '14px' }}>Actions</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { action: 'start', label: 'Start', icon: <IconPlay />, color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', show: !isActive },
            { action: 'stop', label: 'Stop', icon: <IconStop />, color: '#854d0e', bg: '#fffbeb', border: '#fde68a', show: isActive },
            { action: 'reboot', label: 'Reboot', icon: <IconReboot />, color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', show: isActive },
            { action: 'destroy', label: confirm === 'destroy' ? 'Click again to confirm' : 'Destroy', icon: <IconTrash />, color: '#dc2626', bg: '#fef2f2', border: '#fca5a5', show: true },
          ].filter(a => a.show).map(({ action, label, icon, color, bg, border }) => (
            <button key={action} onClick={() => doAction(action)} disabled={!!actionLoading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px', background: bg, color, border: `1px solid ${border}`, borderRadius: '8px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: actionLoading === action ? 0.6 : 1 }}>
              {icon}{actionLoading === action ? 'Working...' : label}
            </button>
          ))}
        </div>
      </div>

      {/* Connection info */}
      {order.ssh_host && (
        <div style={{ background: '#0a0a0a', borderRadius: '10px', padding: '16px 20px' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '10px' }}>SSH Connection</p>
          <code style={{ fontSize: '12px', color: '#4ade80', fontFamily: "'DM Mono', monospace" }}>
            ssh -p {order.ssh_port} root@{order.ssh_host}
          </code>
          {order.ssh_host && (
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '6px' }}>
              IP: {instance?.public_ipaddr || '—'} · Instance: #{order.provider_instance_id}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
