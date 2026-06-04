'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', couponCode: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [couponInfo, setCouponInfo] = useState<{ code: string; amount: number } | null>(null)

  async function handleRegister() {
    setError(''); setSuccess('')
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, couponCode: form.couponCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      if (data.couponApplied) setCouponInfo(data.couponApplied)
      setSuccess(data.message)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '44px', height: '44px', background: '#0a1628', borderRadius: '10px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '20px' }}>⚡</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>Create your account</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '6px' }}>GeiG Simple Web Service</p>
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '28px' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>📧</p>
              <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Check your email</h2>
              <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px' }}>{success}</p>
              {couponInfo && (
                <div style={{ padding: '12px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', marginBottom: '16px' }}>
                  <p style={{ fontSize: '13px', color: '#166534', margin: 0 }}>
                    🎁 Coupon <strong>{couponInfo.code}</strong> applied — <strong>£{couponInfo.amount.toFixed(2)}</strong> credit added!
                  </p>
                </div>
              )}
              <Link href="/login" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Go to login
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && (
                <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
                  {error}
                </div>
              )}

              {[
                { key: 'name', label: 'Full name', type: 'text', placeholder: 'John Smith' },
                { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
                { key: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }}
                  />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
                  Coupon code <span style={{ fontWeight: 400, color: '#9a9a9a' }}>(optional)</span>
                </label>
                <input
                  type="text"
                  value={form.couponCode}
                  onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME20"
                  style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace', letterSpacing: '1px', outline: 'none' }}
                />
              </div>

              <button
                onClick={handleRegister}
                disabled={loading}
                style={{ width: '100%', height: '44px', background: loading ? '#ccc' : '#0a1628', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '13px', color: '#666', margin: 0 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: '#1a6ef5', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
