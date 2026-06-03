import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'
import RedirectsManager from './RedirectsManager'

export default async function PackageRedirectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let redirects: any[] = []
  let webNames: string[] = []
  try {
    const [redRes, namesRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/redirects`),
      client.get(`/package/${id}/web/names`),
    ])
    if (redRes.status === 'fulfilled') {
      const raw = redRes.value.data || {}
      for (const [domain, types] of Object.entries(raw as any)) {
        for (const [type, rules] of Object.entries(types as any)) {
          for (const [from, to] of Object.entries(rules as any)) {
            redirects.push({ domain, type, from, to })
          }
        }
      }
    }
    if (namesRes.status === 'fulfilled') webNames = Array.isArray(namesRes.value.data) ? namesRes.value.data : []
  } catch {}

  if (!webNames.length) webNames = [pkg.domain_name]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>Redirects</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>Manage URL redirects for {pkg.domain_name}</p>
      </div>
      <RedirectsManager packageId={id} domainName={pkg.domain_name} initialRedirects={redirects} webNames={webNames} />
    </div>
  )
}
