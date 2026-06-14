import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--page-bg)', padding: '20px' }}>
      <div style={{ maxWidth: '440px', width: '100%', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>We couldn&apos;t find this page</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
          The page may have moved, expired, or you may not have access to it.
        </p>
        <Link href="/dashboard" style={{ height: '36px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Go to dashboard
        </Link>
      </div>
    </div>
  )
}
