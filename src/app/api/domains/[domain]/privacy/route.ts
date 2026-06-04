import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { getDomainPrivacy, setDomainPrivacy } from '@/lib/api/domains'
import db from '@/lib/db'

async function checkOwnership(req: NextRequest, domain: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  const pkg = db.prepare(`SELECT d.*, p.twentyi_package_id FROM gsws_user_domains d JOIN gsws_user_packages p ON p.id = d.package_id WHERE d.domain_name = ? AND p.user_id = ?`).get(domain, user.id) as any
  if (!pkg) return null
  return { user, pkg }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const auth = await checkOwnership(req, domain)
  if (!auth) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  try {
    const data = await getDomainPrivacy(auth.pkg.twentyi_package_id, auth.pkg.domain_id || domain)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params
  const auth = await checkOwnership(req, domain)
  if (!auth) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { enabled } = await req.json()
  try {
    const data = await setDomainPrivacy(auth.pkg.twentyi_package_id, auth.pkg.domain_id || domain, enabled)
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
