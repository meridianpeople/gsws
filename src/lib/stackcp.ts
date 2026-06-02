import client from './api/client'

export async function findStackCPUser(email: string): Promise<string | null> {
  try {
    const res = await client.get('/reseller/*/stackUser')
    const users = res.data || []
    const match = users.find((u: any) => 
      u?.contact?.email?.toLowerCase() === email.toLowerCase()
    )
    if (match?.id) return `stack-user:${match.id}`
    return null
  } catch {
    return null
  }
}

export async function linkStackUserToPackage(packageId: string, stackUserId: string): Promise<boolean> {
  try {
    await client.post(`/package/${packageId}/web/stackUser`, { stackUser: stackUserId })
    return true
  } catch {
    return false
  }
}

export async function getStackUserPackages(stackUserId: string): Promise<any[]> {
  try {
    const id = stackUserId.replace('stack-user:', '')
    const res = await client.get(`/reseller/*/stackUser/${id}`)
    return res.data?.packages || []
  } catch {
    return []
  }
}
