import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'
import SubdomainsManager from './SubdomainsManager'

export default async function SubdomainsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let subdomains: any = {}
  let webNames: string[] = []
  try {
    const [subRes, namesRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/subdomains`),
      client.get(`/package/${id}/web/names`),
    ])
    if (subRes.status === 'fulfilled') subdomains = subRes.value.data || {}
    if (namesRes.status === 'fulfilled') webNames = Array.isArray(namesRes.value.data) ? namesRes.value.data : []
  } catch {}

  if (!webNames.length) webNames = [pkg.domain_name]
  const primaryDomain = webNames[0] || pkg.domain_name

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>Subdomains</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>Manage subdomains for {primaryDomain}</p>
      </div>
      <SubdomainsManager packageId={id} domainName={primaryDomain} webNames={webNames} initialSubdomains={subdomains} />
    </div>
  )
}
