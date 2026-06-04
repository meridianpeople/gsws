import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const domains = db.prepare(`
    SELECT domain_name as name, twentyi_package_id, registered_at
    FROM gsws_user_domains
    WHERE user_id = ?
    ORDER BY registered_at DESC
  `).all(user.id) as any[]

  return NextResponse.json({ domains })
}
