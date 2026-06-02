import client from './client'

export async function getTimelineStorages(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/timelineStorages`)
  return res.data
}

export async function getWebBackup(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/timelineBackup/web`)
  return res.data
}

export async function getWebBackupJobs(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/timelineBackup/web/jobs`)
  return res.data
}

export async function takeWebSnapshot(packageId: string) {
  const res = await client.post(`/package/${packageId}/web/timelineBackup/web/takeSnapshot`, {})
  return res.data
}

export async function restoreWebSnapshot(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/timelineBackup/web/restoreSnapshot`, payload)
  return res.data
}

export async function getDbBackupJobs(packageId: string, databaseId: string) {
  const res = await client.get(`/package/${packageId}/web/timelineBackup/database/${databaseId}/jobs`)
  return res.data
}

export async function takeDbSnapshot(packageId: string, databaseId: string) {
  const res = await client.post(`/package/${packageId}/web/timelineBackup/database/${databaseId}/takeSnapshot`, {})
  return res.data
}

export async function restoreDbSnapshot(packageId: string, databaseId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/timelineBackup/database/${databaseId}/restoreSnapshot`, payload)
  return res.data
}

export async function getMailboxBackupJobs(packageId: string, mailboxId: string) {
  const res = await client.get(`/package/${packageId}/web/timelineBackup/mailbox/${mailboxId}/jobs`)
  return res.data
}

export async function restoreMailboxSnapshot(packageId: string, mailboxId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/timelineBackup/mailbox/${mailboxId}/restoreSnapshot`, payload)
  return res.data
}
