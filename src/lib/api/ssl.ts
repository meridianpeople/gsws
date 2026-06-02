import client from './client'

export async function getCertificates(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/certificates`)
  return res.data
}

export async function addFreeSSL(packageId: string) {
  const res = await client.post(`/package/${packageId}/web/freeSSL`, {})
  return res.data
}

export async function installExternalSSL(packageId: string, payload: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/web/externalSSL`, payload)
  return res.data
}

export async function getForceHttps(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/forceSSL`)
  return res.data
}

export async function setForceHttps(packageId: string, enabled: boolean) {
  const res = await client.post(`/package/${packageId}/web/forceSSL`, { enabled })
  return res.data
}

export async function removeCertificate(packageId: string, certId: string) {
  const res = await client.post(`/package/${packageId}/web/certificates`, { remove: certId })
  return res.data
}
