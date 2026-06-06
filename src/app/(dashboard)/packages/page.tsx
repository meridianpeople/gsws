import Link from 'next/link'
import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export default async function PackagesPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter } = await searchParams
  const cookieStore = await cookies()
  const user = await getGswsSession()

  const allPackages = user ? db.prepare(`
    SELECT twentyi_package_id as id, domain_name as name, package_type as type,
           package_label as label, status, created_at
    FROM gsws_user_packages WHERE user_id = ? ORDER BY created_at DESC
  `).all(user.id) : []
  const packages = filter ? (allPackages as any[]).filter((p: any) => p.type?.toLowerCase().includes(filter.toLowerCase()) || p.label?.toLowerCase().includes(filter.toLowerCase())) : allPackages

  const domains = user ? db.prepare(`
    SELECT domain_name as name FROM gsws_user_domains WHERE user_id = ?
  `).all(user.id) : []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Hosting packages</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>
            {packages.length > 0
              ? `${packages.length} package${packages.length !== 1 ? 's' : ''} across ${domains.length} domain${domains.length !== 1 ? 's' : ''}`
              : 'Add a domain before creating a hosting package.'}
          </p>
        </div>
        {domains.length > 0 ? (
          <Link href="/packages/new"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', boxShadow: '0 2px 8px rgba(26,110,245,0.3)' }}>
            + Add package
          </Link>
        ) : (
          <Link href="/domains/search"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
            Register domain first
          </Link>
        )}
      </div>

      {/* No domain gate */}
      {domains.length === 0 && (
        <div style={{ background: '#fff', border: '1px dashed #d4d4d4', borderRadius: '10px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0a0a0a' }}>No domains yet</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', maxWidth: '340px' }}>
            You need at least one domain before creating a hosting package.
          </p>
          <Link href="/domains/search"
            style={{ display: 'inline-flex', padding: '0 20px', height: '36px', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginTop: '4px' }}>
            Register a domain →
          </Link>
        </div>
      )}

      {/* Has domains but no packages */}
      {domains.length > 0 && packages.length === 0 && (
        <div style={{ background: '#fff', border: '1px dashed #d4d4d4', borderRadius: '10px', padding: '48px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0a0a0a' }}>No packages yet</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', maxWidth: '340px' }}>
            Create your first hosting package for one of your domains.
          </p>
          <Link href="/packages/new"
            style={{ display: 'inline-flex', padding: '0 20px', height: '36px', alignItems: 'center', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', marginTop: '4px' }}>
            Create first package →
          </Link>
        </div>
      )}

      {/* Packages table */}
      {packages.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid #ebebeb', background: '#f7f7f7' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>
              {packages.length} active package{packages.length !== 1 ? 's' : ''}
            </h2>
          </div>
          <table className="gsws-table">
            <thead>
              <tr>
                <th>Package / domain</th>
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg: any) => (
                <tr key={pkg.id}>
                  <td style={{ fontWeight: 600, color: '#0a0a0a', fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}>
                    {pkg.name}
                  </td>
                  <td>
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                      background: pkg.type === 'wordpress' ? '#e6f1fb' : pkg.type === 'windows' ? '#faeeda' : '#f1efe8',
                      color: pkg.type === 'wordpress' ? '#185fa5' : pkg.type === 'windows' ? '#854f0b' : '#5a5a5a',
                    }}>
                      {pkg.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>
                      Active
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#9a9a9a' }}>
                    {new Date(pkg.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td>
                    <Link href={`/packages/${pkg.id}`}
                      style={{ padding: '0 12px', height: '26px', display: 'inline-flex', alignItems: 'center', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', color: '#0a0a0a', textDecoration: 'none', background: '#fff' }}>
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hosting types */}
      {domains.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {[
            { type: 'WordPress Unlimited', desc: 'Optimised WP + staging', href: '/packages/new?type=wordpress', bg: '#e6f1fb', color: '#185fa5' },
            { type: 'Linux Unlimited', desc: 'PHP, MySQL, FTP', href: '/packages/new?type=linux', bg: '#f1efe8', color: '#5a5a5a' },
            { type: 'Windows Unlimited', desc: 'IIS, ASP.NET, MSSQL', href: '/packages/new?type=windows', bg: '#faeeda', color: '#854f0b' },
          ].map(ht => (
            <Link key={ht.type} href={ht.href}
              style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '16px 20px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', textDecoration: 'none', transition: 'border-color 0.15s' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '20px', background: ht.bg, color: ht.color, alignSelf: 'flex-start' }}>{ht.type}</span>
              <p style={{ fontSize: '12px', color: '#9a9a9a' }}>{ht.desc}</p>
              <p style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500 }}>Add package →</p>
            </Link>
          ))}
        </div>
      )}

    </div>
  )
}
