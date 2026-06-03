'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface PackageType {
  id: number
  label: string
  category: string
  description: string
  monthlyExVat: number
  monthlyIncVat: number
}

const CATEGORY_INFO: Record<string, { icon: string; color: string; bg: string }> = {
  wordpress: { icon: '🌐', color: '#21759b', bg: '#e8f4fb' },
  linux:     { icon: '🐧', color: '#3b6d11', bg: '#eaf3de' },
  windows:   { icon: '🪟', color: '#185fa5', bg: '#e8f0fe' },
}

const PLAN_FEATURES: Record<number, string[]> = {
  4440: ['Autoscaling WordPress', 'One-click staging environment', 'Plugin & theme management', 'Free SSL certificate', 'Unlimited email accounts', 'MySQL databases', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'SSH & Git access'],
  4438: ['High-performance Linux SSD', 'PHP 7.4 → 8.3', 'Unlimited MySQL databases', 'FTP & SFTP access', 'Free SSL certificate', 'Unlimited email accounts', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'SSH & Git access'],
  4439: ['Windows Server IIS hosting', 'ASP.NET 4.8 & Core', 'MSSQL databases', 'FTP access', 'Free SSL certificate', 'Unlimited email accounts', 'Timeline backups (30 days)', 'Global CDN', 'Daily malware scanning', 'App Pool management'],
}

