import { NextRequest, NextResponse } from 'next/server'
import { deleteSession, validateSession } from '@/lib/auth'
import db from '@/lib/db'

function getClientIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') || 'unknown'
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const ip = getClientIP(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'

  if (token) {
    const user = validateSession(token)
    if (user) {
      db.prepare(`
        INSERT INTO gsws_audit_log (user_id, session_token, action, resource_type, resource_name, detail, ip_address, user_agent)
        VALUES (?, ?, 'logout', 'auth', 'session', ?, ?, ?)
      `).run(user.id, token.substring(0, 16) + '...', `Logout from ${ip}`, ip, userAgent)
    }
    deleteSession(token)
  }

  const response = NextResponse.json({ success: true })
  response.cookies.delete('gsws_session')
  return response
}
