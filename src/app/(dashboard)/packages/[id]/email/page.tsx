import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import EmailManager from './EmailManager'

export default async function PackageEmailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let emailDomains: string[] = []
  let mailboxes: any[] = []
  let forwarders: any[] = []

  try {
    const emailRes = await client.get(`/package/${id}/email`)
    emailDomains = Object.keys(emailRes.data || {})

    if (emailDomains.length > 0) {
      const domain = emailDomains[0]
      const [mbRes, fwdRes] = await Promise.allSettled([
        client.get(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox`),
        client.get(`/package/${id}/allMailForwarders`),
      ])
      if (mbRes.status === 'fulfilled') mailboxes = mbRes.value.data?.mailbox || []
      if (fwdRes.status === 'fulfilled') {
        const fwdData = fwdRes.value.data || {}
        forwarders = Object.entries(fwdData).flatMap(([d, fwds]: [string, any]) =>
          (fwds || []).map((f: any) => ({ ...f, domain: d }))
        )
      }
    }
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>Email management</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
          Manage mailboxes, forwarders and email settings for {pkg.domain_name}
        </p>
      </div>
      <EmailManager
        packageId={id}
        domainName={pkg.domain_name}
        emailDomains={emailDomains}
        initialMailboxes={mailboxes}
        initialForwarders={forwarders}
      />
    </div>
  )
}
