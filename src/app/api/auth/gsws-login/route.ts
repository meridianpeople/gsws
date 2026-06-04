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
  const baId = crypto.randomUUID()
  const bcrypt = await import('bcryptjs')
  const hash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 12)
  db.prepare(`
    INSERT INTO "user" (id, name, email, emailVerified, authProvider, wpUserId, gswsUserId, isActive, createdAt, updatedAt)
    VALUES (?, ?, ?, 1, 'wordpress', ?, ?, 1, datetime('now'), datetime('now'))
  `).run(baId, name, email, wpUserId, gswsUserId)
  db.prepare(`
    INSERT INTO "account" (id, accountId, providerId, userId, password, createdAt, updatedAt)
    VALUES (?, ?, 'credential', ?, ?, datetime('now'), datetime('now'))
  `).run(crypto.randomUUID(), email, baId, hash)
  return baId
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

    // --- Path 1: GSWS-native user (bcrypt password in Better Auth account table) ---
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

      // Use Better Auth signInEmail to get a properly signed session
      const signInRes = await auth.api.signInEmail({
        body: { email: normalizedEmail, password },
        headers: req.headers,
        asResponse: true,
      })

      if (!signInRes.ok) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
      }

      const gswsUser = db.prepare('SELECT * FROM gsws_users WHERE id = ?').get(nativeUser.gsws_user_id) as any
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser?.id) as any
      auditLog(gswsUser?.id, `GSWS-native login from ${ip}`, ip, ua)

      const response = NextResponse.json({
        success: true, isNewUser: false, authProvider: 'gsws_native',
        user: { id: gswsUser?.id, email: normalizedEmail, name: gswsUser?.name, role: gswsUser?.role, creditBalance: credits?.balance ?? 0 },
      })
      // Forward BA session cookies
      signInRes.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() === 'set-cookie') response.headers.append('set-cookie', value)
      })
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

    // Ensure BA user exists — set a known temp password for session creation
    const tempPassword = `wp_${wpUserId}_${process.env.BETTER_AUTH_SECRET!.substring(0, 16)}`
    const baUserId = await ensureBaUser(wpAuth.user_email, wpAuth.user_display_name, gswsUser.id, wpUserId)

    if (!baUserId) {
      return NextResponse.json({ error: 'Failed to create auth session' }, { status: 500 })
    }

    // Update the BA account password to tempPassword so signInEmail works
    const bcrypt = await import('bcryptjs')
    const tempHash = await bcrypt.hash(tempPassword, 12)
    db.prepare(`UPDATE "account" SET password = ? WHERE userId = ? AND providerId = 'credential'`).run(tempHash, baUserId)

    // Use Better Auth signInEmail with temp password
    const signInRes = await auth.api.signInEmail({
      body: { email: wpAuth.user_email, password: tempPassword },
      headers: req.headers,
      asResponse: true,
    })

    const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(gswsUser.id) as any
    auditLog(gswsUser.id, `WordPress login from ${ip}${isNewUser ? ' · New' : ''}${creditGranted ? ' · £100 credit' : ''}`, ip, ua)

    const response = NextResponse.json({
      success: true, isNewUser, creditGranted,
      welcomeCredit: creditGranted ? 100.00 : null,
      user: { id: gswsUser.id, email: gswsUser.email, name: gswsUser.name, role: gswsUser.role, creditBalance: credits?.balance ?? 0 },
    })

    if (signInRes?.ok) {
      signInRes.headers.forEach((value: string, key: string) => {
        if (key.toLowerCase() === 'set-cookie') response.headers.append('set-cookie', value)
      })
    }

    return response

  } catch (err: any) {
    console.error('[gsws-login]', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
