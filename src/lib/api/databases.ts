import client from './client'

export async function getMysqlDatabases(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/mysqlDatabases`)
  return res.data
}

export async function createMysqlDatabase(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/mysqlDatabases`, payload)
  return res.data
}

export async function removeMysqlDatabase(packageId: string, dbId: string) {
  const res = await client.post(`/package/${packageId}/web/removeMysqlDatabase`, { id: dbId })
  return res.data
}

export async function updateMysqlPassword(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/mysqlUserPassword`, payload)
  return res.data
}

export async function getMssqlDatabases(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/mssqlDatabases`)
  return res.data
}

export async function createMssqlDatabase(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/mssqlDatabases`, payload)
  return res.data
}

export async function removeMssqlDatabase(packageId: string, dbId: string) {
  const res = await client.post(`/package/${packageId}/web/removeMssqlDatabase`, { id: dbId })
  return res.data
}
