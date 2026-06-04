/**
 * Contabo VPS API client
 */
import { v4 as uuidv4 } from 'uuid'

const AUTH_URL = 'https://auth.contabo.com/auth/realms/contabo/protocol/openid-connect/token'
const API_URL = 'https://api.contabo.com'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30000) {
    return cachedToken.token
  }

  const params = new URLSearchParams({
    client_id: process.env.CONTABO_CLIENT_ID!,
    client_secret: process.env.CONTABO_CLIENT_SECRET!,
    username: process.env.CONTABO_API_USER!,
    password: process.env.CONTABO_API_PASSWORD!,
    grant_type: 'password',
  })

  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  })

  const data = await res.json()
  if (!data.access_token) throw new Error('Contabo auth failed: ' + JSON.stringify(data))

  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 }
  return cachedToken.token
}

async function contaboFetch(path: string, options: RequestInit = {}) {
  const token = await getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-request-id': uuidv4(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Contabo API error ${res.status}: ${err}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export async function listInstances() {
  const data = await contaboFetch('/v1/compute/instances?size=100')
  return data.data || []
}

export async function getInstance(instanceId: string) {
  const data = await contaboFetch(`/v1/compute/instances/${instanceId}`)
  return data.data?.[0] || null
}

export async function createInstance(options: {
  productId: string
  region: string
  imageId: string
  displayName: string
  period: number
  rootPassword?: number
  sshKeys?: number[]
  userData?: string
  defaultUser?: string
  addOns?: Record<string, any>
  license?: string
}) {
  return await contaboFetch('/v1/compute/instances', {
    method: 'POST',
    body: JSON.stringify(options),
  })
}

export async function startInstance(instanceId: string) {
  return await contaboFetch(`/v1/compute/instances/${instanceId}/actions/start`, { method: 'POST' })
}

export async function stopInstance(instanceId: string) {
  return await contaboFetch(`/v1/compute/instances/${instanceId}/actions/stop`, { method: 'POST' })
}

export async function restartInstance(instanceId: string) {
  return await contaboFetch(`/v1/compute/instances/${instanceId}/actions/restart`, { method: 'POST' })
}

export async function cancelInstance(instanceId: string) {
  return await contaboFetch(`/v1/compute/instances/${instanceId}/cancel`, { method: 'POST' })
}

export async function listImages() {
  const data = await contaboFetch('/v1/compute/images?size=100')
  return data.data || []
}

export async function listDataCenters() {
  const data = await contaboFetch('/v1/data-centers')
  return data.data || []
}

export async function resetPassword(instanceId: string, secretId: number) {
  return await contaboFetch(`/v1/compute/instances/${instanceId}/actions/resetPassword`, {
    method: 'POST',
    body: JSON.stringify({ rootPassword: secretId }),
  })
}

export async function listSecrets() {
  const data = await contaboFetch('/v1/secrets')
  return data.data || []
}

export async function createSecret(name: string, value: string, type: 'ssh' | 'password' = 'password') {
  return await contaboFetch('/v1/secrets', {
    method: 'POST',
    body: JSON.stringify({ name, value, type }),
  })
}
