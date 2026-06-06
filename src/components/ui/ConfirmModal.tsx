'use client'
import Link from 'next/link'

interface ConfirmModalProps {
  onConfirm: () => void
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

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', width: '100%', maxWidth: '500px', padding: '28px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>{title}</h2>
          {subtitle && <p style={{ fontSize: '13px', color: '#9a9a9a' }}>{subtitle}</p>}
        </div>

        {/* Price summary */}
        {price !== undefined && (
          <div style={{ background: '#f7f7f7', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px' }}>
            {exVat !== null && (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#5a5a5a' }}>{title} ({priceLabel})</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>£{exVat.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', color: '#5a5a5a' }}>VAT (20%)</span>
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>£{vat!.toFixed(2)}</span>
                </div>
              </>
            )}
            <div style={{ borderTop: '1px solid #d4d4d4', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
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

        {/* Custom content slot */}
        {children}

        {/* Features */}
        {features && features.length > 0 && (
          <div style={{ border: '1px solid #ebebeb', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>What's included:</p>
            {features.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={danger ? '#dc2626' : '#3b6d11'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  {danger ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> : <polyline points="20 6 9 17 4 12"/>}
                </svg>
                <span style={{ fontSize: '12px', color: '#5a5a5a' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Terms */}
        {terms && (
          <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '16px', lineHeight: 1.5 }}>
            {terms} By confirming, you agree to our{' '}
            <Link href="/terms" style={{ color: '#1a6ef5' }}>Terms of Service</Link>.
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancel} disabled={loading}
            style={{ flex: 1, height: '42px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', color: '#5a5a5a' }}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={loading}
            style={{ flex: 2, height: '42px', background: loading ? '#ccc' : danger ? '#dc2626' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : (confirmLabel || `Confirm · £${price?.toFixed(2)}`)}
          </button>
        </div>
      </div>
    </div>
  )
}
