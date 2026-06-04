'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => {
        if (r.redirected && r.url.includes('verified=1')) setStatus('success')
        else if (r.ok || r.redirected) setStatus('success')
        else setStatus('error')
      })
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
        {status === 'loading' && <><p style={{ fontSize: '32px' }}>⏳</p><p style={{ color: '#666' }}>Verifying your email...</p></>}
        {status === 'success' && (
          <>
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>✅</p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Email verified!</h2>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px' }}>Your account is now active. You can sign in.</p>
            <Link href="/login" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <p style={{ fontSize: '32px', margin: '0 0 12px' }}>❌</p>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 8px' }}>Invalid or expired link</h2>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 20px' }}>This verification link has expired or already been used.</p>
            <Link href="/register" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>Register again</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#666' }}>Loading...</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
