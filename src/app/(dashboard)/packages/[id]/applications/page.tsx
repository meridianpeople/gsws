import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import ApplicationsManager from './ApplicationsManager'

export default async function PackageApplicationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let oneClicks: any = {}
  let installed: any[] = []

  try {
    const [appsRes, installedRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/oneclick`),
      client.get(`/package/${id}/web/installedApplications`),
    ])
    if (appsRes.status === 'fulfilled') oneClicks = appsRes.value.data || {}
    if (installedRes.status === 'fulfilled') installed = installedRes.value.data || []
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>One-click installs</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          Install popular applications on {pkg.domain_name} with one click
        </p>
      </div>
      <ApplicationsManager
        packageId={id}
        domainName={pkg.domain_name}
        oneClicks={oneClicks}
        installed={installed}
      />
    </div>
  )
}
