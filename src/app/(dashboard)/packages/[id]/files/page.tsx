import { cookies } from 'next/headers'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'
import FilesManager from './FilesManager'

export default async function PackageFilesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('gsws_session')?.value || ''
  const user = validateSession(token)
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  let ftpUsers: any[] = []
  let ftpCredentials: any[] = []
  let webInfo: any = {}
  let filePerms: any = null

  try {
    const [ftpRes, credsRes, webRes, permsRes] = await Promise.allSettled([
      client.get(`/package/${id}/web/ftpusers`),
      client.get(`/package/${id}/web/ftpCredentials`),
      client.get(`/package/${id}/web`),
      client.get(`/package/${id}/web/filePermissions`),
    ])
    if (ftpRes.status === 'fulfilled') ftpUsers = ftpRes.value.data || []
    if (credsRes.status === 'fulfilled') ftpCredentials = credsRes.value.data || []
    if (webRes.status === 'fulfilled') webInfo = webRes.value.data?.info || {}
    if (permsRes.status === 'fulfilled') filePerms = permsRes.value.data
  } catch {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>Web files</h2>
        <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
          Manage files, FTP accounts and permissions for {pkg.domain_name}
        </p>
      </div>
      <FilesManager
        packageId={id}
        domainName={pkg.domain_name}
        ftpUsers={ftpUsers}
        ftpCredentials={ftpCredentials}
        webInfo={webInfo}
        filePerms={filePerms}
      />
    </div>
  )
}
