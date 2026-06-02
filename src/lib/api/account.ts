import client from './client'

const RESELLER_ID = process.env.TWENTYI_RESELLER_ID || 'me'

export async function getAccountBalance() {
  const res = await client.get(`/reseller/${RESELLER_ID}/accountBalance`)
  return res.data
}

export async function updateResellerSettings(payload: Record<string, unknown>) {
  const res = await client.post(`/reseller/${RESELLER_ID}`, payload)
  return res.data
}

export async function getServiceChangeData() {
  const res = await client.get(`/reseller/${RESELLER_ID}/serviceChangeData`)
  return res.data
}

export async function getStackUsers() {
  const res = await client.get(`/reseller/${RESELLER_ID}/stackUser`)
  return res.data
}

export async function getStackUser(userId: string) {
  const res = await client.get(`/reseller/${RESELLER_ID}/stackUser/${userId}`)
  return res.data
}

export async function createOrUpdateStackUser(payload: Record<string, unknown>) {
  const res = await client.post(`/reseller/${RESELLER_ID}/susers`, payload)
  return res.data
}

export async function getVirtualNameservers() {
  const res = await client.get(`/reseller/${RESELLER_ID}/virtualNameserver`)
  return res.data
}

export async function setVirtualNameservers(payload: Record<string, unknown>) {
  const res = await client.post(`/reseller/${RESELLER_ID}/virtualNameserver`, payload)
  return res.data
}

export async function sendPasswordReset(email: string) {
  const res = await client.get(`/reseller/${RESELLER_ID}/resetPassword`, { params: { email } })
  return res.data
}
