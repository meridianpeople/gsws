import { cookies } from 'next/headers'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import DatabaseManager from './DatabaseManager'
import MssqlManager from './MssqlManager'

export default async function PackageDatabasesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cookieStore = await cookies()
  const user = await getGswsSession()
  const pkg = user ? db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any : null
  if (!pkg) return <div style={{ color: '#a32d2d', padding: '24px' }}>Access denied.</div>

  const isWindows = pkg.package_type === 'windows'

  let databases: any[] = []
  let mysqlUsers: any[] = []
  let mssqlDatabases: any[] = []

  if (isWindows) {
    try {
      const res = await client.get('/mssql')
      const all = res.data || []
      mssqlDatabases = all.filter((m: any) => String(m.packageId) === String(id) || String(m.packageName) === pkg.domain_name)
    } catch {}
  } else {
    try {
      const [dbRes, usersRes] = await Promise.allSettled([
        client.get(`/package/${id}/web/mysqlDatabases`),
        client.get(`/package/${id}/web/mysqlUsers`),
      ])
      if (dbRes.status === 'fulfilled') databases = dbRes.value.data || []
      if (usersRes.status === 'fulfilled') mysqlUsers = usersRes.value.data || []
    } catch {}
  }

  const databasesWithUsers = databases.map((d: any) => ({
    ...d,
    mysqlUserId: mysqlUsers.find((u: any) => u.username === d.name)?.user_id || null,
  }))

  const credits = user ? db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any : null
  const balance = credits?.balance || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {isWindows ? (
        <MssqlManager packageId={id} initialDatabases={mssqlDatabases} creditBalance={balance} />
      ) : (
        <>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>MySQL databases</h2>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
              {databases.length} database{databases.length !== 1 ? 's' : ''} · {pkg.domain_name}
            </p>
          </div>
          <DatabaseManager packageId={id} initialDatabases={databasesWithUsers} storedDbs={[]} />
        </>
      )}
    </div>
  )
}
