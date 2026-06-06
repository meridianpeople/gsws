'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function VPSPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/compute/vps').then(r => r.json()).then(d => {
      setOrders(d.orders || [])
    }).finally(() => setLoading(false))
  }, [])

  const statusColor = (s: string) => s === 'active' || s === 'running' ? '#3b6d11' : s === 'pending' ? '#854d0e' : '#dc2626'
  const statusBg = (s: string) => s === 'active' || s === 'running' ? '#eaf3de' : s === 'pending' ? '#fefce8' : '#fef2f2'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Cloud VPS</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>
            High-performance virtual servers powered by Contabo — EU, UK, US, Singapore, Australia
          </p>
        </div>
        <Link href="/compute/vps/new"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Order new VPS
        </Link>
      </div>

      {/* Stats row */}
      {orders.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total instances', value: orders.length },
            { label: 'Active', value: orders.filter(o => o.status === 'active' || o.status === 'running').length },
            { label: 'Monthly spend', value: `£${orders.reduce((sum, o) => sum + (o.price_inc_vat || 0), 0).toFixed(2)}` },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '16px 20px' }}>
              <p style={{ fontSize: '11px', color: '#9a9a9a', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#0a0a0a' }}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Instance list */}
      {loading ? (
        <div style={{ color: '#9a9a9a', fontSize: '13px' }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '60px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', background: '#f3f4f6', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No VPS instances yet</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '20px' }}>Deploy a cloud VPS in seconds — choose your plan, region and OS.</p>
          <Link href="/compute/vps/new"
            style={{ display: 'inline-flex', height: '38px', alignItems: 'center', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Order your first VPS
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {orders.map(o => {
            const pd = o.provider_data ? JSON.parse(o.provider_data) : null
            const ip = o.ssh_host || pd?.ipConfig?.v4?.ip || '—'
            const name = o.notes?.replace('Imported: ', '') || pd?.displayName || o.service_key
            const cpu = pd?.productType?.cpuCores || '—'
            const ram = pd?.productType?.ramMb ? `${pd.productType.ramMb / 1024}GB` : '—'
            const disk = pd?.productType?.diskMb ? `${pd.productType.diskMb / 1024}GB` : '—'
            const region = pd?.region || 'EU'

            return (
              <Link key={o.id} href={`/compute/vps/${o.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '16px 20px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: '16px', alignItems: 'center', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1a6ef5')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#ebebeb')}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '2px' }}>{name}</p>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', fontFamily: 'monospace' }}>{ip} · {region}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>Plan</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>{o.service_key}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>Specs</p>
                    <p style={{ fontSize: '12px', color: '#333' }}>{cpu} vCPU · {ram}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>Disk</p>
                    <p style={{ fontSize: '12px', color: '#333' }}>{disk} SSD</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>Price</p>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>£{(o.price_inc_vat || 0).toFixed(2)}/mo</p>
                  </div>
                  <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: statusBg(o.status), color: statusColor(o.status), whiteSpace: 'nowrap' }}>
                    ● {o.status}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
