'use client'
import { useState, useEffect } from 'react'

const PLANS = [
  { key: 'vps_s',   label: 'VPS S',   cpu: 4,  ram: 8,   disk: 100,  bw: 32,  price: 8.40,  color: '#3b82f6' },
  { key: 'vps_m',   label: 'VPS M',   cpu: 6,  ram: 16,  disk: 200,  bw: 32,  price: 16.80, color: '#8b5cf6' },
  { key: 'vps_l',   label: 'VPS L',   cpu: 8,  ram: 30,  disk: 400,  bw: 32,  price: 28.00, color: '#f59e0b' },
  { key: 'vps_xl',  label: 'VPS XL',  cpu: 10, ram: 60,  disk: 1000, bw: 32,  price: 56.00, color: '#ef4444' },
  { key: 'vps_2xl', label: 'VPS 2XL', cpu: 12, ram: 120, disk: 1600, bw: 32,  price: 98.00, color: '#10b981' },
]

const IMAGES = [
  { key: 'ubuntu-24.04',    label: 'Ubuntu 24.04 LTS',    icon: '🐧', type: 'Linux' },
  { key: 'ubuntu-22.04',    label: 'Ubuntu 22.04 LTS',    icon: '🐧', type: 'Linux' },
  { key: 'debian-12',       label: 'Debian 12',           icon: '🐧', type: 'Linux' },
  { key: 'windows-2025',    label: 'Windows Server 2025', icon: '🪟', type: 'Windows' },
  { key: 'windows-2022',    label: 'Windows Server 2022', icon: '🪟', type: 'Windows' },
  { key: 'ubuntu-24-plesk', label: 'Ubuntu 24 + Plesk',   icon: '⚙️', type: 'Panel' },
  { key: 'ubuntu-24-cpanel',label: 'Ubuntu 24 + cPanel',  icon: '⚙️', type: 'Panel' },
]

const REGIONS = [
  { key: 'EU',       label: 'EU (Germany)',       flag: '🇩🇪' },
  { key: 'UK',       label: 'UK (London)',         flag: '🇬🇧' },
  { key: 'US-east',  label: 'US East',             flag: '🇺🇸' },
  { key: 'US-central',label: 'US Central',         flag: '🇺🇸' },
  { key: 'SIN',      label: 'Singapore',           flag: '🇸🇬' },
  { key: 'AUS',      label: 'Australia',           flag: '🇦🇺' },
]

const PERIODS = [
  { value: 1,  label: '1 Month',  discount: '' },
  { value: 3,  label: '3 Months', discount: '5% off' },
  { value: 6,  label: '6 Months', discount: '10% off' },
  { value: 12, label: '1 Year',   discount: '15% off' },
]

const PERIOD_DISCOUNT: Record<number, number> = { 1: 1.0, 3: 0.95, 6: 0.90, 12: 0.85 }

