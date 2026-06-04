import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { checkManagedLock } from '@/lib/managed'
import client from '@/lib/api/client'
import db from '@/lib/db'

async function checkOwnership(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id)
  if (!pkg) return null
  const mLock = checkManagedLock(user.id, 'hosting', id)
  if (mLock) return { __managedError: mLock.error, __managedStatus: mLock.status }
  return user
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  const type = req.nextUrl.searchParams.get('type') || 'error'
  try {
    const res = await client.get(`/package/${id}/web/logs/${type}`)
    return NextResponse.json(res.data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
