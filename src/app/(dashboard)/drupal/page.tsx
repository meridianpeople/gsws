import Link from 'next/link'

export default function DrupalPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Drupal</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Coming soon</p>
      </div>
      <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
        <p style={{ fontSize: '32px', marginBottom: '12px' }}>🚧</p>
        <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>Drupal management</p>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>This section is coming soon. Contact support for assistance.</p>
        <a href="mailto:support@geig.co.uk" style={{ height: '36px', padding: '0 20px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          Contact support
        </a>
      </div>
    </div>
  )
}
