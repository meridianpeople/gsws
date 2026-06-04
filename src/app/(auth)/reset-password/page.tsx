'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!token) { setTokenValid(false); return }
    fetch(`/api/auth/reset-password?token=${token}`)
      .then(r => r.json())
      .then(d => { setTokenValid(d.valid); setEmail(d.email || '') })
      .catch(() => setTokenValid(false))
  }, [token])

  async function handleReset() {
    if (!form.password || !form.confirmPassword) { setError('All fields required'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }

    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
      setTimeout(() => router.push('/login'), 3000)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  if (tokenValid === null) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <p style={{ color: '#666' }}>Validating reset link...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '44px', height: '44px', background: '#0a1628', borderRadius: '10px', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: '20px' }}>🔐</span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#0a0a0a', margin: 0 }}>Reset password</h1>
          {email && <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '6px' }}>for {email}</p>}
        </div>

        <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '28px' }}>
          {!tokenValid ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>❌</p>
              <p style={{ fontSize: '14px', color: '#444', margin: '0 0 20px' }}>This reset link is invalid or has expired.</p>
              <Link href="/forgot-password" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                Request new link
              </Link>
            </div>
          ) : success ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '32px', margin: '0 0 12px' }}>✅</p>
              <p style={{ fontSize: '14px', color: '#444', margin: '0 0 8px' }}>{success}</p>
              <p style={{ fontSize: '12px', color: '#999' }}>Redirecting to login...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {error && <div style={{ padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>{error}</div>}
              {[
                { key: 'password', label: 'New password', placeholder: 'Min. 8 characters' },
                { key: 'confirmPassword', label: 'Confirm new password', placeholder: 'Repeat password' },
              ].map(field => (
                <div key={field.key}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#444', display: 'block', marginBottom: '5px' }}>{field.label}</label>
                  <input type="password" value={(form as any)[field.key]}
                    onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder={field.placeholder}
                    style={{ width: '100%', height: '40px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <button onClick={handleReset} disabled={loading}
                style={{ width: '100%', height: '44px', background: loading ? '#ccc' : '#0a1628', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Resetting...' : 'Reset password'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Loading...</p></div>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