export default function NewPackageForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [domains, setDomains] = useState<any[]>([])
  const [types, setTypes] = useState<PackageType[]>([])
  const [selectedDomain, setSelectedDomain] = useState(searchParams.get('domain') || '')
  const [externalDomain, setExternalDomain] = useState(false)
  const [externalDomainInput, setExternalDomainInput] = useState('')
  const [selectedType, setSelectedType] = useState<number | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [warning, setWarning] = useState<{ message: string; existingPackage: string } | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/domains/list').then(r => r.json()),
      fetch('/api/packages/types').then(r => r.json()),
      fetch('/api/credits').then(r => r.json()),
    ]).then(([d, p, c]) => {
      setDomains(d.domains || [])
      setTypes(p.types || [])
      setBalance(c.balance ?? null)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeDomain = externalDomain ? externalDomainInput : selectedDomain
  const selectedPkg = types.find(t => t.id === selectedType)
  const features = selectedType ? PLAN_FEATURES[selectedType] : []
  const canAfford = balance !== null && selectedPkg ? balance >= selectedPkg.monthlyIncVat : true

  async function handleCreate(confirmed = false) {
    if (!activeDomain || !selectedType || !agreedTerms) return
    setCreating(true); setError('')
    if (!confirmed) setWarning(null)
    try {
      const res = await fetch('/api/packages/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: activeDomain, typeId: selectedType, confirmed, externalDomain }),
      })
      const data = await res.json()
      if (res.status === 409 && data.requiresConfirmation) {
        setWarning({ message: data.warning, existingPackage: data.existingPackage })
        setCreating(false); return
      }
      if (!res.ok) throw new Error(data.error || 'Failed to create package')
      if (typeof data.newBalance === 'number') setBalance(data.newBalance)
      router.push('/packages')
    } catch (err: any) { setError(err.message); setCreating(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
          <Link href="/packages" style={{ color: '#1a6ef5' }}>Packages</Link> › New package
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Create a hosting package</h1>
            <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Select a domain and hosting plan. First month charged from credit.</p>
          </div>
          {balance !== null && (
            <div style={{ padding: '6px 14px', borderRadius: '20px', background: balance > 0 ? '#eaf3de' : '#fcebeb', border: `1px solid ${balance > 0 ? '#c0dd97' : '#f5c1c1'}` }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: balance > 0 ? '#3b6d11' : '#a32d2d' }}>💳 Credit: £{balance.toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {warning && (
        <div style={{ padding: '20px 24px', borderRadius: '10px', background: '#faeeda', border: '2px solid #f0c070' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '20px' }}>⚠️</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#854f0b', marginBottom: '6px' }}>Replace existing package?</p>
              <p style={{ fontSize: '12px', color: '#854f0b', lineHeight: 1.6, marginBottom: '14px' }}>{warning.message}</p>
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
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: activeDomain ? '#1a6ef5' : '#ebebeb', color: activeDomain ? '#fff' : '#9a9a9a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                {activeDomain ? '✓' : '1'}
              </span>
              Select domain
            </h2>

            {/* Toggle owned vs external */}
            <div style={{ display: 'flex', gap: '0', border: '1px solid #ebebeb', borderRadius: '8px', overflow: 'hidden', marginBottom: '14px', width: 'fit-content' }}>
              {[false, true].map(isExt => (
                <button key={String(isExt)} onClick={() => { setExternalDomain(isExt); setSelectedDomain(''); setExternalDomainInput('') }}
                  style={{ padding: '7px 16px', background: externalDomain === isExt ? '#1a6ef5' : '#fff', color: externalDomain === isExt ? '#fff' : '#5a5a5a', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', borderRight: !isExt ? '1px solid #ebebeb' : 'none' }}>
                  {isExt ? '🌐 External domain (DNS pointing)' : '✅ My registered domains'}
                </button>
              ))}
            </div>

            {!externalDomain ? (
              domains.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #d4d4d4', borderRadius: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '10px' }}>No domains yet.</p>
                  <Link href="/domains/search" style={{ display: 'inline-flex', padding: '0 16px', height: '34px', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Register a domain →</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {domains.map((d: any) => (
                    <div key={d.name} onClick={() => setSelectedDomain(d.name)}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', background: selectedDomain === d.name ? '#e8f0fe' : '#f7f7f7', border: `1px solid ${selectedDomain === d.name ? '#1a6ef5' : '#ebebeb'}` }}>
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${selectedDomain === d.name ? '#1a6ef5' : '#d4d4d4'}`, background: selectedDomain === d.name ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {selectedDomain === d.name && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'ui-monospace, monospace' }}>{d.name}</span>
                      <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#eaf3de', color: '#3b6d11', fontWeight: 500 }}>Active</span>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#0a0a0a', display: 'block', marginBottom: '6px' }}>Enter your external domain name</label>
                <input value={externalDomainInput} onChange={e => setExternalDomainInput(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. yourdomain.co.uk"
                  style={{ width: '100%', height: '40px', border: '1.5px solid #d4d4d4', borderRadius: '8px', fontSize: '14px', padding: '0 14px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#1a6ef5'}
                  onBlur={e => e.target.style.borderColor = '#d4d4d4'} />
                <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '6px' }}>
                  Make sure you have updated DNS to point to our servers first. <Link href="/domains/transfer" style={{ color: '#1a6ef5' }}>See DNS instructions →</Link>
                </p>
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
              {types.map(pkg => {
                const info = CATEGORY_INFO[pkg.category] || CATEGORY_INFO.linux
                const selected = selectedType === pkg.id
                return (
                  <div key={pkg.id} onClick={() => setSelectedType(pkg.id)}
                    style={{ padding: '18px', borderRadius: '10px', cursor: 'pointer', border: `2px solid ${selected ? info.color : '#ebebeb'}`, background: selected ? info.bg : '#fff', transition: 'all 0.15s', position: 'relative' }}>
                    {selected && (
                      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={info.color} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                    )}
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{info.icon}</div>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>{pkg.label}</p>
                    <p style={{ fontSize: '11px', color: '#9a9a9a', lineHeight: 1.5, marginBottom: '12px' }}>{pkg.description}</p>
                    <div style={{ borderTop: '1px solid #ebebeb', paddingTop: '10px' }}>
                      <p style={{ fontSize: '18px', fontWeight: 800, color: info.color }}>£{pkg.monthlyExVat.toFixed(2)}<span style={{ fontSize: '11px', fontWeight: 400, color: '#9a9a9a' }}>/mo ex VAT</span></p>
                      <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>£{pkg.monthlyIncVat.toFixed(2)}/mo inc VAT</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Step 3 — Features */}
          {selectedType && (
            <div className="gsws-card">
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a6ef5', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>3</span>
                {selectedPkg ? `Included with ${selectedPkg.label}` : "What's included"}
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginBottom: '14px' }}>
                {features.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: '#f7f7f7', borderRadius: '6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3b6d11" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    <span style={{ fontSize: '12px', color: '#0a0a0a' }}>{f}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 14px', background: '#e8f0fe', borderRadius: '8px', fontSize: '12px', color: '#185fa5', display: 'flex', gap: '8px' }}>
                <span>📧</span><span>Email accounts and data are always preserved when switching hosting packages.</span>
              </div>
            </div>
          )}

          {/* Step 4 — Order summary + terms */}
          {activeDomain && selectedType && selectedPkg && (
            <div className="gsws-card" style={{ border: '1.5px solid #1a6ef5' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a6ef5', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>4</span>
                Order summary
              </h2>

              <div style={{ background: '#f7f7f7', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#5a5a5a' }}>{selectedPkg.label} — {activeDomain}</span>
                  <span style={{ fontSize: '13px' }}>£{selectedPkg.monthlyExVat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: '#9a9a9a' }}>VAT (20%)</span>
                  <span style={{ fontSize: '12px', color: '#9a9a9a' }}>£{(selectedPkg.monthlyIncVat - selectedPkg.monthlyExVat).toFixed(2)}</span>
                </div>
                <div style={{ borderTop: '1px solid #d4d4d4', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700 }}>First month (from credit)</span>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#1a6ef5' }}>£{selectedPkg.monthlyIncVat.toFixed(2)}</span>
                </div>
                {balance !== null && (
                  <p style={{ fontSize: '11px', color: canAfford ? '#9a9a9a' : '#a32d2d', marginTop: '6px' }}>
                    {canAfford ? `Balance after: £${(balance - selectedPkg.monthlyIncVat).toFixed(2)}` : `Insufficient credit — you need £${selectedPkg.monthlyIncVat.toFixed(2)} but have £${balance.toFixed(2)}`}
                  </p>
                )}
                <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px' }}>
                  Recurring: £{selectedPkg.monthlyIncVat.toFixed(2)}/month inc VAT (£{(selectedPkg.monthlyIncVat * 12).toFixed(2)}/year)
                </p>
              </div>

              {/* Terms */}
              <div style={{ background: '#faeeda', border: '1px solid #f5d08a', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#854f0b', marginBottom: '4px' }}>⚠️ I understand this is a recurring monthly subscription</p>
                    <p style={{ fontSize: '11px', color: '#854f0b', lineHeight: 1.5 }}>
                      £{selectedPkg.monthlyIncVat.toFixed(2)} inc VAT will be deducted from my credit balance on the 1st of each month. I agree to the <a href="/terms" target="_blank" style={{ color: '#854f0b', textDecoration: 'underline' }}>Terms of Service</a>. Hosting can be cancelled at any time — unused days are non-refundable.
                    </p>
                  </div>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Link href="/packages" style={{ padding: '0 16px', height: '40px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d4d4d4', borderRadius: '8px', fontSize: '13px', color: '#0a0a0a', textDecoration: 'none', background: '#fff' }}>Cancel</Link>
                <button onClick={() => handleCreate(false)} disabled={!activeDomain || !selectedType || creating || !agreedTerms || !canAfford}
                  style={{ height: '40px', padding: '0 28px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13.5px', fontWeight: 700, cursor: (!activeDomain || !selectedType || creating || !agreedTerms || !canAfford) ? 'not-allowed' : 'pointer', opacity: (!activeDomain || !selectedType || !agreedTerms || !canAfford) ? 0.5 : 1, fontFamily: 'inherit' }}>
                  {creating ? 'Creating…' : `Create package — £${selectedPkg.monthlyIncVat.toFixed(2)}`}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
