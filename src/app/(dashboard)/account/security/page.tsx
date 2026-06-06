'use client'
import { useState, useEffect } from 'react'

export default function SecurityPage() {
  const [pinEnabled, setPinEnabled] = useState(false)
  const [threshold, setThreshold] = useState(50)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // PIN form
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [showSetPin, setShowSetPin] = useState(false)
  const [showRemovePin, setShowRemovePin] = useState(false)

  useEffect(() => {
    fetch('/api/account/spend-pin')
      .then(r => r.json())
      .then(d => { setPinEnabled(d.pinEnabled); setThreshold(d.threshold || 50) })
      .finally(() => setLoading(false))
  }, [])

  async function handleSetPin() {
    setError(''); setSuccess('')
    if (!/^\d{4,6}$/.test(newPin)) { setError('PIN must be 4-6 digits'); return }
    if (newPin !== confirmPin) { setError('PINs do not match'); return }
    if (threshold < 1) { setError('Threshold must be at least £1'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/account/spend-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newPin, threshold, currentPin: pinEnabled ? currentPin : undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Spend PIN updated successfully')
      setPinEnabled(true)
      setShowSetPin(false)
      setNewPin(''); setConfirmPin(''); setCurrentPin('')
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  async function handleRemovePin() {
    setError(''); setSuccess('')
    setSaving(true)
    try {
      const res = await fetch('/api/account/spend-pin', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSuccess('Spend PIN removed')
      setPinEnabled(false)
      setShowRemovePin(false)
      setCurrentPin('')
    } catch (err: any) { setError(err.message) }
    finally { setSaving(false) }
  }

  if (loading) return <div style={{ color: '#9a9a9a', fontSize: '13px' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '560px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Security</h1>
        <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Manage your account security settings</p>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>{success}</div>}

      {/* Spend PIN card */}
      <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '12px', padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: pinEnabled ? '#eaf3de' : '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={pinEnabled ? '#3b6d11' : '#9a9a9a'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>Spend PIN</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>
                {pinEnabled ? `Required for purchases above £${threshold.toFixed(2)}` : 'Not enabled'}
              </p>
            </div>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: pinEnabled ? '#eaf3de' : '#f3f4f6', color: pinEnabled ? '#3b6d11' : '#9a9a9a' }}>
            {pinEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        <p style={{ fontSize: '13px', color: '#5a5a5a', marginBottom: '16px', lineHeight: 1.6 }}>
          A spend PIN adds an extra layer of protection for purchases above your chosen amount. 
          Anyone with access to your account will need to enter the PIN before spending credit above the threshold.
        </p>

        {!showSetPin && !showRemovePin && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => { setShowSetPin(true); setShowRemovePin(false); setError('') }}
              style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
            >
              {pinEnabled ? 'Change PIN' : 'Set PIN'}
            </button>
            {pinEnabled && (
              <button
                onClick={() => { setShowRemovePin(true); setShowSetPin(false); setError('') }}
                style={{ height: '36px', padding: '0 16px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Remove PIN
              </button>
            )}
          </div>
        )}

        {/* Set PIN form */}
        {showSetPin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #ebebeb', paddingTop: '16px' }}>
            {pinEnabled && (
              <div>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Current PIN</label>
                <input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  style={{ width: '100%', height: '38px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '16px', padding: '0 12px', letterSpacing: '4px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>New PIN (4-6 digits)</label>
              <input type="password" inputMode="numeric" maxLength={6} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{ width: '100%', height: '38px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '16px', padding: '0 12px', letterSpacing: '4px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Confirm new PIN</label>
              <input type="password" inputMode="numeric" maxLength={6} value={confirmPin} onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{ width: '100%', height: '38px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '16px', padding: '0 12px', letterSpacing: '4px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Spend threshold (£)</label>
              <input type="number" min="1" step="1" value={threshold} onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', height: '38px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '14px', padding: '0 12px', boxSizing: 'border-box' }} />
              <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px' }}>PIN will be required for purchases above this amount</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowSetPin(false); setNewPin(''); setConfirmPin(''); setCurrentPin(''); setError('') }}
                style={{ flex: 1, height: '36px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', color: '#5a5a5a' }}>
                Cancel
              </button>
              <button onClick={handleSetPin} disabled={saving}
                style={{ flex: 2, height: '36px', background: saving ? '#ccc' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save PIN'}
              </button>
            </div>
          </div>
        )}

        {/* Remove PIN form */}
        {showRemovePin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #ebebeb', paddingTop: '16px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Enter current PIN to remove</label>
              <input type="password" inputMode="numeric" maxLength={6} value={currentPin} onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                style={{ width: '100%', height: '38px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '16px', padding: '0 12px', letterSpacing: '4px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => { setShowRemovePin(false); setCurrentPin(''); setError('') }}
                style={{ flex: 1, height: '36px', background: '#f7f7f7', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', color: '#5a5a5a' }}>
                Cancel
              </button>
              <button onClick={handleRemovePin} disabled={saving}
                style={{ flex: 2, height: '36px', background: saving ? '#ccc' : '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Removing...' : 'Remove PIN'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
