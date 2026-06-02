'use client'
import { useState } from 'react'
import Link from 'next/link'

interface DomainResult {
  name: string
  available: boolean
  price?: string | null
  premium?: boolean
}

const POPULAR_TLDS = ['.co.uk', '.com', '.uk', '.net', '.org', '.io', '.co', '.store', '.online']

export default function DomainSearchPage() {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<DomainResult[]>([])
  const [searched, setSearched] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [registered, setRegistered] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleSearch(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!query.trim()) return
    setSearching(true)
    setSearched(false)
    setResults([])
    setError('')
    try {
      const base = query.trim().toLowerCase().split('.')[0]
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

  async function handleRegister(domain: string) {
    setRegistering(domain)
    setError('')
    try {
      const res = await fetch('/api/domains/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      setRegistered(domain)
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
            <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link>
            <span>›</span>
            <span>Search & register</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a', letterSpacing: '-0.3px' }}>Find a domain</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>
            Search for an available domain. You need one before creating any hosting package.
          </p>
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
                  border: '1.5px solid #d4d4d4', borderRadius: '8px', fontSize: '15px',
                  fontFamily: 'inherit', color: '#0a0a0a', background: '#fff', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#1a6ef5'}
                onBlur={e => e.target.style.borderColor = '#d4d4d4'}
              />
            </div>
            <button
              type="submit"
              disabled={searching || !query.trim()}
              style={{
                height: '52px', padding: '0 28px', background: '#1a6ef5', color: '#fff',
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
          <span style={{ fontSize: '11px', color: '#9a9a9a', fontWeight: 500 }}>Quick add:</span>
          {POPULAR_TLDS.map(tld => (
            <button key={tld}
              onClick={() => {
                const base = query.split('.')[0] || query
                setQuery(base + tld)
              }}
              style={{
                padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                background: '#ebebeb', color: '#5a5a5a', border: '1px solid #d4d4d4',
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
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Searching across {POPULAR_TLDS.length} domain extensions…</p>
        </div>
      )}

      {/* Results */}
      {searched && !searching && (
        <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #ebebeb', background: '#f7f7f7' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>
              {available.length} available · {unavailable.length} taken
              {query && <span style={{ color: '#9a9a9a', fontWeight: 400 }}> for "{query.split('.')[0]}"</span>}
            </h2>
          </div>

          {/* Available domains */}
          {available.map((result, i) => (
            <div key={result.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 20px',
              borderBottom: i < results.length - 1 ? '1px solid #ebebeb' : 'none',
              background: '#fff',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b6d11', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>
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
                <span style={{ fontSize: '13px', fontWeight: 500, color: '#5a5a5a' }}>
                  {result.price || '—'}/yr
                </span>
                <span style={{ fontSize: '11px', color: '#3b6d11', fontWeight: 500 }}>Available</span>
                <button
                  onClick={() => handleRegister(result.name)}
                  disabled={registering === result.name || !!registered}
                  style={{
                    height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600,
                    cursor: registering === result.name ? 'wait' : 'pointer',
                    opacity: registering === result.name ? 0.7 : 1, fontFamily: 'inherit',
                  }}>
                  {registering === result.name ? 'Registering…' : 'Register →'}
                </button>
              </div>
            </div>
          ))}

          {/* Unavailable domains */}
          {unavailable.map((result, i) => (
            <div key={result.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderBottom: i < unavailable.length - 1 ? '1px solid #ebebeb' : 'none',
              background: '#f7f7f7',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d4d4d4', flexShrink: 0 }} />
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#5a5a5a', fontFamily: 'ui-monospace, monospace' }}>
                  {result.name}
                </span>
              </div>
              <span style={{ fontSize: '12px', color: '#9a9a9a', fontStyle: 'italic' }}>Taken</span>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {searched && !searching && results.length === 0 && !error && (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '13px', color: '#9a9a9a' }}>
            No results for <strong style={{ color: '#0a0a0a' }}>{query}</strong>. Try a different name.
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
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{f.title}</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
