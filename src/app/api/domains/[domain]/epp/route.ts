import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { getEppCode } from '@/lib/api/domains'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const pkg = db.prepare(`SELECT d.*, p.twentyi_package_id FROM gsws_user_domains d JOIN gsws_user_packages p ON p.id = d.package_id WHERE d.domain_name = ? AND p.user_id = ?`).get(domain, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const data = await getEppCode(pkg.twentyi_package_id, pkg.domain_id || domain)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
