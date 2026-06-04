'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', couponCode: '' })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
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

  async function handleOAuth(provider: 'github' | 'google') {
    setOauthLoading(provider)
    setError('')
    try {
      const { createAuthClient } = await import('better-auth/client')
      const client = createAuthClient({ baseURL: window.location.origin })
      await client.signIn.social({ provider, callbackURL: '/dashboard' })
    } catch {
      setError('Failed to connect with ' + provider + '. Please try again.')
      setOauthLoading(null)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', height: '40px', padding: '0 12px',
    border: '1px solid #e5e7eb', borderRadius: '8px',
    fontSize: '14px', boxSizing: 'border-box', outline: 'none',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading || loading}
                  style={{ width: '100%', height: '42px', border: '1px solid #e5e7eb', background: '#fff',
                    color: '#111', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    opacity: oauthLoading && oauthLoading !== 'google' ? 0.4 : 1 }}>
                  {oauthLoading === 'google' ? 'Connecting...' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Continue with Google
                    </>
                  )}
                </button>

                <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading || loading}
                  style={{ width: '100%', height: '42px', border: '1px solid #e5e7eb', background: '#fff',
                    color: '#111', borderRadius: '8px', fontSize: '13px', fontWeight: 500,
                    cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    opacity: oauthLoading && oauthLoading !== 'github' ? 0.4 : 1 }}>
                  {oauthLoading === 'github' ? 'Connecting...' : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                      </svg>
                      Continue with GitHub
                    </>
                  )}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                <span style={{ fontSize: '11px', color: '#9a9a9a' }}>or register with email</span>
                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
              </div>

              {[
                { key: 'name', label: 'Full name', type: 'text', placeholder: 'John Smith' },
                { key: 'email', label: 'Email address', type: 'email', placeholder: 'you@example.com' },
                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min. 8 characters' },
                { key: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                  <input type={field.type} value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    style={inp} />
                </div>
              ))}

              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>
                  Coupon code <span style={{ fontWeight: 400, color: '#9a9a9a' }}>(optional)</span>
                </label>
                <input type="text" value={form.couponCode}
                  onChange={e => setForm(f => ({ ...f, couponCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. WELCOME20"
                  style={{ ...inp, fontFamily: 'monospace', letterSpacing: '1px' }} />
              </div>

              <button onClick={handleRegister} disabled={loading || !!oauthLoading}
                style={{ width: '100%', height: '44px', background: loading ? '#ccc' : '#0a1628', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '4px' }}>
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
