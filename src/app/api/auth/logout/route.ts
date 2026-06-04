import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { auth } from '@/lib/better-auth'
import db from '@/lib/db'

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  const ip = getClientIP(req)
  const ua = req.headers.get('user-agent') || 'unknown'

  try {
    const user = await getGswsSession(req)
    if (user) {
      db.prepare(`
        INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address, user_agent)
        VALUES (?, 'logout', 'auth', 'session', ?, ?, ?)
      `).run(user.actualUserId, `Logout from ${ip}`, ip, ua)
    }
  } catch {}

  // Sign out from Better Auth (clears BA session cookie)
  const baResponse = await auth.api.signOut({ headers: req.headers, asResponse: true })

  const response = NextResponse.json({ success: true })

  // Clear both old and new session cookies
  response.cookies.delete('gsws_session')
  response.cookies.delete('gsws_ba.session_token')

  // Forward any set-cookie headers from Better Auth
  baResponse?.headers?.forEach((value: string, key: string) => {
    if (key.toLowerCase() === 'set-cookie') {
      response.headers.append('set-cookie', value)
    }
  })

  return response
}
