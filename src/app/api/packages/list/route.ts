import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const packages = db.prepare(`
    SELECT twentyi_package_id as id, domain_name as name, package_type as type,
           package_label as label, status, created_at
    FROM gsws_user_packages
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(user.id) as any[]

  return NextResponse.json({ packages })
}
