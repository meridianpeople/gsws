import client from './client'

export async function getSshKeys(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/sshkeys`)
  return res.data
}

export async function updateSshKeys(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/sshkeys`, payload)
  return res.data
}

export async function getSshIps(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/sshipaddress`)
  return res.data
}

export async function getFtpUsers(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/ftpusers`)
  return res.data
}

export async function updateFtpUser(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/ftpusers`, payload)
  return res.data
}

export async function getMalwareReport(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/malwareReport`)
  return res.data
}

export async function runMalwareScan(packageId: string) {
  const res = await client.post(`/package/${packageId}/web/malwareScan`, {})
  return res.data
}

export async function getBlockedIps(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/blockedIpAddresses`)
  return res.data
}

export async function setBlockedIps(packageId: string, ips: string[]) {
  const res = await client.post(`/package/${packageId}/web/blockedIpAddresses`, { ips })
  return res.data
}

export async function getBlockedCountries(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/blockedCountries`)
  return res.data
}

export async function setBlockedCountries(packageId: string, countries: string[]) {
  const res = await client.post(`/package/${packageId}/web/blockedCountries`, { countries })
  return res.data
}

export async function getPasswordProtection(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/passwordProtection`)
  return res.data
}

export async function setPasswordProtection(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/passwordProtection`, payload)
  return res.data
}

export async function getHotlinkProtection(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/preventHotlinking`)
  return res.data
}

export async function setHotlinkProtection(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/preventHotlinking`, payload)
  return res.data
}
