'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TOPUP_AMOUNTS = [
  { amount: 25, label: '£25', desc: 'Starter top-up' },
  { amount: 50, label: '£50', desc: 'Popular choice' },
  { amount: 75, label: '£75', desc: 'Great value' },
  { amount: 100, label: '£100', desc: 'Most popular', highlight: true },
  { amount: 500, label: '£500', desc: 'Power user' },
  { amount: 1000, label: '£1,000', desc: 'Enterprise' },
]

export default function TopupPage() {
  const [user, setUser] = useState<any>(null)
  const [selected, setSelected] = useState<number>(100)
  const [loading, setLoading] = useState(true)
  const [savedCard, setSavedCard] = useState<{ brand: string; last4: string; exp_month: number; exp_year: number } | null>(null)
  const [quickPaying, setQuickPaying] = useState(false)
  const [quickSuccess, setQuickSuccess] = useState('')
  const [paying, setPaying] = useState(false)
  const [success, setSuccess] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); setLoading(false) })
      .catch(() => setLoading(false))

    const params = new URLSearchParams(window.location.search)
    if (params.get('success') === '1') setSuccess(true)
    // Check for saved card
    fetch('/api/account/topup/saved-card').then(r => r.json()).then(d => {
      if (d.card) setSavedCard(d.card)
    }).catch(() => {})
    if (params.get('cancelled') === '1') setCancelled(true)
  }, [])

  async function handleCheckout() {
    setPaying(true)
    setError('')
    try {
      const res = await fetch('/api/account/topup/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selected }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout')
      if (data.url) window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setPaying(false)
    }
  }

  async function handleQuickPay() {
    setQuickPaying(true)
    setQuickSuccess('')
    try {
      const res = await fetch('/api/account/topup/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: selected }),
      })
      const data = await res.json()
      if (!res.ok) { alert(data.error || 'Payment failed'); return }
      setQuickSuccess(`£${selected} added via ${data.card}. New balance: £${data.newBalance.toFixed(2)}`)
      setTimeout(() => window.location.reload(), 2000)
    } catch { alert('Payment failed') }
    finally { setQuickPaying(false) }
  }

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading…</div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>

      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <Link href="/account/profile" style={{ color: '#1a6ef5' }}>Account</Link> › Top up credit
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Top up account credit</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Credit is used to register domains and purchase hosting services.
        </p>
      </div>

      {success && (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: '#eaf3de', border: '1px solid #c0dd97', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3b6d11' }}>Payment successful!</p>
            <p style={{ fontSize: '12px', color: '#3b6d11', marginTop: '2px' }}>Your credit has been added to your account. It may take a moment to reflect.</p>
          </div>
        </div>
      )}

      {cancelled && (
        <div style={{ padding: '16px 20px', borderRadius: '10px', background: '#faeeda', border: '1px solid #f0c070', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '20px' }}>ℹ️</span>
          <p style={{ fontSize: '13px', color: '#854f0b' }}>Payment cancelled. No charge was made.</p>
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>
          {error}
        </div>
      )}

      {/* Balance */}
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: '#0a1628', border: '1px solid #1a3060', borderRadius: '10px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#1a3060', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5599ff" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: '12px', color: '#6699cc', marginBottom: '2px' }}>Current balance</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1 }}>
              £{Number(user.creditBalance).toFixed(2)}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <p style={{ fontSize: '11px', color: '#6699cc', marginBottom: '2px' }}>After top-up</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#5599ff', lineHeight: 1 }}>
              £{(Number(user.creditBalance) + selected).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Amount grid */}
      <div className="gsws-card">
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Select amount</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {TOPUP_AMOUNTS.map(opt => (
            <div key={opt.amount} onClick={() => setSelected(opt.amount)}
              style={{
                padding: '16px', borderRadius: '10px', cursor: 'pointer', textAlign: 'center',
                border: `2px solid ${selected === opt.amount ? '#1a6ef5' : opt.highlight ? '#d4d4d4' : '#ebebeb'}`,
                background: selected === opt.amount ? '#e8f0fe' : opt.highlight ? '#f7f9ff' : '#fff',
                position: 'relative', transition: 'all 0.15s',
              }}>
              {opt.highlight && (
                <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#1a6ef5', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' }}>
                  Most popular
                </div>
              )}
              <p style={{ fontSize: '22px', fontWeight: 800, color: selected === opt.amount ? '#1a6ef5' : '#0a0a0a', letterSpacing: '-0.5px', marginBottom: '4px' }}>{opt.label}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{opt.desc}</p>
              {selected === opt.amount && (
                <div style={{ position: 'absolute', top: '8px', right: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Payment methods */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pay with:</span>
          {['Visa', 'Mastercard', 'Amex', 'PayPal'].map(pm => (
            <span key={pm} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', color: '#5a5a5a' }}>{pm}</span>
          ))}
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', marginLeft: '4px' }}>& more via Stripe</span>
        </div>

        <button onClick={handleCheckout} disabled={paying}
          style={{
            width: '100%', height: '48px', background: paying ? '#1558c0' : '#1a6ef5',
            color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700,
            cursor: paying ? 'wait' : 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            boxShadow: '0 4px 16px rgba(26,110,245,0.35)', opacity: paying ? 0.8 : 1,
          }}>
          {paying ? (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
              Redirecting to Stripe…
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Pay £{selected.toLocaleString()} securely
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
            Secured by Stripe · 256-bit SSL encryption
          </p>
        </div>
      </div>

      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
        Credit is non-refundable and expires after 12 months of account inactivity.
        For billing queries contact <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
