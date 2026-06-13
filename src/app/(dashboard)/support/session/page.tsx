'use client'
import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

function SupportSessionContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'active' | 'error'>('loading')
  const [targetEmail, setTargetEmail] = useState('')

  useEffect(() => {
    if (!token) { setStatus('error'); return }
    fetch(`/api/support/session?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.valid) {
          setTargetEmail(d.targetEmail)
          setStatus('active')
          document.cookie = `gsws_impersonate=${token}; path=/; max-age=3600`
          setTimeout(() => router.push('/dashboard'), 1500)
        } else {
          setStatus('error')
        }
      })
      .catch(() => setStatus('error'))
  }, [token])

  if (status === 'loading') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ color: 'var(--text-secondary)' }}>Starting support session...</p>
    </div>
  )

  if (status === 'error') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#dc2626', fontSize: '16px' }}>❌ Invalid or expired session token</p>
        <button onClick={() => router.push('/cli')} style={{ marginTop: '16px', padding: '8px 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Return to CLI
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center', background: 'var(--card-bg)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '32px' }}>
        <p style={{ fontSize: '24px', margin: '0 0 12px' }}>⚠️</p>
        <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px' }}>Support Session Active</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 4px' }}>Viewing as: <strong>{targetEmail}</strong></p>
        <p style={{ fontSize: '12px', color: '#999' }}>Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

export default function SupportSessionPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></div>}>
      <SupportSessionContent />
    </Suspense>
  )
}
