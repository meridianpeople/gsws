'use client'
import { useState, useEffect } from 'react'
import ConfirmModal from '@/components/ui/ConfirmModal'

const PLANS = [
  { key: 'vps_10_ssd', label: 'Cloud VPS 10', cpu: 4,  ram: 8,   disk: 150, storage: 'SSD', snapshots: 2, price: 6.80,  color: '#3b82f6', productId: 'V92' },
  { key: 'vps_20_ssd', label: 'Cloud VPS 20', cpu: 6,  ram: 12,  disk: 200, storage: 'SSD', snapshots: 2, price: 6.80,  color: '#8b5cf6', productId: 'V93' },
  { key: 'vps_30_ssd', label: 'Cloud VPS 30', cpu: 8,  ram: 24,  disk: 300, storage: 'SSD', snapshots: 2, price: 12.00, color: '#f59e0b', productId: 'V94' },
  { key: 'vps_40_ssd', label: 'Cloud VPS 40', cpu: 10, ram: 48,  disk: 400, storage: 'SSD', snapshots: 2, price: 20.00, color: '#ef4444', productId: 'V95' },
  { key: 'vps_50_ssd', label: 'Cloud VPS 50', cpu: 12, ram: 96,  disk: 600, storage: 'SSD', snapshots: 2, price: 36.00, color: '#10b981', productId: 'V96' },
]

const REGIONS = [
  { key: 'EU',         label: 'EU (Germany)',    flag: '🇩🇪', latency: '~20ms' },
  { key: 'UK',         label: 'UK (London)',      flag: '🇬🇧', latency: '~10ms' },
  { key: 'US-central', label: 'US Central',       flag: '🇺🇸', latency: '~100ms' },
  { key: 'US-east',    label: 'US East',          flag: '🇺🇸', latency: '~90ms' },
  { key: 'SIN',        label: 'Singapore',        flag: '🇸🇬', latency: '~160ms' },
  { key: 'AUS',        label: 'Australia',        flag: '🇦🇺', latency: '~200ms' },
]

const IMAGES = [
  { key: 'ubuntu-24.04',    label: 'Ubuntu 24.04 LTS',    icon: '🐧', type: 'Linux',   id: 'd64d5c6c-9dda-4e38-8174-0ee282474d8a' },
  { key: 'ubuntu-22.04',    label: 'Ubuntu 22.04 LTS',    icon: '🐧', type: 'Linux',   id: 'afecbb85-e2fc-46f0-9684-b46b1faf00bb' },
  { key: 'debian-12',       label: 'Debian 12',           icon: '🐧', type: 'Linux',   id: '4efbc0ba-2313-4fe1-842a-516f8652e729' },
  { key: 'windows-2025',    label: 'Windows Server 2025', icon: '🪟', type: 'Windows', id: '5af826e8-0e9d-4cec-9728-0966f98b4565' },
  { key: 'windows-2022',    label: 'Windows Server 2022', icon: '🪟', type: 'Windows', id: 'b5549695-970e-491a-827d-b314170154db' },
  { key: 'ubuntu-24-plesk', label: 'Ubuntu 24 + Plesk',   icon: '⚙️', type: 'Panel',   id: 'ab0751ce-49ff-4fd0-b919-2479b7c71fdb' },
  { key: 'ubuntu-24-cpanel',label: 'Ubuntu 24 + cPanel',  icon: '⚙️', type: 'Panel',   id: 'c0200107-cc26-4776-9775-1942841a473c' },
]

const PERIODS = [
  { value: 1,  label: '1 Month',  discount: 0 },
  { value: 3,  label: '3 Months', discount: 5 },
  { value: 6,  label: '6 Months', discount: 10 },
  { value: 12, label: '12 Months',discount: 20 },
]

