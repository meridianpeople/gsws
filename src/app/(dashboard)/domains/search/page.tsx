'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface DomainResult {
  name: string
  tld: string
  available: boolean
  price?: number | null
  premium?: boolean
}

const POPULAR_TLDS = ['.co.uk', '.com', '.uk', '.net', '.org', '.io', '.co', '.store', '.online']

export default function DomainSearchPage() {
  const [query, setQuery] = useState('')
  const [balance, setBalance] = useState<number | null>(null)
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [searched, setSearched] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [registered, setRegistered] = useState<string | null>(null)
  const [modalDomain, setModalDomain] = useState<DomainResult | null>(null)
  const [agreedTerms, setAgreedTerms] = useState(false)
  const [addPrivacy, setAddPrivacy] = useState(true)
  const [differentEntity, setDifferentEntity] = useState(false)
  const [entityName, setEntityName] = useState('')
  const [entityEmail, setEntityEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/credits').then(r => r.json()).then(d => {
      if (typeof d.balance === 'number') setBalance(d.balance)
    }).catch(() => {})
  }, [])

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearched(false)
    setResults([])
    setError('')
    try {
      // Strip TLD if user typed full domain like mysite.co.uk
      const input = query.trim().toLowerCase()
      const base = input.includes('.') ? input.split('.')[0] : input
      const res = await fetch(`/api/domains/search?q=${encodeURIComponent(base)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setResults(data.results || [])
      setSearched(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSearching(false)
    }
  }

  function openModal(result: DomainResult) {
    setModalDomain(result)
    setAgreedTerms(false)
    setAddPrivacy(true)
    setDifferentEntity(false)
    setEntityName('')
    setEntityEmail('')
  }

  async function handleRegister(pin?: string) {
    if (!modalDomain) return
    setRegistering(modalDomain.name)
    setError('')
    setModalDomain(null)
    try {
      const res = await fetch('/api/domains/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(pin ? { 'x-spend-pin': pin } : {}) },
        body: JSON.stringify({
          domain: modalDomain.name,
          privacyService: addPrivacy,
          registrant: differentEntity ? { name: entityName, email: entityEmail } : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setRegistered(modalDomain.name)
      if (typeof data.newBalance === 'number') setBalance(data.newBalance)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setRegistering(null)
    }
  }

  const available = results.filter(r => r.available)
  const unavailable = results.filter(r => !r.available)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link>
            <span>›</span>
            <span>Search & register</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Find a domain</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Search for an available domain. You need one before creating any hosting package.
          </p>
          {balance !== null && (
            <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', background: balance > 0 ? '#eaf3de' : '#fcebeb', border: `1px solid ${balance > 0 ? '#c0dd97' : '#f5c1c1'}` }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: balance > 0 ? '#3b6d11' : '#a32d2d' }}>
                💳 Credit: £{balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>
        <Link href="/domains/transfer" className="gsws-btn">Transfer existing domain</Link>
      </div>

      {/* Search box */}
      <div className="gsws-card" style={{ padding: '28px 32px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Type a domain name to search…"
                style={{
                  width: '100%', height: '52px', paddingLeft: '46px', paddingRight: '16px',
                  border: '1.5px solid var(--input-border)', borderRadius: '8px', fontSize: '15px',
                  fontFamily: 'inherit', color: 'var(--text-primary)', background: 'var(--card-bg)', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#1a6ef5'}
                onBlur={e => e.target.style.borderColor = 'var(--input-border)'}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              style={{
                height: '52px', padding: '0 28px', background: '#1a6ef5', color: 'var(--card-bg)',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                cursor: searching || !query.trim() ? 'not-allowed' : 'pointer',
                opacity: searching || !query.trim() ? 0.7 : 1, fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap',
              }}>
              {searching ? 'Searching…' : '🔍 Search domains'}
            </button>
          </div>
        </form>

        {/* TLD pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Quick add:</span>
          {POPULAR_TLDS.map(tld => (
            <button key={tld}
              onClick={() => {
                const base = query.split('.')[0] || query
                setQuery(base + tld)
              }}
              style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                background: 'var(--card-border)', color: 'var(--text-secondary)', border: '1px solid var(--card-border-hover)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
              {tld}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>
          {error}
        </div>
      )}

      {/* Success */}
      {registered && (
        <div style={{ padding: '16px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          <div>
            <p style={{ fontWeight: 600, fontSize: '13px' }}>{registered} registered successfully!</p>
            <p style={{ fontSize: '12px', marginTop: '2px' }}>
              <Link href="/packages/new" style={{ color: '#3b6d11', fontWeight: 600 }}>Create a hosting package →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Searching spinner */}
      {searching && (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Searching across {POPULAR_TLDS.length} domain extensions…</p>
        </div>
      )}

      {/* Results */}
      {searched && !searching && (
        <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg-elevated)' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {available.length} available · {unavailable.length} taken
              {query && <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}> for "{query.split('.')[0]}"</span>}
            </h2>
          </div>

          {/* Available domains */}
          {available.map((result, i) => (
            <div key={result.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < results.length - 1 ? '1px solid var(--card-border)' : 'none',
              background: 'var(--card-bg)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b6d11', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'ui-monospace, monospace' }}>
                    {result.name}
                  </span>
                  {result.premium && (
                    <span style={{ marginLeft: '8px', padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 500, background: '#faeeda', color: '#854f0b' }}>
                      Premium
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  {result.price ? `£${result.price.toFixed(2)}` : '—'}/yr
                </span>
                <span style={{ fontSize: '11px', fontWeight: 500, color: balance !== null && (result.price || 0) > balance ? '#a32d2d' : '#3b6d11' }}>
                  {balance !== null && (result.price || 0) > balance ? 'Low credit' : 'Available'}
                </span>
                <button
                  onClick={() => openModal(result)}
                  disabled={registering === result.name || !!registered || (balance !== null && (result.price || 0) > balance)}
                  style={{
                    height: '34px', padding: '0 20px', background: '#1a6ef5', color: 'var(--card-bg)',
                    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    cursor: registering === result.name ? 'wait' : 'pointer',
                    opacity: registering === result.name ? 0.7 : 1, fontFamily: 'inherit',
                  }}>
                  {registering === result.name ? 'Registering…' : 'Register'}
                </button>
              </div>
            </div>
          ))}

          {/* Unavailable domains */}
          {unavailable.map((result, i) => (
            <div key={result.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < unavailable.length - 1 ? '1px solid var(--card-border)' : 'none',
              background: 'var(--card-bg-elevated)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--card-border-hover)', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>
                  {result.name}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Taken</span>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && !searching && results.length === 0 && !error && (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            No results for <strong style={{ color: 'var(--text-primary)' }}>{query}</strong>. Try a different name.
          </p>
        </div>
      )}

      {/* Info cards */}
      {!searched && !searching && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {[
            { title: 'Free WHOIS privacy', desc: 'Your personal details stay hidden on all registered domains.', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
            { title: 'Auto-renewal', desc: 'Never lose your domain. Enable auto-renewal and we handle the rest.', icon: 'M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15' },
            { title: 'Instant setup', desc: 'Domain registered instantly. Create hosting right away.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
          ].map(f => (
            <div key={f.title} className="gsws-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2">
                  <path d={f.icon}/>
                </svg>
              </div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{f.title}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      )}
      {/* Registration Modal */}
      {modalDomain && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: '12px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Register domain</h2>
              <p style={{ fontSize: '13px', fontFamily: 'ui-monospace, monospace', color: '#1a6ef5', fontWeight: 600 }}>{modalDomain.name}</p>
            </div>

            {/* Price summary */}
            <div style={{ background: 'var(--card-bg-elevated)', borderRadius: '8px', padding: '14px 16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Domain registration (1 year)</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>£{modalDomain.price?.toFixed(2)}</span>
              </div>
              {addPrivacy && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>WHOIS privacy protection</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>£5.00</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Subtotal (ex. VAT)</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>£{((modalDomain.price || 0) + (addPrivacy ? 5 : 0)).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>VAT (20%)</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>£{(((modalDomain.price || 0) + (addPrivacy ? 5 : 0)) * 0.20).toFixed(2)}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--card-border-hover)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Total charged from credit</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a6ef5' }}>£{(((modalDomain.price || 0) + (addPrivacy ? 5 : 0)) * 1.20).toFixed(2)}</span>
              </div>
              <div style={{ marginTop: '6px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                Your balance after: £{((balance || 0) - (((modalDomain.price || 0) + (addPrivacy ? 5 : 0)) * 1.20)).toFixed(2)}
              </div>
            </div>

            {/* Privacy option */}
            <div style={{ marginBottom: '14px', border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={addPrivacy} onChange={e => setAddPrivacy(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🔒 WHOIS Privacy Protection</p>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1a6ef5' }}>£5.00/yr</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: '1.6' }}>
                    Without privacy, your full name, address, phone and email are <strong>publicly searchable</strong> by anyone worldwide. With privacy enabled:
                  </p>
                  <ul style={{ margin: '6px 0 0 0', padding: '0 0 0 16px', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                    <li>Your domain is registered under <strong>our trusted company</strong> — your identity stays private</li>
                    <li>Protection from spam, cold calls and unsolicited marketing</li>
                    <li>Shields against identity theft, phishing and domain hijacking</li>
                    <li>Prevents doxxing, harassment and competitive intelligence gathering</li>
                    <li>Legitimate contact emails are still forwarded to you</li>
                    <li>GDPR-compliant privacy across all TLDs regardless of jurisdiction</li>
                  </ul>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    89% of domain registrations now use privacy protection. Recommended for all registrants.
                  </p>
                </div>
              </label>
            </div>

            {/* Different entity option */}
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={differentEntity} onChange={e => setDifferentEntity(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Register for a different legal entity</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Register this domain on behalf of a company or individual other than yourself</p>
                </div>
              </label>
            </div>

            {differentEntity && (
              <div style={{ background: 'var(--card-bg-elevated)', borderRadius: '8px', padding: '14px', marginBottom: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Legal entity / company name</label>
                  <input value={entityName} onChange={e => setEntityName(e.target.value)} placeholder="Acme Ltd"
                    style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Registrant email address</label>
                  <input value={entityEmail} onChange={e => setEntityEmail(e.target.value)} placeholder="admin@acme.com" type="email"
                    style={{ width: '100%', height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
            )}

            {/* Terms agreement */}
            <div style={{ background: '#faeeda', border: '1px solid #f5d08a', borderRadius: '8px', padding: '14px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#854f0b', marginBottom: '4px' }}>⚠️ I understand this is a binding contract</p>
                  <p style={{ fontSize: '11px', color: '#854f0b', lineHeight: '1.5' }}>
                    Domain registrations are <strong>non-refundable</strong> once provisioned. By registering this domain I agree to the{' '}
                    <a href="/terms" target="_blank" style={{ color: '#854f0b', textDecoration: 'underline' }}>Terms of Service</a> and{' '}
                    <a href="/terms#domains" target="_blank" style={{ color: '#854f0b', textDecoration: 'underline' }}>Domain Registration Policy</a>.
                    £{modalDomain.price?.toFixed(2)} will be deducted from my credit balance immediately and is non-refundable.
                  </p>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => handleRegister()}
                disabled={!agreedTerms || (differentEntity && (!entityName || !entityEmail))}
                style={{ flex: 1, height: '40px', background: '#1a6ef5', color: 'var(--card-bg)', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: !agreedTerms ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !agreedTerms ? 0.5 : 1 }}>
                Confirm & Register {modalDomain.name}
              </button>
              <button onClick={() => setModalDomain(null)}
                style={{ height: '40px', padding: '0 20px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
