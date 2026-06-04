import { NextRequest, NextResponse } from 'next/server'
import { authenticateWithWordPress, upsertGswsUser, createSession } from '@/lib/auth'
import { findStackCPUser } from '@/lib/stackcp'
import db from '@/lib/db'

const TALIUSAPI_URL = process.env.TALIUSAPI_URL || 'https://taliusapi.geig.co.uk'
const GSWS_BRIDGE_SECRET = process.env.GSWS_BRIDGE_SECRET || 'gsws2026BridgeKey!'

async function getWpUserRoles(wpUserId: number): Promise<string[]> {
  try {
    const res = await fetch(`${TALIUSAPI_URL}/wp-json/gsws/v1/user-role/${wpUserId}`, {
      headers: { 'X-GSWS-Secret': GSWS_BRIDGE_SECRET },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.roles || []
  } catch {
    return []
  }
}

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'

  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const wpAuth = await authenticateWithWordPress(email, password)
    if (!wpAuth) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    let wpUserId: number
    try {
      const payload = JSON.parse(
        Buffer.from(wpAuth.token.split('.')[1], 'base64').toString('utf8')
      )
      wpUserId = payload.data?.user?.id || payload.user_id || payload.sub
    } catch {
      return NextResponse.json({ error: 'Could not parse user token' }, { status: 500 })
    }

    if (!wpUserId) {
      return NextResponse.json({ error: 'Could not determine user identity' }, { status: 500 })
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

    // Look up StackCP user by email and store if not already stored
    if (!gswsUser.stackcp_user_id) {
      const stackCPId = await findStackCPUser(wpAuth.user_email)
      if (stackCPId) {
        db.prepare('UPDATE gsws_users SET stackcp_user_id = ? WHERE id = ?')
          .run(stackCPId, gswsUser.id)
      }
    }

    const sessionToken = createSession(gswsUser.id)

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, session_token, action, resource_type, resource_name, detail, ip_address, user_agent)
      VALUES (?, ?, 'login', 'auth', 'session', ?, ?, ?)
    `).run(
      gswsUser.id,
      sessionToken.substring(0, 16) + '...',
      `Login from ${ip}${isNewUser ? ' · New account' : ''}${creditGranted ? ' · £100 credit granted' : ''}`,
      ip,
      userAgent
    )

    const response = NextResponse.json({
      success: true,
      isNewUser,
      creditGranted,
      welcomeCredit: creditGranted ? 100.00 : null,
      user: {
        id: gswsUser.id,
        email: gswsUser.email,
        name: gswsUser.name,
        role: gswsUser.role,
        creditBalance: gswsUser.creditBalance ?? 0,
      },
    })

    response.cookies.set('gsws_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (err: any) {
    console.error('Login error:', err)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
