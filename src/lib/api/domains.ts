import client from './client'
import type { Domain, DnsRecord } from '@/types'

const RESELLER_ID = process.env.TWENTYI_RESELLER_ID || 'me'

export async function getDomains(): Promise<Domain[]> {
  const res = await client.get('/domain')
  return res.data
}

export async function getDomain(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}`)
  return res.data
}

export async function registerDomain(payload: {
  name: string
  contact: Record<string, unknown>
  privacyService: boolean
  nameservers?: string[]
}) {
  const res = await client.post(`/reseller/${RESELLER_ID}/addDomain`, payload)
  return res.data
}

export async function transferDomain(payload: {
  name: string
  authCode: string
  useGeigNameservers: boolean
}) {
  const res = await client.post(`/reseller/${RESELLER_ID}/transferDomain`, payload)
  return res.data
}

export async function renewDomain(payload: {
  name: string
  years: number
}) {
  const res = await client.post(`/reseller/${RESELLER_ID}/renewDomain`, payload)
  return res.data
}

export async function searchDomain(prefix: string) {
  const res = await client.get(`/domain-search/${encodeURIComponent(prefix)}`)
  return res.data
}

export async function getDomainPrivacy(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/privacy`)
  return res.data
}

export async function setDomainPrivacy(packageId: string, domainId: string, enabled: boolean) {
  const res = await client.post(`/package/${packageId}/domain/${domainId}/privacy`, { enabled })
  return res.data
}

export async function getDnsRecords(packageId: string, domainId: string): Promise<DnsRecord[]> {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/dns`)
  return res.data
}

export async function updateDnsRecords(packageId: string, domainId: string, records: DnsRecord[]) {
  const res = await client.post(`/package/${packageId}/domain/${domainId}/dns`, { records })
  return res.data
}

export async function getNameservers(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/nameservers`)
  return res.data
}

export async function updateNameservers(packageId: string, domainId: string, nameservers: string[]) {
  const res = await client.post(`/package/${packageId}/domain/${domainId}/nameservers`, { nameservers })
  return res.data
}

export async function getDnssec(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/dnssec`)
  return res.data
}

export async function setDnssec(packageId: string, domainId: string, enabled: boolean) {
  const res = await client.post(`/package/${packageId}/domain/${domainId}/dnssec`, { enabled })
  return res.data
}

export async function getWhois(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/whois`)
  return res.data
}

export async function getEppCode(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/authCode`)
  return res.data
}

export async function getDomainContacts(packageId: string, domainId: string) {
  const res = await client.get(`/package/${packageId}/domain/${domainId}/contacts`)
  return res.data
}

export async function setDomainContacts(packageId: string, domainId: string, contacts: Record<string, unknown>) {
  const res = await client.post(`/package/${packageId}/domain/${domainId}/contacts`, contacts)
  return res.data
}
