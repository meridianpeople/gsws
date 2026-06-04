'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface ManagedService {
  id: number
  status: string
  renews_at: string
  annual_price_inc_vat: number
}

export default function ManagedPage() {
  const params = useParams()
  const packageId = params.id as string
  const [managed, setManaged] = useState<ManagedService | null>(null)
  const [packageName, setPackageName] = useState('')
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/packages/list`)
      .then(r => r.json()).then(d => {
        const pkg = d.packages?.find((p: any) => p.id == packageId)
        setPackageName(pkg?.name || packageId)
      }).catch(() => setPackageName(packageId))
    fetch(`/api/managed?resource_type=hosting&resource_id=${packageId}`)
      .then(r => r.json()).then(d => { setManaged(d.service); setLoading(false) })
      .catch(() => setLoading(false))
  }, [packageId])

  async function handleUpgrade() {
    setUpgrading(true); setError('')
    try {
      const res = await fetch('/api/managed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_type: 'hosting', resource_id: packageId, resource_name: packageName }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
      setManaged({ id: 0, status: 'active', renews_at: data.renews_at, annual_price_inc_vat: 504 })
    } catch { setError('An error occurred') } finally { setUpgrading(false) }
  }

  async function handleCancel() {
    if (!confirm('Cancel managed service? No refund will be issued. Service continues until renewal date.')) return
    setCancelling(true)
    try {
      const res = await fetch('/api/managed', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource_type: 'hosting', resource_id: packageId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
      setManaged(prev => prev ? { ...prev, status: 'cancelling' } : null)
    } catch { setError('An error occurred') } finally { setCancelling(false) }
  }

  if (loading) return <div style={{ padding: '40px', color: '#666' }}>Loading...</div>

  const features = [
    ['✅', 'Replaces your £6/mo standard billing'],
    ['✅', 'All changes handled by our support team'],
    ['✅', '3 mailboxes included (up to 10GB each)'],
    ['✅', 'DNS, SSL, PHP, CDN managed for you'],
    ['✅', 'Priority support via chat / WhatsApp / Telegram'],
    ['✅', 'Annual billing — no monthly charges'],
    ['⚠️', 'No refunds on cancellation — continues until renewal'],
  ]

  return (
    <div style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>Managed Hosting</h1>
        <p style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>Let our team handle everything for {packageName}</p>
      </div>
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}
      {!managed ? (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#0a1628', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#111' }}>Managed Hosting</div>
              <div style={{ fontSize: '13px', color: '#666' }}>£420/yr ex VAT · £504/yr inc VAT</div>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '10px', marginBottom: '24px' }}>
            {features.map(([icon, text], i) => (
              <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', color: '#444' }}>
                <span>{icon}</span><span>{text}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb' }}>
            {[['Managed Hosting (annual)', '£420.00'], ['VAT (20%)', '£84.00']].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                <span style={{ color: '#666' }}>{label}</span><span>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 700, borderTop: '1px solid #e5e7eb', paddingTop: '8px', marginTop: '4px' }}>
              <span>Total charged from credit</span><span>£504.00</span>
            </div>
          </div>
          <button onClick={handleUpgrade} disabled={upgrading}
            style={{ width: '100%', height: '44px', background: upgrading ? '#ccc' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: upgrading ? 'not-allowed' : 'pointer' }}>
            {upgrading ? 'Activating...' : 'Activate Managed Hosting — £504.00'}
          </button>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🛡️</div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#111' }}>Managed Hosting {managed.status === 'cancelling' ? '(Cancelling)' : 'Active'}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>Renews {managed.renews_at} · £{managed.annual_price_inc_vat?.toFixed(2)} inc VAT</div>
            </div>
            <span style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: managed.status === 'cancelling' ? '#fef3c7' : '#dcfce7', color: managed.status === 'cancelling' ? '#92400e' : '#166534' }}>
              {managed.status === 'cancelling' ? 'Cancelling' : 'Active'}
            </span>
          </div>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e5e7eb', fontSize: '13px', color: '#444' }}>
            This package is managed by the GeiG support team. To request changes, use the support chat.
            All write operations are disabled — contact support for DNS, SSL, email, or PHP changes.
          </div>
          <a href="https://wa.me/447700000000" target="_blank" rel="noreferrer"
            style={{ display: 'flex', width: '100%', height: '44px', background: '#25d366', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 700, textDecoration: 'none', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
            💬 Contact Support
          </a>
          {managed.status === 'active' && (
            <button onClick={handleCancel} disabled={cancelling}
              style={{ width: '100%', height: '36px', background: 'none', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', cursor: cancelling ? 'not-allowed' : 'pointer' }}>
              {cancelling ? 'Cancelling...' : 'Cancel managed service (no refund)'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
