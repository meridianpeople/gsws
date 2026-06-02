'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PackageType {
  id: number
  label: string
  category: string
  description: string
}

interface Domain { name: string }

const CATEGORY_COLOR: Record<string, string> = {
  wordpress: '#185fa5', linux: '#5a5a5a', windows: '#854f0b',
}
const CATEGORY_BG: Record<string, string> = {
  wordpress: '#e6f1fb', linux: '#f1efe8', windows: '#faeeda',
}

const PLAN_FEATURES: Record<number, string[]> = {
  4440: ['Autoscaling WordPress', 'One-click staging environment', 'Plugin & theme management', 'Free SSL certificate', 'Unlimited email accounts', 'MySQL databases', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'SSH & Git access', 'PHP 7.4 → 8.3'],
  4438: ['High-performance SSD Linux', 'PHP 7.4 → 8.3', 'Unlimited MySQL databases', 'FTP & SFTP access', 'Free SSL certificate', 'Unlimited email accounts', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'SSH & Git access', 'AWStats & access logs'],
  4439: ['Windows Server IIS hosting', 'ASP.NET 4.8 & Core', 'MSSQL databases', 'FTP access', 'Free SSL certificate', 'Unlimited email accounts', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'Application pool management'],
}

export default function NewPackageForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [domains, setDomains] = useState<Domain[]>([])
  const [types, setTypes] = useState<PackageType[]>([])
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get('domain') || '')
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [warning, setWarning] = useState<{ message: string; existingPackage: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/domains/list').then(r => r.json()),
      fetch('/api/packages/types').then(r => r.json()),
    ]).then(([d, p]) => {
      setDomains(d.domains || [])
      setTypes(p.types || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleCreate(confirmed = false) {
    if (!selectedDomain || !selectedType) return
    setCreating(true)
    setError('')
    if (!confirmed) setWarning(null)

    try {
      const res = await fetch('/api/packages/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain, typeId: selectedType, confirmed }),
      })
      const data = await res.json()

      if (res.status === 409 && data.requiresConfirmation) {
        setWarning({ message: data.warning, existingPackage: data.existingPackage })
        setCreating(false)
        return
      }

      if (!res.ok) throw new Error(data.error || 'Failed to create package')
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  const selected = types.find(t => t.id === selectedType)
  const features = selectedType ? PLAN_FEATURES[selectedType] : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
          <Link href="/packages" style={{ color: '#1a6ef5' }}>Packages</Link> › New package
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Create a hosting package</h1>
        <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Select a domain and hosting plan.</p>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>
          {error}
        </div>
      )}

      {/* Confirmation warning modal */}
      {warning && (
        <div style={{ padding: '20px 24px', borderRadius: '10px', background: '#faeeda', border: '2px solid #f0c070' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#854f0b', marginBottom: '6px' }}>
                Replace existing package?
              </p>
              <p style={{ fontSize: '12px', color: '#854f0b', lineHeight: 1.6, marginBottom: '14px' }}>
                {warning.message}
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => handleCreate(true)} disabled={creating}
                  style={{ height: '34px', padding: '0 20px', background: '#854f0b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {creating ? 'Creating…' : 'Yes, replace package'}
                </button>
                <button onClick={() => setWarning(null)}
                  style={{ height: '34px', padding: '0 16px', background: '#fff', color: '#854f0b', border: '1px solid #f0c070', borderRadius: '6px', fontSize: '12.5px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px', color: '#9a9a9a', fontSize: '13px' }}>Loading…</div>
      ) : (
        <>
          {/* Step 1 — Domain */}
          <div className="gsws-card">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: selectedDomain ? '#1a6ef5' : '#ebebeb', color: selectedDomain ? '#fff' : '#9a9a9a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                {selectedDomain ? '✓' : '1'}
              </span>
              Select domain
            </h2>
            {domains.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #d4d4d4', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '10px' }}>No domains yet.</p>
                <Link href="/domains/search" style={{ display: 'inline-flex', padding: '0 16px', height: '34px', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  Register a domain →
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {domains.map((d: any) => (
                  <div key={d.name} onClick={() => setSelectedDomain(d.name)}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', background: selectedDomain === d.name ? '#e8f0fe' : '#f7f7f7', border: `1px solid ${selectedDomain === d.name ? '#1a6ef5' : '#ebebeb'}` }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedDomain === d.name ? '#1a6ef5' : '#d4d4d4'}`, background: selectedDomain === d.name ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {selectedDomain === d.name && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>{d.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#eaf3de', color: '#3b6d11', fontWeight: 500 }}>Active</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Step 2 — Plan */}
          <div className="gsws-card">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: selectedType ? '#1a6ef5' : '#ebebeb', color: selectedType ? '#fff' : '#9a9a9a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                {selectedType ? '✓' : '2'}
              </span>
              Choose hosting plan
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {types.map(pkg => (
                <div key={pkg.id} onClick={() => setSelectedType(pkg.id)}
                  style={{ padding: '18px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${selectedType === pkg.id ? '#1a6ef5' : '#ebebeb'}`, background: selectedType === pkg.id ? '#e8f0fe' : '#fff', transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: CATEGORY_BG[pkg.category] || '#f1efe8', color: CATEGORY_COLOR[pkg.category] || '#5a5a5a' }}>
                      {pkg.category.charAt(0).toUpperCase() + pkg.category.slice(1)}
                    </span>
                    {selectedType === pkg.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '6px' }}>{pkg.label}</p>
                  <p style={{ fontSize: '11px', color: '#9a9a9a', lineHeight: 1.5 }}>{pkg.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3 — Features */}
          <div className="gsws-card">
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ebebeb', color: '#9a9a9a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</span>
              {selected ? `Included with ${selected.label}` : "What's included"}
            </h2>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '16px', marginLeft: '30px' }}>
              {selected ? 'All features below included at no extra cost.' : 'Select a plan to see features.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {(features.length > 0 ? features : ['Free SSL certificate', 'Unlimited email accounts', 'Daily backups', 'Global CDN', 'Malware scanning', 'SSH access']).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f7f7f7', borderRadius: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span style={{ fontSize: '12px', color: '#0a0a0a' }}>{f}</span>
                </div>
              ))}
            </div>
            {/* Email preservation note */}
            <div style={{ marginTop: '14px', padding: '10px 14px', background: '#e8f0fe', borderRadius: '8px', fontSize: '12px', color: '#185fa5', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0 }}>📧</span>
              <span>Email accounts and data are always preserved when switching hosting packages.</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px' }}>
            {selectedDomain && selected && (
              <p style={{ fontSize: '12px', color: '#9a9a9a' }}>
                <strong style={{ color: '#0a0a0a' }}>{selected.label}</strong> for <strong style={{ color: '#0a0a0a' }}>{selectedDomain}</strong>
              </p>
            )}
            <Link href="/packages" style={{ padding: '0 16px', height: '36px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', color: '#0a0a0a', textDecoration: 'none', background: '#fff' }}>
              Cancel
            </Link>
            <button onClick={() => handleCreate(false)}
              disabled={!selectedDomain || !selectedType || creating}
              style={{ height: '40px', padding: '0 28px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, cursor: !selectedDomain || !selectedType || creating ? 'not-allowed' : 'pointer', opacity: !selectedDomain || !selectedType || creating ? 0.5 : 1, fontFamily: 'inherit', boxShadow: '0 2px 8px rgba(26,110,245,0.3)' }}>
              {creating ? 'Creating…' : 'Create package →'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
