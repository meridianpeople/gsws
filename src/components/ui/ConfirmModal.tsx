'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

interface ConfirmModalProps {
  onConfirm: (pin?: string) => void
  onCancel: () => void
  loading?: boolean
  title: string
  subtitle?: string
  price?: number
  priceLabel?: string
  balanceAfter?: number
  features?: string[]
  terms?: string
  confirmLabel?: string
  danger?: boolean
  children?: React.ReactNode
}

export default function ConfirmModal({
  onConfirm, onCancel, loading,
  title, subtitle, price, priceLabel = '1 year',
  balanceAfter, features, terms, confirmLabel, danger, children
}: ConfirmModalProps) {
  const VAT_RATE = 0.20
  const exVat = price ? price / (1 + VAT_RATE) : null
  const vat = price && exVat ? price - exVat : null

  const [pinRequired, setPinRequired] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinChecked, setPinChecked] = useState(false)
  const [verifying, setVerifying] = useState(false)

  // Check if PIN required when modal opens
  useEffect(() => {
    if (price) checkPinRequired()
  }, [price])

  async function checkPinRequired() {
    try {
      const res = await fetch('/api/account/spend-pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: price }),
      })
      const data = await res.json()
      setPinRequired(data.required)
      setPinChecked(true)
    } catch {
      setPinChecked(true)
    }
  }

  async function handleConfirm() {
    if (pinRequired) {
      if (!pin) { setPinError('Please enter your spend PIN'); return }
      setVerifying(true)
      try {
        const res = await fetch('/api/account/spend-pin/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin, amount: price }),
        })
        const data = await res.json()
        if (!data.valid) {
          setPinError('Incorrect PIN')
          setPin('')
          setVerifying(false)
          return
        }
      } catch {
        setPinError('Verification failed')
        setVerifying(false)
        return
      }
      setVerifying(false)
    }
    onConfirm(pinRequired ? pin : undefined)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'var(--card-bg)', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{subtitle}</p>}
        </div>

        {/* Price summary */}
        {price !== undefined && (
          <div style={{ background: 'var(--card-bg-elevated)', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            {exVat !== null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{title} ({priceLabel})</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>£{exVat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>VAT (20%)</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>£{vat!.toFixed(2)}</span>
                </div>
              </>
            )}
            <div style={{ borderTop: '1px solid var(--card-border-hover)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Total charged from credit</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: danger ? '#dc2626' : '#1a6ef5' }}>£{price.toFixed(2)}</span>
            </div>
            {balanceAfter !== undefined && (
              <div style={{ marginTop: '6px', fontSize: '11px', color: balanceAfter < 0 ? '#dc2626' : '#9a9a9a' }}>
                Your balance after: £{balanceAfter.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Custom content */}
        {children}

        {/* Features */}
        {features && features.length > 0 && (
          <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>What's included:</p>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={danger ? '#dc2626' : '#3b6d11'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  {danger ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>}
                </svg>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* PIN input */}
        {pinRequired && pinChecked && (
          <div style={{ background: '#f0f4ff', border: '1px solid #c7d7fd', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a6ef5' }}>Spend PIN required for this amount</span>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={e => { setPin(e.target.value.replace(/\D/g, '')); setPinError('') }}
              placeholder="Enter your spend PIN"
              style={{ width: '100%', height: '38px', border: `1px solid ${pinError ? '#fca5a5' : '#c7d7fd'}`, borderRadius: '6px', fontSize: '18px', padding: '0 12px', fontFamily: 'monospace', letterSpacing: '4px', background: 'var(--input-bg)', outline: 'none', boxSizing: 'border-box' }}
              autoFocus
            />
            {pinError && <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>{pinError}</p>}
            <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
              Your spend PIN is required for purchases above your set threshold. <Link href="/account/security" style={{ color: '#1a6ef5' }}>Manage PIN →</Link>
            </p>
          </div>
        )}

        {/* Terms */}
        {terms && (
          <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
            {terms} By confirming, you agree to our <Link href="/terms" target="_blank" style={{ color: '#1a6ef5' }}>Terms of Service</Link>.
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} disabled={loading || verifying}
            style={{ flex: 1, height: '42px', background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading || verifying || !pinChecked}
            style={{ flex: 2, height: '42px', background: loading || verifying ? '#ccc' : danger ? '#dc2626' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: loading || verifying ? 'not-allowed' : 'pointer' }}>
            {verifying ? 'Verifying PIN...' : loading ? 'Processing...' : (confirmLabel || `Confirm · £${price?.toFixed(2)}`)}
          </button>
        </div>
      </div>
    </div>
  )
}
