/**
 * managed.ts — Managed service lock enforcement
 * 
 * Call checkManagedLock() in any write route to block changes on managed resources.
 * Read operations are always allowed.
 */
import db from './db'

export interface ManagedService {
  id: number
  resource_type: string
  resource_id: string
  resource_name: string
  status: string
  renews_at: string
}

export function getManagedService(userId: number, resourceType: string, resourceId: string): ManagedService | null {
  return db.prepare(`
    SELECT * FROM gsws_managed_services
    WHERE user_id = ? AND resource_type = ? AND resource_id = ? AND status IN ('active', 'cancelling')
  `).get(userId, resourceType, resourceId) as ManagedService | null
}

export function checkManagedLock(
  userId: number,
  resourceType: string,
  resourceId: string
): { error: string; status: number } | null {
  const managed = getManagedService(userId, resourceType, resourceId)
  if (!managed) return null
  return {
    error: 'This is a managed service — all changes are handled by our support team. Please use the support chat to request changes.',
    status: 403,
  }
}

/**
 * requireNotManaged — use in direct-auth write routes
 * Pass the packageId from the URL params
 */
export function requireNotManaged(
  userId: number,
  packageId: string
): { error: string; status: number } | null {
  return checkManagedLock(userId, 'hosting', packageId)
}
