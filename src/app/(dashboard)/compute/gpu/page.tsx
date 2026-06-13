'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

function IconGPU() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3"/></svg> }

export default function GPUPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/compute/gpu').then(r => r.json()).then(d => setOrders(d.orders || [])).finally(() => setLoading(false))
  }, [])

  const active = orders.filter(o => o.status === 'active').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .gpu-row:hover { border-color: #0a0a0a !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Compute</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>GPU Compute</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>High-performance GPU instances — hourly, daily, weekly, monthly or annual</p>
        </div>
        <Link href="/compute/gpu/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', height: '38px', padding: '0 18px', background: '#0a0a0a', color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Order GPU
        </Link>
      </div>

      {/* Stats */}
      {orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'TOTAL INSTANCES', value: orders.length },
            { label: 'ACTIVE', value: active },
            { label: 'HOURLY SPEND', value: `£${orders.filter(o => o.status === 'active' && o.billing_period === 'hourly').reduce((s, o) => s + (o.price_inc_vat || 0), 0).toFixed(3)}/hr` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '16px 20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* GPU tiers preview */}
      {orders.length === 0 && !loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Entry', vram: '16GB', desc: 'RTX 5060 Ti · RTX 5070 Ti', from: '£0.27/hr', color: '#6b7280', bg: '#f9fafb' },
            { label: 'Workstation', vram: '24–32GB', desc: 'RTX PRO 4000 · RTX 5090', from: '£0.74/hr', color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Pro', vram: '45–48GB', desc: 'L40 · L40S · RTX 4090', from: '£0.86/hr', color: '#8b5cf6', bg: '#f5f3ff' },
            { label: 'Data Centre', vram: '80GB', desc: 'A100 · H100 SXM', from: '£2.20/hr', color: '#f59e0b', bg: '#fffbeb' },
            { label: 'HPC', vram: '94–96GB', desc: 'H100 NVL · RTX PRO 6000', from: '£2.94/hr', color: '#ef4444', bg: '#fef2f2' },
            { label: 'Elite', vram: '140GB+', desc: 'H200 · B200 · B300', from: '£15.26/hr', color: '#10b981', bg: '#f0fdf4' },
          ].map(t => (
            <Link key={t.label} href="/compute/gpu/new" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '11px', padding: '16px 18px', transition: 'border-color 0.15s', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#0a0a0a')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#ebebeb')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div style={{ width: '32px', height: '32px', background: t.bg, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: t.color }}><IconGPU /></div>
                  <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: t.bg, color: t.color }}>{t.vram}</span>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{t.label}</p>
                <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '8px' }}>{t.desc}</p>
                <p style={{ fontSize: '12px', fontWeight: 600, color: t.color }}>from {t.from}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Instance list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #e5e5e5', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading...</span>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '14px', padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: 'var(--card-bg-elevated)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--text-secondary)' }}><IconGPU /></div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.01em' }}>No GPU instances</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '24px' }}>Deploy a GPU instance in minutes — choose your class, node and billing period.</p>
          <Link href="/compute/gpu/new" style={{ display: 'inline-flex', height: '38px', alignItems: 'center', padding: '0 20px', background: '#0a0a0a', color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Order your first GPU
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orders.map(o => {
            const isActive = o.status === 'active'
            const isPending = o.status === 'pending'
            const isSuspended = o.status === 'suspended'
            const expiresAt = o.expires_at ? new Date(o.expires_at) : null
            const hoursLeft = expiresAt ? Math.max(0, (expiresAt.getTime() - Date.now()) / 3600000) : 0

            return (
              <div key={o.id} className="gpu-row" onClick={() => window.location.href=`/compute/gpu/${o.id}`} style={{ cursor: 'pointer', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '11px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '2fr 120px 160px 100px 120px', gap: '16px', alignItems: 'center', transition: 'border-color 0.15s, box-shadow 0.15s' }}>
                {/* Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', background: isActive ? '#f0fdf4' : isPending ? '#fffbeb' : '#f7f7f7', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#15803d' : isPending ? '#b45309' : '#9a9a9a', flexShrink: 0 }}>
                    <IconGPU />
                  </div>
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>#{o.id} · {o.tier}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.billing_period} · {o.notes?.replace('template:', '')?.split(':')[0] || ''}</p>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>Status</p>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                    background: isActive ? '#f0fdf4' : isPending ? '#fffbeb' : isSuspended ? '#fef2f2' : '#f7f7f7',
                    color: isActive ? '#15803d' : isPending ? '#b45309' : isSuspended ? '#dc2626' : '#666' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isActive ? '#4ade80' : isPending ? '#fbbf24' : '#f87171', display: 'inline-block' }} />
                    {o.status}
                  </span>
                </div>

                {/* Expiry */}
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>Expires</p>
                  <p style={{ fontSize: '12px', color: hoursLeft < 2 ? '#dc2626' : '#333', fontFamily: "'DM Mono', monospace" }}>
                    {expiresAt ? expiresAt.toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                  </p>
                  {isActive && hoursLeft < 2 && <p style={{ fontSize: '10px', color: '#dc2626' }}>⚠ {hoursLeft.toFixed(1)}hr left</p>}
                </div>

                {/* Price */}
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>Rate</p>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>£{o.price_inc_vat?.toFixed(2)}/{o.billing_period === 'hourly' ? 'hr' : o.billing_period}</p>
                </div>

                {/* Instance ID */}
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '3px' }}>Instance</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}>
                    {o.provider_instance_id ? `#${o.provider_instance_id}` : <span style={{ color: '#f59e0b' }}>Provisioning...</span>}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
