import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function ContactsPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const domainName = decodeURIComponent(name)
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const owned = user ? db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?').get(user.id, domainName) : null
  if (!owned) return <div style={{ padding: '48px', textAlign: 'center', color: '#a32d2d' }}>Access denied.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link> ›{' '}
          <Link href={"/domains/" + name} style={{ color: '#1a6ef5' }}>{domainName}</Link> › Contacts
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Contacts</h1>
      </div>
      <div className="gsws-card" style={{ textAlign: 'center', padding: '48px', border: '1px dashed var(--card-border-hover)' }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Contacts management coming soon.</p>
      </div>
    </div>
  )
}
