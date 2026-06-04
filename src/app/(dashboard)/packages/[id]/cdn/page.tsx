import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import CDNManager from './CDNManager'

export default async function PackageCDNPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let cdnOptions: any[] = []
  let cdnStats: any = null
  let cdnHeaders: any[] = []
  let blockedCountries: any = { countries: [], type: null }
  let blockedIps: string[] = []
  let stackCache: any = {}

  try {
    const [optRes, statsRes, headersRes, countriesRes, ipsRes, cacheRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/cdnOptions`),
      client.get(`/package/${id}/web/cdnStats`),
      client.get(`/package/${id}/web/cdnSecurityHeaders`),
      client.get(`/package/${id}/web/blockedCountries`),
      client.get(`/package/${id}/web/blockedIpAddresses`),
      client.get(`/package/${id}/web/stackCache`),
    ])
    if (optRes.status === 'fulfilled') cdnOptions = optRes.value.data || []
    if (statsRes.status === 'fulfilled') cdnStats = statsRes.value.data?.result || null
    if (headersRes.status === 'fulfilled') cdnHeaders = headersRes.value.data || []
    if (countriesRes.status === 'fulfilled') blockedCountries = countriesRes.value.data || { countries: [], type: null }
    if (ipsRes.status === 'fulfilled') blockedIps = ipsRes.value.data || []
    if (cacheRes.status === 'fulfilled') stackCache = cacheRes.value.data || {}
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>CDN & Performance</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
          Manage CDN, caching, security and performance for {pkg.domain_name}
        </p>
      </div>
      <CDNManager
        packageId={id}
        domainName={pkg.domain_name}
        cdnOptions={cdnOptions}
        cdnStats={cdnStats}
        cdnHeaders={cdnHeaders}
        initialBlockedCountries={blockedCountries}
        initialBlockedIps={Array.isArray(blockedIps) ? blockedIps : []}
        stackCache={stackCache}
      />
    </div>
  )
}
