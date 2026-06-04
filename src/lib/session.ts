/**
 * session.ts — single source of truth for session resolution
 *
 * Layer 1: Try Better Auth session (gsws_ba.session_token cookie)
 * Layer 2: Fall back to legacy session (gsws_session cookie) during migration
 * Layer 3: Enrich with GSWS data (credits, member scoping)
 *
 * Once all users are on Better Auth, remove Layer 2.
 */

import { auth } from './better-auth'
import db from './db'
import { headers } from 'next/headers'
import type { NextRequest } from 'next/server'

export interface GswsSession {
  baSessionId: string
  baUserId: string
  id: number
  actualUserId: number
  email: string
  name: string
  role: string
  authProvider: 'wordpress' | 'gsws_native'
  creditBalance: number
  isMember: boolean
  memberRole: 'admin' | 'billing' | 'viewer' | null
  ownerEmail: string | null
  mfaEnabled: boolean
  mfaVerified: boolean
  isSupport: boolean
  isImpersonating: boolean
  impersonatingEmail: string | null
  impersonationToken: string | null
}

function buildSession(gswsUser: any, baSessionId: string, baUserId: string): GswsSession | null {
  if (!gswsUser || !gswsUser.is_active) return null

  // Credit balance — always from gsws_user_credits
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser.id) as any
  const creditBalance = credits?.balance ?? 0

  // Member scoping
  const membership = db.prepare(`
    SELECT m.owner_user_id, m.role as member_role, o.email as owner_email
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
  const mfaRecord = baUserId
    ? db.prepare('SELECT id FROM "twoFactor" WHERE userId = ?').get(baUserId) as any
    : null

  return {
    baSessionId,
    baUserId,
    id: effectiveUserId,
    actualUserId: gswsUser.id,
    email: gswsUser.email,
    name: gswsUser.name,
    role: gswsUser.role,
    authProvider: gswsUser.password_hash ? 'gsws_native' : 'wordpress',
    creditBalance: membership ? (ownerCredits?.balance ?? 0) : creditBalance,
    isMember: !!membership,
    memberRole: membership?.member_role ?? null,
    ownerEmail: membership?.owner_email ?? null,
    mfaEnabled: !!mfaRecord,
    mfaVerified: false,
    isSupport: false,
    isImpersonating: false,
    impersonatingEmail: null,
    impersonationToken: null,
  }
}

export async function getGswsSession(req?: NextRequest): Promise<GswsSession | null> {
  try {
    // Check for impersonation cookie
    let impToken: string | undefined
    if (req) {
      impToken = req.cookies.get('gsws_impersonate')?.value
    } else {
      const h = await headers()
      const cookie = h.get('cookie') || ''
      const match = cookie.match(/gsws_impersonate=([^;]+)/)
      impToken = match?.[1]
    }

    if (impToken) {
      const imp = db.prepare(`
        SELECT i.*, tu.email as target_email, tu.id as target_id,
               su.email as support_email, su.role as support_role
        FROM gsws_impersonation i
        JOIN gsws_users tu ON tu.id = i.target_user_id
        JOIN gsws_users su ON su.id = i.support_user_id
        WHERE i.token = ? AND i.status = 'active' AND i.expires_at > datetime('now')
      `).get(impToken) as any

      if (imp && ['support', 'super_admin'].includes(imp.support_role)) {
        const targetUser = db.prepare('SELECT * FROM gsws_users WHERE id = ? AND is_active = 1').get(imp.target_id) as any
        if (targetUser) {
          const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(targetUser.id) as any
          return {
            baSessionId: 'impersonate',
            baUserId: 'impersonate',
            id: targetUser.id,
            actualUserId: imp.support_user_id,
            email: targetUser.email,
            name: targetUser.name,
            role: targetUser.role,
            authProvider: 'gsws_native',
            creditBalance: credits?.balance ?? 0,
            isMember: false,
            memberRole: null,
            ownerEmail: null,
            mfaEnabled: false,
            mfaVerified: false,
            isSupport: true,
            isImpersonating: true,
            impersonatingEmail: targetUser.email,
            impersonationToken: impToken,
          }
        }
      }
    }
    // Layer 1: Better Auth session
    const baSession = await auth.api.getSession({
      headers: req ? req.headers : await headers(),
    }).catch(() => null)

    if (baSession?.session && baSession?.user) {
      const baUser = baSession.user as any
      let gswsUser: any = null

      if (baUser.gswsUserId) {
        gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ? AND is_active = 1').get(baUser.gswsUserId)
      }
      if (!gswsUser) {
        gswsUser = db.prepare('SELECT * FROM gsws_users WHERE email = ? AND is_active = 1').get(baUser.email)
      }
      if (gswsUser) {
        return buildSession(gswsUser, baSession.session.id, baSession.user.id)
      }
    }

    // Layer 2: Legacy session fallback (gsws_session cookie)
    let legacyToken: string | undefined
    if (req) {
      legacyToken = req.cookies.get('gsws_session')?.value || req.cookies.get('__Secure-gsws_session')?.value
    } else {
      const h = await headers()
      const cookie = h.get('cookie') || ''
      const match = cookie.match(/gsws_session=([^;]+)/)
      legacyToken = match?.[1]
    }

    if (legacyToken) {
      const session = db.prepare(`
        SELECT s.*, u.id as uid, u.email, u.name, u.role, u.password_hash,
               u.wp_user_id, u.is_active
        FROM gsws_sessions s
        JOIN gsws_users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `).get(legacyToken) as any

      if (session && session.is_active) {
        const gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ? AND is_active = 1').get(session.uid) as any
        return buildSession(gswsUser, 'legacy:' + legacyToken.substring(0, 8), 'legacy')
      }
    }

    return null
  } catch (err) {
    console.error('[getGswsSession] error:', err)
    return null
  }
}

export const PERMISSIONS = {
  admin:   { canRead: true,  canWrite: true,  canBilling: true,  canManageTeam: true  },
  billing: { canRead: true,  canWrite: false, canBilling: true,  canManageTeam: false },
  viewer:  { canRead: true,  canWrite: false, canBilling: false, canManageTeam: false },
} as const

export function can(session: GswsSession, permission: keyof typeof PERMISSIONS.admin): boolean {
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
