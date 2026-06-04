import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import AppPoolManager from './AppPoolManager'

export default async function AppPoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let config: any = {}
  try {
    const res = await client.get(`/package/${id}/web/windowsConfiguration`)
    config = res.data || {}
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>Windows App Pool</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>IIS Application Pool configuration for {pkg.domain_name}</p>
      </div>
      <AppPoolManager packageId={id} domainName={pkg.domain_name} config={config} />
    </div>
  )
}
