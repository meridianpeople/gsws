import db from './db'
import crypto from 'crypto'

const TALIUSAPI_URL = process.env.TALIUSAPI_URL || 'https://taliusapi.geig.co.uk'
const SESSION_DAYS = 7
const FIRST_LOGIN_CREDIT = 100.00
const ELIGIBLE_ROLES = ['geig_hardware_customer', 'administrator']

export interface GswsUser {
  id: number
  wp_user_id: number
  email: string
  name: string
  first_name: string
  last_name: string
  avatar_url: string
  role: string
  credit_balance: number
  is_active: number
  stackcp_user_id: string | null
}

export interface SessionUser {
  id: number
  wp_user_id: number
  email: string
  name: string
  role: string
  credit_balance: number
}

export async function authenticateWithWordPress(
  username: string,
  password: string
): Promise<{ token: string; user_email: string; user_nicename: string; user_display_name: string } | null> {
  try {
    const res = await fetch(`${TALIUSAPI_URL}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.token) return null
    return data
  } catch {
    return null
  }
}

// Fetch WP user roles via WP REST API using application password or admin key
async function getWordPressUserRoles(wpUserId: number): Promise<string[]> {
  try {
    // Use the JWT secret to make an internal WP API call
    const res = await fetch(`${TALIUSAPI_URL}/wp-json/wp/v2/users/${wpUserId}?context=edit`, {
      headers: {
        // Use basic auth with admin credentials for internal lookup
        'Authorization': 'Basic ' + Buffer.from(`sws_internal:${process.env.WP_INTERNAL_KEY || ''}`).toString('base64'),
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.roles || []
  } catch {
    return []
  }
}

export function upsertGswsUser(wpData: {
  user_id: number
  email: string
  display_name: string
  nicename: string
  roles?: string[]
}): { user: GswsUser; isNewUser: boolean; creditGranted: boolean } {
  const existing = db.prepare(
    'SELECT * FROM gsws_users WHERE wp_user_id = ?'
  ).get(wpData.user_id) as GswsUser | undefined

  if (existing) {
    db.prepare(`
      UPDATE gsws_users
      SET email = ?, name = ?, updated_at = datetime('now')
      WHERE wp_user_id = ?
    `).run(wpData.email, wpData.display_name, wpData.user_id)
    return {
      user: db.prepare('SELECT * FROM gsws_users WHERE wp_user_id = ?').get(wpData.user_id) as GswsUser,
      isNewUser: false,
      creditGranted: false,
    }
  }

  // New user — check if eligible for £100 credit
  const roles = wpData.roles || []
  const isEligible = roles.some(r => ELIGIBLE_ROLES.includes(r))
  const creditAmount = isEligible ? FIRST_LOGIN_CREDIT : 0

  db.prepare(`
    INSERT INTO gsws_users (wp_user_id, email, name, first_name, last_name, avatar_url, role, credit_balance)
    VALUES (?, ?, ?, ?, '', '', 'user', ?)
  `).run(wpData.user_id, wpData.email, wpData.display_name, wpData.nicename, creditAmount)

  const newUser = db.prepare('SELECT * FROM gsws_users WHERE wp_user_id = ?').get(wpData.user_id) as GswsUser

  if (isEligible && creditAmount > 0) {
    db.prepare(`
      INSERT INTO gsws_topup_history (user_id, amount, currency, reference, status)
      VALUES (?, ?, 'GBP', 'WELCOME_CREDIT', 'completed')
    `).run(newUser.id, creditAmount)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
      VALUES (?, 'credit_grant', 'account', 'welcome_credit', ?)
    `).run(newUser.id, `£${creditAmount} welcome credit granted (role: ${roles.join(', ')})`)
  }

  return { user: newUser, isNewUser: true, creditGranted: isEligible }
}

export function createSession(userId: number): string {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)
  db.prepare(`
    INSERT INTO gsws_sessions (user_id, token, expires_at)
    VALUES (?, ?, ?)
  `).run(userId, token, expiresAt.toISOString())
  return token
}

export function validateSession(token: string): SessionUser | null {
  if (!token) return null
  const session = db.prepare(`
    SELECT s.*, u.id as uid, u.email, u.name, u.role, u.credit_balance, u.wp_user_id, u.is_active
    FROM gsws_sessions s
    JOIN gsws_users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token) as any
  if (!session || !session.is_active) return null

  // If this user is a member of another account, resolve the owner ID
  // so all data queries (packages, domains, credits) use the owner's data
  const membership = db.prepare(`
    SELECT m.owner_user_id, m.role as member_role, o.email as owner_email, o.name as owner_name
    FROM gsws_account_members m
    JOIN gsws_users o ON o.id = m.owner_user_id
    WHERE m.member_user_id = ? AND m.status = 'active'
    LIMIT 1
  `).get(session.uid) as any

  if (membership) {
    // Member user — resolve owner's ID for data access
    const ownerCredits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(membership.owner_user_id) as any
    return {
      id: membership.owner_user_id,          // data scoped to owner
      actualUserId: session.uid,             // real logged-in user (for audit)
      wp_user_id: session.wp_user_id,
      email: session.email,
      name: session.name,
      role: session.role,
      memberRole: membership.member_role,    // admin / billing / viewer
      isMember: true,
      ownerEmail: membership.owner_email,
      credit_balance: ownerCredits?.balance ?? 0,
    } as any
  }

  return {
    id: session.uid,
    actualUserId: session.uid,
    wp_user_id: session.wp_user_id,
    email: session.email,
    name: session.name,
    role: session.role,
    isMember: false,
    credit_balance: session.credit_balance,
  } as any
}

export function deleteSession(token: string): void {
  db.prepare('DELETE FROM gsws_sessions WHERE token = ?').run(token)
}

export function cleanExpiredSessions(): void {
  db.prepare("DELETE FROM gsws_sessions WHERE expires_at < datetime('now')").run()
}

// Role permissions — what each member role can do
export const ROLE_PERMISSIONS = {
  admin:   { canRead: true,  canWrite: true,  canBilling: true,  canManageTeam: true  },
  billing: { canRead: true,  canWrite: false, canBilling: true,  canManageTeam: false },
  viewer:  { canRead: true,  canWrite: false, canBilling: false, canManageTeam: false },
}

export function checkPermission(
  user: any,
  permission: 'canRead' | 'canWrite' | 'canBilling' | 'canManageTeam'
): boolean {
  // Non-members (account owners) have full access
  if (!user?.isMember) return true
  const role = user.memberRole as keyof typeof ROLE_PERMISSIONS
  return ROLE_PERMISSIONS[role]?.[permission] ?? false
}

export function requireWrite(user: any) {
  if (!checkPermission(user, 'canWrite')) {
    return { error: 'Your role does not have permission to make changes. Contact the account owner.', status: 403 }
  }
  return null
}

export function requireBilling(user: any) {
  if (!checkPermission(user, 'canBilling')) {
    return { error: 'Your role does not have permission to access billing. Contact the account owner.', status: 403 }
  }
  return null
}
