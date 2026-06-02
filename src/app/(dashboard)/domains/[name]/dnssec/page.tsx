import Link from 'next/link'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export default async function DnssecPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const domainName = decodeURIComponent(name)
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const owned = user ? db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?').get(user.id, domainName) : null
  if (!owned) return <div style={{ padding: '48px', textAlign: 'center', color: '#a32d2d' }}>Access denied.</div>
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
          <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link> ›{' '}
          <Link href={"/domains/" + name} style={{ color: '#1a6ef5' }}>{domainName}</Link> › Dnssec
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Dnssec</h1>
      </div>
      <div className="gsws-card" style={{ textAlign: 'center', padding: '48px', border: '1px dashed #d4d4d4' }}>
        <p style={{ fontSize: '13px', color: '#9a9a9a' }}>Dnssec management coming soon.</p>
      </div>
    </div>
  )
}
