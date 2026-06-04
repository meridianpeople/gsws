import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/better-auth'
import db from '@/lib/db'
import { upsertGswsUser, authenticateWithWordPress } from '@/lib/auth'
import crypto from 'crypto'

const TALIUSAPI_URL = process.env.TALIUSAPI_URL || 'https://taliusapi.geig.co.uk'
const GSWS_BRIDGE_SECRET = process.env.GSWS_BRIDGE_SECRET || ''

async function getWpUserRoles(wpUserId: number): Promise<string[]> {
  try {
    const res = await fetch(`${TALIUSAPI_URL}/wp-json/gsws/v1/user-role/${wpUserId}`, {
      headers: { 'X-GSWS-Secret': GSWS_BRIDGE_SECRET },
    })
    if (!res.ok) return []
    return (await res.json()).roles || []
  } catch { return [] }
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown'
}

function auditLog(userId: number, detail: string, ip: string, ua: string) {
  try {
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address, user_agent)
      VALUES (?, 'login', 'auth', 'session', ?, ?, ?)
    `).run(userId, detail, ip, ua)
  } catch {}
}

async function ensureBaUser(email: string, name: string, gswsUserId: number, wpUserId: number): Promise<string | null> {
  const existing = db.prepare('SELECT id FROM "user" WHERE email = ?').get(email) as any
  if (existing) {
    db.prepare('UPDATE "user" SET gswsUserId = ?, wpUserId = ?, authProvider = ?, isActive = 1 WHERE id = ?')
      .run(gswsUserId, wpUserId, 'wordpress', existing.id)
    return existing.id
  }
  // Create BA user with random password (WP users authenticate via WP, not BA password)
  const baId = crypto.randomUUID()
  const randomPwd = crypto.randomBytes(32).toString('hex')
  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(randomPwd, 12)
  db.prepare(`
    INSERT INTO "user" (id, name, email, emailVerified, authProvider, wpUserId, gswsUserId, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, 'wordpress', ?, ?, 1, datetime('now'), datetime('now'))
  `).run(baId, name, email, wpUserId, gswsUserId)
  db.prepare(`
    INSERT INTO "account" (id, account_id, provider_id, user_id, password, created_at, updated_at)
    VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))
  `).run(crypto.randomUUID(), email, baId, hash)
  return baId
}

async function createBaSession(baUserId: string, req: NextRequest): Promise<string | null> {
  try {
    const ctx = await (auth as any).$context
    // Use the internal adapter with correct signature for this BA version
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    db.prepare(`
      INSERT INTO "session" (id, userId, token, expiresAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(crypto.randomUUID(), baUserId, token, expiresAt)
    return token
  } catch (e: any) {
    console.error('[createBaSession]', e.message)
    return null
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const ua = req.headers.get('user-agent') || 'unknown'

  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    const normalizedEmail = email.toLowerCase().trim()

    // --- Path 1: GSWS-native user (invited sub-user with bcrypt password) ---
    const nativeUser = db.prepare(`
      SELECT u.id as ba_id, u.gswsUserId as gsws_user_id, u.isActive as is_active, a.password as hash
      FROM "user" u
      JOIN "account" a ON a.userId = u.id AND a.providerId = 'credential'
      WHERE u.email = ? AND u.authProvider = 'gsws_native'
    `).get(normalizedEmail) as any

    if (nativeUser) {
      if (!nativeUser.is_active) {
        return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })
      }
      const bcrypt = await import('bcryptjs')
      const valid = await bcrypt.compare(password, nativeUser.hash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }
      const gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ?').get(nativeUser.gsws_user_id) as any
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser?.id) as any
      const sessionToken = await createBaSession(nativeUser.ba_id, req)
      auditLog(gswsUser?.id, `GSWS-native login from ${ip}`, ip, ua)
      const response = NextResponse.json({
        success: true, isNewUser: false,
        user: { id: gswsUser?.id, email: normalizedEmail, name: gswsUser?.name, role: gswsUser?.role, credit_balance: credits?.balance ?? 0 },
      })
      if (sessionToken) {
        response.cookies.set('gsws_ba.session_token', sessionToken, {
          httpOnly: true, secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
        })
      }
      return response
    }

    // --- Path 2: WordPress user ---
    const wpAuth = await authenticateWithWordPress(normalizedEmail, password)
    if (!wpAuth) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let wpUserId: number
    try {
      const payload = JSON.parse(Buffer.from(wpAuth.token.split('.')[1], 'base64').toString('utf8'))
      wpUserId = payload.data?.user?.id || payload.user_id || payload.sub
    } catch {
      return NextResponse.json({ error: 'Could not parse user token' }, { status: 500 })
    }

    const roles = await getWpUserRoles(wpUserId)
    const { user: gswsUser, isNewUser, creditGranted } = upsertGswsUser({
      user_id: wpUserId,
      email: wpAuth.user_email,
      display_name: wpAuth.user_display_name,
      nicename: wpAuth.user_nicename,
      roles,
    })

    if (!gswsUser.is_active) {
      return NextResponse.json({ error: 'Your account has been suspended.' }, { status: 403 })
    }

    const baUserId = await ensureBaUser(wpAuth.user_email, wpAuth.user_display_name, gswsUser.id, wpUserId)
    if (!baUserId) {
      return NextResponse.json({ error: 'Failed to create auth session' }, { status: 500 })
    }

    const sessionToken = await createBaSession(baUserId, req)
    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser.id) as any
    auditLog(gswsUser.id, `WordPress login from ${ip}${isNewUser ? ' · New' : ''}${creditGranted ? ' · £100 credit' : ''}`, ip, ua)

    const response = NextResponse.json({
      success: true, isNewUser, creditGranted,
      welcomeCredit: creditGranted ? 100.00 : null,
      user: { id: gswsUser.id, email: gswsUser.email, name: gswsUser.name, role: gswsUser.role, credit_balance: credits?.balance ?? gswsUser.credit_balance },
    })

    if (sessionToken) {
      response.cookies.set('gsws_ba.session_token', sessionToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/',
      })
    }

    return response

  } catch (err: any) {
    console.error('[gsws-login]', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
