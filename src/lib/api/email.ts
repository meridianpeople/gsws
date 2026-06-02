import client from './client'

export async function getEmailConfig(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}`)
  return res.data
}

export async function getMailboxes(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/mailbox`)
  return res.data
}

export async function updateMailboxes(packageId: string, emailId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/email/${emailId}`, payload)
  return res.data
}

export async function getMailboxStats(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/stats`)
  return res.data
}

export async function getForwarders(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/forwarder`)
  return res.data
}

export async function getAllForwarders(packageId: string) {
  const res = await client.get(`/package/${packageId}/allMailForwarders`)
  return res.data
}

export async function getAutoresponder(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/responder`)
  return res.data
}

export async function getSpamBlacklist(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/spamPolicyListBlacklist`)
  return res.data
}

export async function getSpamWhitelist(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/spamPolicyListWhitelist`)
  return res.data
}

export async function getDkim(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/signature`)
  return res.data
}

export async function setDkim(packageId: string, emailId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/email/${emailId}/signature`, payload)
  return res.data
}

export async function getDmarc(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/dmarc`)
  return res.data
}

export async function setDmarc(packageId: string, emailId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/email/${emailId}/dmarc`, payload)
  return res.data
}

export async function getWebmailUrl(packageId: string, emailId: string, mailbox: string) {
  const res = await client.post(`/package/${packageId}/email/${emailId}/webmail`, { mailbox })
  return res.data
}

export async function getDomainAliases(packageId: string, emailId: string) {
  const res = await client.get(`/package/${packageId}/email/${emailId}/domainAlias`)
  return res.data
}
