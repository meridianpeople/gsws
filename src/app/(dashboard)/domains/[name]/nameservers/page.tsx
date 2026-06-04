import NameserversManager from './NameserversManager'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function NameserversPage({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params
  const domainName = decodeURIComponent(name)
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const owned = user ? db.prepare('SELECT * FROM gsws_user_domains WHERE user_id = ? AND domain_name = ?').get(user.id, domainName) : null
  if (!owned) return <div style={{ padding: '48px', textAlign: 'center', color: '#a32d2d' }}>Access denied.</div>
  return <NameserversManager domainName={domainName} paramName={name} />
}
