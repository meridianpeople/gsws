import Link from 'next/link'
import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import PackageTabs from './PackageTabs'

export default async function PackageLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)

  const pkg = user ? db.prepare(`
    SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?
  `).get(id, user.id) as any : null

  const tabs = [
    { label: 'Overview', href: `/packages/${id}` },
    { label: 'Email', href: `/packages/${id}/email` },
    { label: 'Files', href: `/packages/${id}/files` },
    { label: 'DNS', href: `/packages/${id}/dns` },
    { label: 'SSL', href: `/packages/${id}/ssl` },
    { label: 'CDN', href: `/packages/${id}/cdn` },
    { label: 'Databases', href: `/packages/${id}/databases` },
    { label: 'PHP', href: `/packages/${id}/php` },
    { label: 'Backups', href: `/packages/${id}/backups` },
    { label: 'Security', href: `/packages/${id}/security` },
    { label: 'Applications', href: `/packages/${id}/applications` },
    ...(pkg?.package_type === 'wordpress' ? [{ label: 'WordPress', href: `/packages/${id}/wordpress` }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
            <Link href="/packages" style={{ color: '#1a6ef5' }}>Packages</Link> › {pkg?.domain_name}
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace' }}>
            {pkg?.domain_name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: pkg?.package_type === 'wordpress' ? '#e6f1fb' : '#f1efe8', color: pkg?.package_type === 'wordpress' ? '#185fa5' : '#5a5a5a' }}>
              {pkg?.package_label}
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href={`https://${pkg?.domain_name}`} target="_blank"
            style={{ height: '34px', padding: '0 14px', display: 'inline-flex', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
            Visit site ↗
          </a>
        </div>
      </div>

      <PackageTabs tabs={tabs} />

      {children}
    </div>
  )
}
