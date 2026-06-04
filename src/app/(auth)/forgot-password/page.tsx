'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '44px', height: '44px', background: '#0a1628', borderRadius: '10px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '20px' }}>🔑</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>Forgot password?</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '6px' }}>Enter your email and we'll send a reset link</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📧</p>
              <p style={{ fontSize: '14px', color: '#444', margin: '0 0 20px' }}>{success}</p>
              <Link href="/login" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Back to login
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>{error}</div>}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>Email address</label>
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                />
              </div>
              <button onClick={handleSubmit} disabled={loading}
                style={{ width: '100%', height: '44px', background: loading ? '#ccc' : '#0a1628', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', margin: 0 }}>
                <Link href="/login" style={{ color: '#1a6ef5', fontWeight: 600, textDecoration: 'none' }}>Back to login</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
