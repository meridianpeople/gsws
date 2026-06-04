import { NextRequest, NextResponse } from 'next/server'

/**
 * Middleware — Edge-compatible, lightweight
 *
 * Layer 1: Public paths bypass auth
 * Layer 2: Check session cookie exists (signature verified by API routes)
 * Layer 3: Full session validation happens in getGswsSession() per route
 *
 * Better Auth session validation cannot run in Edge (uses better-sqlite3).
 * Full validation is done in each API route via getGswsSession().
 * Middleware only gates access — prevents unauthenticated page loads.
 */

const PUBLIC_PATHS = [
  '/login',
  '/register', 
  '/forgot-password',
  '/invite',
  '/api/auth',
  '/api/cron',
  '/api/account/topup/stripe-webhook',
  '/api/admin/approve',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Layer 1 — public paths pass through
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) {
    // Redirect already-authenticated users away from login
    if (pathname === '/login') {
      const hasSession = req.cookies.get('gsws_ba.session_token')?.value
        || req.cookies.get('gsws_session')?.value
      if (hasSession) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }
    return NextResponse.next()
  }

  // Layer 2 — require a session cookie to exist
  // Full cryptographic validation happens in getGswsSession() per route
  const baSession = req.cookies.get('__Secure-gsws_ba.session_token')?.value || req.cookies.get('gsws_ba.session_token')?.value
  const legacySession = req.cookies.get('gsws_session')?.value

  if (!baSession && !legacySession) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Layer 3 — forward session tokens to route handlers via headers
  const response = NextResponse.next()
  if (legacySession) {
    response.headers.set('x-gsws-session', legacySession)
  }
  if (baSession) {
    response.headers.set('x-gsws-ba-session', baSession)
  }
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
