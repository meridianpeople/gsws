import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import BackupsManager from './BackupsManager'

export default async function PackageBackupsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let backupData: any = null
  let webJobs: any[] = []

  try {
    const [backupRes, jobsRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/timelineBackup`),
      client.get(`/package/${id}/web/timelineBackup/web/jobs`),
    ])
    if (backupRes.status === 'fulfilled') backupData = backupRes.value.data
    if (jobsRes.status === 'fulfilled') webJobs = Array.isArray(jobsRes.value.data) ? jobsRes.value.data : []
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Backups</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Create and restore backups for {pkg.domain_name}
        </p>
      </div>
      <BackupsManager packageId={id} backupData={backupData} webJobs={webJobs} domainName={pkg.domain_name} />
    </div>
  )
}
