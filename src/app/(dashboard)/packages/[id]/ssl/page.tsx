import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'
import SSLManager from './SSLManager'

export default async function PackageSSLPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let certs: any[] = []
  let forceSSL = false
  let webNames: string[] = []

  try {
    const [certsRes, forceRes, namesRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/certificates`),
      client.get(`/package/${id}/web/forceSSL`),
      client.get(`/package/${id}/web/names`),
    ])
    if (certsRes.status === 'fulfilled') certs = certsRes.value.data || []
    if (forceRes.status === 'fulfilled') forceSSL = forceRes.value.data === true
    if (namesRes.status === 'fulfilled') webNames = Array.isArray(namesRes.value.data) ? namesRes.value.data : []
  } catch {}

  if (!webNames.length) webNames = [pkg.domain_name]

  return (
    <SSLManager
      packageId={id}
      domainName={pkg.domain_name}
      initialCerts={certs}
      initialForceSSL={forceSSL}
      webNames={webNames}
    />
  )
}
