import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import PackageDNSManager from './PackageDNSManager'

export default async function PackageDNSPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let dnsData: any = {}
  let nameservers: string[] = []

  try {
    const [dnsRes, nsRes] = await Promise.allSettled([
      client.get(`/package/${id}/dns`),
      client.get(`/package/${id}/web/nameservers`),
    ])
    if (dnsRes.status === 'fulfilled') dnsData = dnsRes.value.data || {}
    if (nsRes.status === 'fulfilled') nameservers = nsRes.value.data?.nameservers || nsRes.value.data || []
  } catch {}

  const domains = Object.keys(dnsData)
  const allRecords = domains.flatMap(domain =>
    (dnsData[domain]?.records || []).map((r: any) => ({
      ...r,
      domain,
      data: r.target || r.ip || r.ipv6 || r.txt || r.mname || '',
    }))
  )

  // Filter out NS and SOA from main records — show them in nameservers section
  const dnsRecords = allRecords.filter(r => r.type !== 'SOA')
  const nsRecords = allRecords.filter(r => r.type === 'NS').map(r => r.data)
  const currentNS = nameservers.length > 0 ? nameservers : nsRecords

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>DNS management</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
          Manage DNS records and nameservers for {pkg.domain_name}
        </p>
      </div>

      <PackageDNSManager
        packageId={id}
        initialRecords={dnsRecords}
        domainName={pkg.domain_name}
        currentNameservers={currentNS}
      />
    </div>
  )
}