export default function VPSPage() {
  const [selectedPlan, setSelectedPlan] = useState('vps_s')
  const [selectedImage, setSelectedImage] = useState('ubuntu-24.04')
  const [selectedRegion, setSelectedRegion] = useState('EU')
  const [selectedPeriod, setSelectedPeriod] = useState(1)
  const [displayName, setDisplayName] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    try {
      const res = await fetch('/api/compute/vps')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {}
  }

  const plan = PLANS.find(p => p.key === selectedPlan)!
  const discount = PERIOD_DISCOUNT[selectedPeriod]
  const monthlyPrice = plan.price * discount
  const totalExVat = monthlyPrice * selectedPeriod
  const totalIncVat = totalExVat * 1.2

  async function handleOrder() {
    setOrdering(true); setError(''); setSuccess('')
    try {
      const res = await fetch('/api/compute/vps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_key: selectedPlan,
          image_key: selectedImage,
          region: selectedRegion,
          period: selectedPeriod,
          display_name: displayName || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
      loadOrders()
    } catch { setError('Order failed') }
    finally { setOrdering(false) }
  }

  async function handleAction(instanceId: string, action: string) {
    try {
      await fetch(`/api/compute/vps/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      loadOrders()
    } catch {}
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>VPS Hosting</h1>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>High-performance virtual servers via Contabo — EU, UK, US, Singapore, Australia</p>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}

      {/* Active VPS */}
      {orders.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>Your VPS Instances</h3>
          {orders.map(o => {
            const providerData = o.provider_data ? JSON.parse(o.provider_data) : null
            const ip = providerData?.ipConfig?.v4?.ip || providerData?.ipAddress || null
            return (
              <div key={o.id} style={{ padding: '14px', border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#111' }}>{o.service_key.toUpperCase()}</div>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Order #{o.id} · {new Date(o.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{ fontSize: '12px' }}>
                  {ip && <div style={{ fontWeight: 600, color: '#111', fontFamily: 'monospace' }}>{ip}</div>}
                  {o.provider_instance_id && <div style={{ color: '#666' }}>ID: {o.provider_instance_id}</div>}
                </div>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: o.status === 'active' ? '#dcfce7' : '#fef9c3', color: o.status === 'active' ? '#166534' : '#92400e' }}>
                    {o.status}
                  </span>
                </div>
                {o.provider_instance_id && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleAction(o.provider_instance_id, 'restart')}
                      style={{ padding: '6px 10px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>↺ Restart</button>
                    <button onClick={() => handleAction(o.provider_instance_id, 'stop')}
                      style={{ padding: '6px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', color: '#991b1b', fontWeight: 600 }}>■ Stop</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Step 1: Plan */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>1. Select plan</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {PLANS.map(p => (
            <button key={p.key} onClick={() => setSelectedPlan(p.key)}
              style={{ padding: '14px 10px', border: `2px solid ${selectedPlan === p.key ? p.color : '#e5e7eb'}`, borderRadius: '10px', background: selectedPlan === p.key ? `${p.color}15` : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: selectedPlan === p.key ? p.color : '#111' }}>{p.label}</div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '6px', lineHeight: '1.6' }}>
                {p.cpu} vCPU<br/>{p.ram}GB RAM<br/>{p.disk}GB SSD
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginTop: '8px' }}>£{p.price}/mo</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Region */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>2. Select region</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setSelectedRegion(r.key)}
              style={{ padding: '12px', border: `2px solid ${selectedRegion === r.key ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedRegion === r.key ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>{r.flag}</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: selectedRegion === r.key ? '#1a6ef5' : '#111' }}>{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3: OS */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>3. Operating system</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {IMAGES.map(img => (
            <button key={img.key} onClick={() => setSelectedImage(img.key)}
              style={{ padding: '12px', border: `2px solid ${selectedImage === img.key ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedImage === img.key ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ fontSize: '18px', marginBottom: '4px' }}>{img.icon}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: selectedImage === img.key ? '#1a6ef5' : '#111' }}>{img.label}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>{img.type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 4: Period */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>4. Contract period</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setSelectedPeriod(p.value)}
              style={{ padding: '12px', border: `2px solid ${selectedPeriod === p.value ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedPeriod === p.value ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: selectedPeriod === p.value ? '#1a6ef5' : '#111' }}>{p.label}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>£{(plan.price * PERIOD_DISCOUNT[p.value]).toFixed(2)}/mo</div>
              {p.discount && <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>{p.discount}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Name */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>5. Display name <span style={{ fontWeight: 400, color: '#9a9a9a' }}>(optional)</span></h3>
        <input type="text" placeholder="e.g. My Web Server" value={displayName} onChange={e => setDisplayName(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
      </div>

      {/* Order summary */}
      <div style={{ background: '#0a1628', borderRadius: '12px', padding: '20px', color: '#fff' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', color: '#e5e7eb' }}>Order summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>{plan.label} — {plan.cpu} vCPU, {plan.ram}GB RAM, {plan.disk}GB SSD</span>
            <span>£{monthlyPrice.toFixed(2)}/mo</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>Region</span>
            <span>{REGIONS.find(r => r.key === selectedRegion)?.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>OS</span>
            <span>{IMAGES.find(i => i.key === selectedImage)?.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>Period</span>
            <span>{selectedPeriod} month{selectedPeriod > 1 ? 's' : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>VAT (20%)</span>
            <span>£{(totalIncVat - totalExVat).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #1f2937', paddingTop: '10px', marginTop: '4px' }}>
            <span>Total</span>
            <span style={{ color: '#4ade80' }}>£{totalIncVat.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={handleOrder} disabled={ordering}
          style={{ width: '100%', height: '46px', background: ordering ? '#374151' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: ordering ? 'not-allowed' : 'pointer' }}>
          {ordering ? 'Provisioning...' : `Order ${plan.label} — £${totalIncVat.toFixed(2)} inc VAT`}
        </button>
        <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', margin: '10px 0 0' }}>
          Charged from credit balance · Provisioned automatically via Contabo · Root credentials sent by email
        </p>
      </div>
    </div>
  )
}
