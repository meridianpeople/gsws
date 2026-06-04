/**
 * session.ts — single source of truth for session resolution
 *
 * Layer architecture:
 *   1. Better Auth validates the session cookie and returns a typed session
 *   2. We enrich it with GSWS-specific data (credits, member role, owner scoping)
 *   3. All API routes call getGswsSession() — never raw cookie reads
 *
 * To change session behaviour: edit this file only.
 * To add MFA enforcement: add check here, all routes get it automatically.
 */

import { auth } from './better-auth'
import db from './db'
import { headers } from 'next/headers'
import type { NextRequest } from 'next/server'

export interface GswsSession {
  // Better Auth session
  baSessionId: string
  baUserId: string

  // GSWS user (always the effective owner for data scoping)
  id: number              // effective user_id for DB queries (owner if member)
  actualUserId: number    // real logged-in user id
  email: string
  name: string
  role: string
  authProvider: 'wordpress' | 'gsws_native'

  // Credits (always from gsws_user_credits, single source of truth)
  creditBalance: number

  // Member context (populated if this user is a sub-user)
  isMember: boolean
  memberRole: 'admin' | 'billing' | 'viewer' | null
  ownerEmail: string | null

  // MFA (for future enforcement)
  mfaEnabled: boolean
  mfaVerified: boolean
}

/**
 * Resolve a Better Auth session from a Next.js API route request.
 * Returns null if not authenticated or session invalid/expired.
 */
export async function getGswsSession(req?: NextRequest): Promise<GswsSession | null> {
  try {
    // Better Auth handles cookie parsing, signature verification, expiry
    const baSession = await auth.api.getSession({
      headers: req ? req.headers : await headers(),
    })

    if (!baSession?.session || !baSession?.user) return null

    const baUser = baSession.user as any

    // Look up GSWS user — try by Better Auth gsws_user_id first, fall back to email
    let gswsUser: any = null
    if (baUser.gswsUserId) {
      gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ? AND is_active = 1').get(baUser.gswsUserId)
    }
    if (!gswsUser) {
      gswsUser = db.prepare('SELECT * FROM gsws_users WHERE email = ? AND is_active = 1').get(baUser.email)
    }
    if (!gswsUser) return null

    // Credit balance — always from gsws_user_credits (single source of truth)
    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser.id) as any
    const creditBalance = credits?.balance ?? 0

    // Member scoping — if this user is a sub-user, resolve owner
    const membership = db.prepare(`
      SELECT m.owner_user_id, m.role as member_role,
             o.email as owner_email
      FROM gsws_account_members m
      JOIN gsws_users o ON o.id = m.owner_user_id
      WHERE m.member_user_id = ? AND m.status = 'active'
      LIMIT 1
    `).get(gswsUser.id) as any

    const effectiveUserId = membership ? membership.owner_user_id : gswsUser.id
    const ownerCredits = membership
      ? db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(membership.owner_user_id) as any
      : null

    // MFA status
    const mfaRecord = db.prepare('SELECT id FROM two_factor WHERE user_id = ?').get(baSession.user.id) as any

    return {
      baSessionId: baSession.session.id,
      baUserId: baSession.user.id,

      id: effectiveUserId,
      actualUserId: gswsUser.id,
      email: gswsUser.email,
      name: gswsUser.name || baUser.name,
      role: gswsUser.role,
      authProvider: baUser.authProvider || 'gsws_native',

      creditBalance: membership ? (ownerCredits?.balance ?? 0) : creditBalance,

      isMember: !!membership,
      memberRole: membership?.member_role ?? null,
      ownerEmail: membership?.owner_email ?? null,

      mfaEnabled: !!mfaRecord,
      mfaVerified: (baSession.session as any).twoFactorVerified ?? false,
    }
  } catch (err) {
    console.error('[getGswsSession] error:', err)
    return null
  }
}

/**
 * Permission check — layered, not hardcoded.
 * Reads from gsws_service_catalogue config in future for dynamic permissions.
 */
export const PERMISSIONS = {
  admin:   { canRead: true,  canWrite: true,  canBilling: true,  canManageTeam: true  },
  billing: { canRead: true,  canWrite: false, canBilling: true,  canManageTeam: false },
  viewer:  { canRead: true,  canWrite: false, canBilling: false, canManageTeam: false },
} as const

export function can(
  session: GswsSession,
  permission: keyof typeof PERMISSIONS.admin
): boolean {
  if (!session.isMember) return true
  const role = session.memberRole as keyof typeof PERMISSIONS
  return PERMISSIONS[role]?.[permission] ?? false
}

export function requirePermission(
  session: GswsSession,
  permission: keyof typeof PERMISSIONS.admin
): { error: string; status: number } | null {
  if (can(session, permission)) return null
  const messages: Record<string, string> = {
    canWrite:      'Your role does not have permission to make changes.',
    canBilling:    'Your role does not have permission to access billing.',
    canManageTeam: 'Your role does not have permission to manage team members.',
  }
  return {
    error: (messages[permission] || 'Permission denied.') + ' Contact the account owner.',
    status: 403,
  }
}
