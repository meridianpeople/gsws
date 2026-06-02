import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token || !validateSession(token)) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  const types = [
    { id: 4440, label: 'WordPress Unlimited', category: 'wordpress', mailboxes: 'Unlimited', description: 'Optimised WordPress · Staging · Auto-updates · Unlimited mailboxes' },
    { id: 4438, label: 'Linux Unlimited', category: 'linux', mailboxes: 'Unlimited', description: 'PHP · MySQL · FTP · Unlimited mailboxes' },
    { id: 4439, label: 'Windows Unlimited', category: 'windows', mailboxes: 'Unlimited', description: 'IIS · ASP.NET · MSSQL · Unlimited mailboxes' },
  ]
  return NextResponse.json({ types })
}
