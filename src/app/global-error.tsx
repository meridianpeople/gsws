'use client'
import { useEffect, useMemo } from 'react'
import './globals.css'
import { generateErrorRef } from '@/lib/error-ref'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  const ref = useMemo(() => generateErrorRef(), [])

  useEffect(() => {
    console.error(`[${ref}] Global error:`, error)
  }, [error, ref])

  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased">
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: '20px' }}>
          <div style={{ maxWidth: '440px', width: '100%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Something went wrong</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
              We&apos;ve logged the issue for investigation. Please refresh the page — if the problem continues, contact support and quote the reference below.
            </p>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: 'var(--text-tertiary)', background: 'var(--card-bg-elevated)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '8px 12px', marginBottom: '20px' }}>
              {ref}
            </p>
            <button onClick={() => reset()} style={{ height: '38px', padding: '0 24px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
