'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ServerIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/>
    <path d="M6 6h.01M6 18h.01"/>
  </svg>
)

export default function VPSPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/compute/vps').then(r => r.json()).then(d => setOrders(d.orders || [])).finally(() => setLoading(false))
  }, [])

  const active = orders.filter(o => o.status === 'active' || o.status === 'running').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg) } }
        .vps-row { transition: border-color 0.15s, box-shadow 0.15s; }
        .vps-row:hover { border-color: #0a0a0a !important; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
        .vps-row:hover .vps-arrow { opacity: 1 !important; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '6px' }}>Compute</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em', margin: 0 }}>Cloud VPS</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>High-performance virtual servers across EU, UK, US, Singapore and Australia</p>
        </div>
        <Link href="/compute/vps/new" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', height: '38px', padding: '0 18px', background: '#0a0a0a', color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Order VPS
        </Link>
      </div>

      {/* Stats */}
      {orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'TOTAL INSTANCES', value: orders.length },
            { label: 'ACTIVE', value: active },
            { label: 'MONTHLY SPEND', value: `£${orders.reduce((s, o) => s + (o.price_inc_vat || 0), 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '16px 20px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '8px' }}>{label}</p>
              <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.02em' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '160px', gap: '10px' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #e5e5e5', borderTopColor: '#0a0a0a', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '13px', color: '#9a9a9a' }}>Loading...</span>
        </div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '14px', padding: '64px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#f7f7f7', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#9a9a9a' }}><ServerIcon /></div>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '6px', letterSpacing: '-0.01em' }}>No VPS instances</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '24px' }}>Deploy a cloud VPS in seconds — choose your plan, region and OS.</p>
          <Link href="/compute/vps/new" style={{ display: 'inline-flex', height: '38px', alignItems: 'center', padding: '0 20px', background: '#0a0a0a', color: '#fff', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Order your first VPS
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orders.map(o => {
            const pd = o.provider_data ? JSON.parse(o.provider_data) : null
            const ip = o.ssh_host || pd?.ipConfig?.v4?.ip || '—'
            const name = o.notes?.replace('Imported: ', '') || pd?.displayName || o.service_key
            const cpu = pd?.cpuCores || '—'
            const ram = pd?.ramMb ? `${pd.ramMb / 1024}GB` : '—'
            const disk = pd?.diskMb ? `${Math.round(pd.diskMb / 1024)}GB` : '—'
            const region = pd?.regionName || pd?.region || 'EU'
            const isActive = o.status === 'active' || o.status === 'running'

            return (
              <Link key={o.id} href={`/compute/vps/${o.id}`} style={{ textDecoration: 'none' }}>
                <div className="vps-row" style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '11px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '2fr 100px 200px 100px auto', gap: '16px', alignItems: 'center' }}>

                  {/* Name */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', background: isActive ? '#f0fdf4' : '#f7f7f7', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isActive ? '#15803d' : '#9a9a9a', flexShrink: 0 }}>
                      <ServerIcon />
                    </div>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '2px', letterSpacing: '-0.01em' }}>{name}</p>
                      <p style={{ fontSize: '11px', color: '#9a9a9a', fontFamily: "'DM Mono', monospace" }}>{ip} · {region}</p>
                    </div>
                  </div>

                  {/* Plan */}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '3px' }}>Plan</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>{o.service_key}</p>
                  </div>

                  {/* Specs */}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '3px' }}>Specs</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {[
                        { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>, val: `${cpu} vCPU` },
                        { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 12h.01M10 12h.01"/></svg>, val: ram },
                        { icon: <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>, val: `${disk} SSD` },
                      ].map(({ icon, val }) => (
                        <span key={val} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#555' }}>
                          {icon}{val}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a9a9a', marginBottom: '3px' }}>Price</p>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#333' }}>{o.price_inc_vat ? `£${o.price_inc_vat.toFixed(2)}/mo` : '—'}</p>
                  </div>

                  {/* Status */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: isActive ? '#f0fdf4' : '#f7f7f7', color: isActive ? '#15803d' : '#666', border: `1px solid ${isActive ? '#bbf7d0' : '#e5e5e5'}`, whiteSpace: 'nowrap' }}>
                      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: isActive ? '#4ade80' : '#9ca3af', display: 'inline-block' }} />
                      {o.status}
                    </span>
                    <svg className="vps-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2" style={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
