import client from './client'
import type { Package } from '@/types'

const RESELLER_ID = process.env.TWENTYI_RESELLER_ID || 'me'

export async function getPackages(): Promise<Package[]> {
  const res = await client.get('/package')
  return res.data
}

export async function getPackage(packageId: string): Promise<Package> {
  const res = await client.get(`/package/${packageId}`)
  return res.data
}

export async function getPackageWeb(packageId: string) {
  const res = await client.get(`/package/${packageId}/web`)
  return res.data
}

export async function getPackageUsage(packageId: string) {
  const res = await client.get(`/package/${packageId}/web/usage`)
  return res.data
}

export async function getPackageLimits(packageId: string) {
  const res = await client.get(`/package/${packageId}/limits`)
  return res.data
}

export async function getPackageTypes() {
  const res = await client.get(`/reseller/${RESELLER_ID}/packageTypes`)
  return res.data
}

export async function addPackage(payload: {
  domain: string
  type: string
  extra?: Record<string, unknown>
}) {
  const res = await client.post(`/reseller/${RESELLER_ID}/addWeb`, payload)
  return res.data
}

export async function deletePackage(packageId: string) {
  const res = await client.post(`/reseller/${RESELLER_ID}/deleteWeb`, {
    id: packageId,
  })
  return res.data
}

export async function setMaintenanceMode(packageId: string, enabled: boolean) {
  const res = await client.post(`/package/${packageId}/web/maintenanceMode`, {
    enabled,
  })
  return res.data
}

export async function getPackageCount() {
  const res = await client.get(`/reseller/${RESELLER_ID}/packageCount`)
  return res.data
}
