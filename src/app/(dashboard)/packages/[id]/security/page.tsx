import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import SecurityManager from './SecurityManager'

export default async function PackageSecurityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let malwareScan: any[] = []
  let malwareReport: any = null
  let forceSSL = false
  let hotlinkProtection: any = null

  try {
    const [scanRes, reportRes, sslRes, hotlinkRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/malwareScan`),
      client.get(`/package/${id}/web/malwareReport`),
      client.get(`/package/${id}/web/forceSSL`),
      client.get(`/package/${id}/web/hotlinkProtection`),
    ])
    if (scanRes.status === 'fulfilled') malwareScan = scanRes.value.data || []
    if (reportRes.status === 'fulfilled') malwareReport = reportRes.value.data
    if (sslRes.status === 'fulfilled') forceSSL = sslRes.value.data?.enabled || false
    if (hotlinkRes.status === 'fulfilled') hotlinkProtection = hotlinkRes.value.data
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Security</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>Manage security settings for {pkg.domain_name}</p>
      </div>
      <SecurityManager
        packageId={id}
        domainName={pkg.domain_name}
        malwareScan={malwareScan}
        malwareReport={malwareReport}
        initialForceSSL={forceSSL}
        hotlinkProtection={hotlinkProtection}
      />
    </div>
  )
}
