import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

async function contaboFetch(path: string, options: RequestInit = {}) {
  const contabo = await import('@/lib/contabo')
  const token = await (contabo as any).getToken()
  const { v4: uuidv4 } = await import('uuid')
  const res = await fetch(`https://api.contabo.com${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'x-request-id': uuidv4(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  const text = await res.text()
  return text ? JSON.parse(text) : {}
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ instanceId: string; snapshotId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { instanceId, snapshotId } = await params

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE provider_instance_id = ? AND user_id = ?').get(instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await contaboFetch(`/v1/compute/instances/${instanceId}/snapshots/${snapshotId}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ instanceId: string; snapshotId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { instanceId, snapshotId } = await params
  const { action } = await req.json()

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE provider_instance_id = ? AND user_id = ?').get(instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (action === 'rollback') {
    try {
      await contaboFetch(`/v1/compute/instances/${instanceId}/snapshots/${snapshotId}/rollback`, { method: 'POST' })
      db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'vps_rollback', 'vps', ?, ?)`).run(
        user.id, instanceId, `Rolled back to snapshot ${snapshotId}`)
      return NextResponse.json({ success: true })
    } catch (err: any) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
