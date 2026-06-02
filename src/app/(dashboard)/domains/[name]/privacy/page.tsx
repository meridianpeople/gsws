import Link from 'next/link'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export default async function PrivacyPage({ params }: { params: Promise<{ name: string }> }) {
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
          <Link href={`/domains/${name}`} style={{ color: '#1a6ef5' }}>{domainName}</Link> › WHOIS privacy
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>WHOIS privacy</h1>
      </div>
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Privacy protection</p>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Your personal details are hidden from the public WHOIS database.</p>
          </div>
          <span style={{ padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
        </div>
        <div style={{ padding: '14px 16px', background: '#eaf3de', borderRadius: '8px', fontSize: '12px', color: '#3b6d11' }}>
          ✓ WHOIS privacy is enabled for {domainName}. Your contact details are protected.
        </div>
      </div>
    </div>
  )
}
