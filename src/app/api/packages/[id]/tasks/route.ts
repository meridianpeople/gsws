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
  try {
    const res = await client.get(`/package/${id}/web/tasks`)
    return NextResponse.json(res.data || [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  const body = await req.json()
  try {
    const res = await client.post(`/package/${id}/web/tasks`, body)
    return NextResponse.json(res.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  const { taskId } = await req.json()
  try {
    const res = await client.delete(`/package/${id}/web/tasks/${taskId}`)
    return NextResponse.json(res.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  const { taskId, ...body } = await req.json()
  try {
    const res = await client.put(`/package/${id}/web/tasks/${taskId}`, body)
    return NextResponse.json(res.data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