export default function VPSPage() {
  const [selectedPlan, setSelectedPlan]       = useState('vps_10_ssd')
  const [selectedRegion, setSelectedRegion]   = useState('EU')
  const [selectedImage, setSelectedImage]     = useState('ubuntu-24.04')
  const [selectedPeriod, setSelectedPeriod]   = useState(1)
  const [displayName, setDisplayName]         = useState('')
  const [defaultUser, setDefaultUser]         = useState('root')
  const [addBackup, setAddBackup]             = useState(false)
  const [addPrivateNet, setAddPrivateNet]     = useState(false)
  const [ordering, setOrdering]               = useState(false)
  const [confirmAction, setConfirmAction] = useState<{type: string, id: string, label: string} | null>(null)
  const [error, setError]                     = useState('')
  const [success, setSuccess]                 = useState('')
  const [orders, setOrders]                   = useState<any[]>([])
  const [available, setAvailable]             = useState<boolean | null>(null)
  const [snapshots, setSnapshots]             = useState<Record<string, any[]>>({})
  const [showSnapshots, setShowSnapshots]     = useState<string | null>(null)
  const [snapshotName, setSnapshotName]       = useState('')

  useEffect(() => {
    loadOrders()
    checkAvailability()
  }, [])

  async function checkAvailability() {
    try {
      const res = await fetch('/api/compute/vps', { method: 'HEAD' })
      setAvailable(res.ok)
    } catch { setAvailable(false) }
  }

  async function loadOrders() {
    try {
      const res = await fetch('/api/compute/vps')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {}
  }

  const plan = PLANS.find(p => p.key === selectedPlan)!
  const periodObj = PERIODS.find(p => p.value === selectedPeriod)!
  const discountMultiplier = 1 - (periodObj.discount / 100)
  const monthlyPrice = plan.price * discountMultiplier
  const backupAddon = addBackup ? 1.95 : 0
  const totalPerMonth = monthlyPrice + backupAddon
  const totalExVat = totalPerMonth * selectedPeriod
  const totalIncVat = totalExVat * 1.2


  async function handleAction(instanceId: string, action: string) {
    try {
      await fetch('/api/compute/vps/' + instanceId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      loadOrders()
    } catch {}
  }

  async function loadSnapshots(instanceId: string) {
    try {
      const res = await fetch('/api/compute/vps/' + instanceId + '/snapshots')
      const data = await res.json()
      setSnapshots(prev => ({ ...prev, [instanceId]: data.snapshots || [] }))
    } catch {}
  }

  async function createSnapshot(instanceId: string) {
    if (!snapshotName) return
    try {
      const res = await fetch('/api/compute/vps/' + instanceId + '/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: snapshotName }),
      })
      const data = await res.json()
      if (data.success) { setSnapshotName(''); loadSnapshots(instanceId) }
      else setError(data.error)
    } catch {}
  }

  async function deleteSnapshot(instanceId: string, snapshotId: string) {
    setConfirmAction({type: 'snapshot_delete', id: instanceId, label: 'Delete this snapshot? This cannot be undone.'}); return
    try {
      await fetch('/api/compute/vps/' + instanceId + '/snapshots/' + snapshotId, { method: 'DELETE' })
      loadSnapshots(instanceId)
    } catch {}
  }

  async function rollbackSnapshot(instanceId: string, snapshotId: string) {
    setConfirmAction({type: 'snapshot_rollback', id: instanceId, label: 'Roll back to this snapshot? Current state will be lost.'}); return
    try {
      const res = await fetch('/api/compute/vps/' + instanceId + '/snapshots/' + snapshotId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback' }),
      })
      const data = await res.json()
      if (data.success) setSuccess('Rolled back successfully')
      else setError(data.error)
    } catch {}
  }

  async function activateRescue(instanceId: string) {
    setConfirmAction({type: 'rescue', id: instanceId, label: 'Activate rescue mode? The VPS will reboot into the rescue system.'}); return
    try {
      const res = await fetch('/api/compute/vps/' + instanceId + '/rescue', { method: 'POST' })
      const data = await res.json()
      if (data.success) setSuccess('Rescue mode activated')
      else setError(data.error)
    } catch {}
  }

  async function cancelVPS(instanceId: string) {
    setConfirmAction({type: 'cancel_vps', id: instanceId, label: 'Cancel this VPS? It will be terminated at the end of the billing period.'}); return
    try {
      const res = await fetch('/api/compute/vps/' + instanceId, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { loadOrders(); setSuccess('VPS cancelled') }
      else setError(data.error)
    } catch {}
  }

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
          default_user: defaultUser,
          add_backup: addBackup,
          add_private_networking: addPrivateNet,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
      loadOrders()
    } catch { setError('Order failed') }
    finally { setOrdering(false) }
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>Cloud VPS</h1>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>High-performance virtual servers powered by Contabo — EU, UK, US, Singapore, Australia</p>
      </div>

      {available === false && <div style={{ padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '8px', color: '#92400e', fontSize: '13px', marginBottom: '16px' }}>⚠️ VPS provisioning temporarily unavailable. Orders will be queued.</div>}
      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}

      {/* Active VPS */}
      {orders.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>Your VPS Instances</h3>
          {orders.map(o => {
            const pd = o.provider_data ? JSON.parse(o.provider_data) : null
            const ip = pd?.ipConfig?.v4?.ip || null
            return (
              <div key={o.id} style={{ border: '1px solid #f3f4f6', borderRadius: '8px', marginBottom: '8px', overflow: 'hidden' }}>
                <div style={{ padding: '14px', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700 }}>{pd?.productName || o.service_key.toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: '#666' }}>Order #{o.id} · {new Date(o.created_at).toLocaleDateString('en-GB')}</div>
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    {ip && <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ip}</div>}
                    <div style={{ color: '#666', fontSize: '11px' }}>{pd?.region || ''}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#444' }}>
                    <div>{pd?.cpuCores || '?'} vCPU · {pd?.ramMb ? Math.round(pd.ramMb/1024) : '?'}GB</div>
                    <div style={{ color: '#666' }}>{pd?.defaultUser || 'admin'} user</div>
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px',
                    background: o.status === 'active' ? '#dcfce7' : o.status === 'pending' ? '#fef9c3' : '#f3f4f6',
                    color: o.status === 'active' ? '#166534' : o.status === 'pending' ? '#92400e' : '#666' }}>
                    {o.status}
                  </span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {o.provider_instance_id && (
                      <>
                        <button onClick={() => handleAction(o.provider_instance_id, 'restart')}
                          style={{ padding: '5px 8px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>↺</button>
                        <button onClick={() => handleAction(o.provider_instance_id, 'stop')}
                          style={{ padding: '5px 8px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>■</button>
                        <button onClick={() => handleAction(o.provider_instance_id, 'start')}
                          style={{ padding: '5px 8px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>▶</button>
                        <button onClick={() => { setShowSnapshots(showSnapshots === o.provider_instance_id ? null : o.provider_instance_id); loadSnapshots(o.provider_instance_id) }}
                          style={{ padding: '5px 8px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', color: '#1d4ed8' }}>📸</button>
                        <button onClick={() => activateRescue(o.provider_instance_id)}
                          style={{ padding: '5px 8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '5px', fontSize: '11px', cursor: 'pointer', color: '#991b1b' }}>🆘</button>
                      </>
                    )}
                    <button onClick={() => cancelVPS(o.provider_instance_id || '')}
                      style={{ padding: '5px 8px', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '5px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                  </div>
                </div>
                {showSnapshots === o.provider_instance_id && (
                  <div style={{ padding: '14px', background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '10px' }}>Snapshots</div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                      <input value={snapshotName} onChange={e => setSnapshotName(e.target.value)} placeholder="Snapshot name"
                        style={{ flex: 1, padding: '7px 10px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '12px' }} />
                      <button onClick={() => createSnapshot(o.provider_instance_id)}
                        style={{ padding: '7px 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}>+ Create</button>
                    </div>
                    {(snapshots[o.provider_instance_id] || []).length === 0 ? (
                      <div style={{ fontSize: '12px', color: '#9a9a9a' }}>No snapshots yet</div>
                    ) : (snapshots[o.provider_instance_id] || []).map((snap: any) => (
                      <div key={snap.snapshotId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>{snap.name}</div>
                          <div style={{ fontSize: '11px', color: '#666' }}>{snap.createdDate ? new Date(snap.createdDate).toLocaleDateString('en-GB') : ''}</div>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => rollbackSnapshot(o.provider_instance_id, snap.snapshotId)}
                            style={{ padding: '4px 8px', background: '#fef9c3', border: '1px solid #fde68a', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>↩ Rollback</button>
                          <button onClick={() => deleteSnapshot(o.provider_instance_id, snap.snapshotId)}
                            style={{ padding: '4px 8px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', color: '#991b1b' }}>✕</button>
                        </div>
                      </div>
                    ))}
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
              <div style={{ fontSize: '12px', fontWeight: 700, color: selectedPlan === p.key ? p.color : '#111' }}>{p.label}</div>
              <div style={{ fontSize: '10px', color: '#666', marginTop: '6px', lineHeight: '1.7' }}>
                {p.cpu} vCPU<br/>{p.ram}GB RAM<br/>{p.disk}GB {p.storage}<br/>{p.snapshots} Snapshots
              </div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginTop: '8px' }}>£{p.price}/mo</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Region */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>2. Region</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {REGIONS.map(r => (
            <button key={r.key} onClick={() => setSelectedRegion(r.key)}
              style={{ padding: '12px', border: `2px solid ${selectedRegion === r.key ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedRegion === r.key ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{r.flag}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: selectedRegion === r.key ? '#1a6ef5' : '#111' }}>{r.label}</span>
              </div>
              <span style={{ fontSize: '10px', color: '#666' }}>{r.latency}</span>
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

      {/* Step 4: Contract period */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>4. Contract period</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setSelectedPeriod(p.value)}
              style={{ padding: '12px', border: `2px solid ${selectedPeriod === p.value ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedPeriod === p.value ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: selectedPeriod === p.value ? '#1a6ef5' : '#111' }}>{p.label}</div>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>£{(plan.price * (1 - p.discount/100)).toFixed(2)}/mo</div>
              {p.discount > 0 && <div style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600, marginTop: '2px' }}>Save {p.discount}%</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Add-ons */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>5. Add-ons <span style={{ fontWeight: 400, color: '#9a9a9a' }}>(optional)</span></h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button onClick={() => setAddBackup(!addBackup)}
            style={{ padding: '14px 16px', border: `2px solid ${addBackup ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: addBackup ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: addBackup ? '#1a6ef5' : '#111' }}>💾 Auto Backup</span>
                {addBackup && <span style={{ fontSize: '10px', background: '#1a6ef5', color: '#fff', padding: '2px 6px', borderRadius: '3px' }}>Added</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Daily automated backups · 10 versions · 1-click recovery · No setup fee</div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#444', whiteSpace: 'nowrap' }}>+£1.95/mo</span>
          </button>

          <button onClick={() => setAddPrivateNet(!addPrivateNet)}
            style={{ padding: '14px 16px', border: `2px solid ${addPrivateNet ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: addPrivateNet ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: addPrivateNet ? '#1a6ef5' : '#111' }}>🔒 Private Networking</span>
                {addPrivateNet && <span style={{ fontSize: '10px', background: '#1a6ef5', color: '#fff', padding: '2px 6px', borderRadius: '3px' }}>Added</span>}
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>Private network between your instances · Secure internal traffic</div>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#16a34a', whiteSpace: 'nowrap' }}>Free</span>
          </button>
        </div>
      </div>

      {/* Step 6: Login config */}
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>6. Server configuration</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Display name</label>
            <input type="text" placeholder="e.g. My Web Server" value={displayName} onChange={e => setDisplayName(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '6px' }}>Default user</label>
            <select value={defaultUser} onChange={e => setDefaultUser(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', background: '#fff' }}>
              <option value="root">root</option>
              <option value="admin">admin</option>
            </select>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#9a9a9a', margin: '10px 0 0' }}>
          🔑 Root password will be emailed to you by Contabo after provisioning. You can add SSH keys from your VPS control panel.
        </p>
      </div>

      {/* Order summary */}
      <div style={{ background: '#0a1628', borderRadius: '12px', padding: '20px', color: '#fff' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', color: '#e5e7eb' }}>Order summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>{plan.label} — {plan.cpu} vCPU, {plan.ram}GB RAM, {plan.disk}GB {plan.storage}</span>
            <span>£{monthlyPrice.toFixed(2)}/mo</span>
          </div>
          {addBackup && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Auto Backup</span>
              <span>£1.95/mo</span>
            </div>
          )}
          {addPrivateNet && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Private Networking</span>
              <span style={{ color: '#4ade80' }}>Free</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>Region</span>
            <span>{REGIONS.find(r => r.key === selectedRegion)?.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>OS</span>
            <span>{IMAGES.find(i => i.key === selectedImage)?.label}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>Contract</span>
            <span>{selectedPeriod} month{selectedPeriod > 1 ? 's' : ''}{periodObj.discount > 0 ? ` (${periodObj.discount}% off)` : ''}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280', borderTop: '1px solid #1f2937', paddingTop: '8px', marginTop: '4px' }}>
            <span>Subtotal ex VAT</span>
            <span>£{totalExVat.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>VAT (20%)</span>
            <span>£{(totalIncVat - totalExVat).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #1f2937', paddingTop: '10px', marginTop: '4px' }}>
            <span>Total due today</span>
            <span style={{ color: '#4ade80' }}>£{totalIncVat.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={handleOrder} disabled={ordering || available === false}
          style={{ width: '100%', height: '46px', background: ordering ? '#374151' : available === false ? '#374151' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: ordering || available === false ? 'not-allowed' : 'pointer' }}>
          {ordering ? 'Provisioning your VPS...' : `Order ${plan.label} — £${totalIncVat.toFixed(2)} inc VAT`}
        </button>
        <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', margin: '10px 0 0' }}>
          Charged from credit balance · Auto-provisioned via Contabo · Root password sent by email
        </p>
      </div>
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'cancel_vps' ? 'Cancel VPS' : confirmAction.type === 'rescue' ? 'Activate Rescue Mode' : 'Confirm Action'}
          subtitle={confirmAction.label}
          confirmLabel="Confirm"
          danger={confirmAction.type === 'cancel_vps' || confirmAction.type === 'snapshot_delete'}
          onConfirm={async () => {
            const action = confirmAction
            setConfirmAction(null)
            if (action.type === 'rescue') await activateRescue(action.id)
            else if (action.type === 'cancel_vps') await cancelVPS(action.id)
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  )
}
