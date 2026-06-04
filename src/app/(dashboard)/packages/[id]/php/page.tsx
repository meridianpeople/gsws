import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import PHPVersionSelector from './PHPVersionSelector'

export default async function PackagePHPPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let currentVersion = ''
  let availableVersions: any[] = []
  let phpConfig: any[] = []

  try {
    const [curRes, availRes, configRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/phpVersion`),
      client.get(`/package/${id}/web/availablePhpVersions`),
      client.get(`/package/${id}/web/allowedPhpConfiguration`),
    ])
    if (curRes.status === 'fulfilled') currentVersion = curRes.value.data || ''
    if (availRes.status === 'fulfilled') availableVersions = availRes.value.data || []
    if (configRes.status === 'fulfilled') phpConfig = configRes.value.data || []
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>PHP settings</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>Manage PHP version and configuration for {pkg.domain_name}</p>
      </div>
      <PHPVersionSelector
        packageId={id}
        currentVersion={currentVersion}
        availableVersions={availableVersions}
        phpConfig={phpConfig}
        domainName={pkg.domain_name}
      />
    </div>
  )
}
