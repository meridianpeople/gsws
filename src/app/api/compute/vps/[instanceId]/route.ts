import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { getInstance, startInstance, stopInstance, restartInstance, cancelInstance, contaboFetch } from '@/lib/contabo'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { instanceId } = await params
  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ?').get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const instance = await getInstance(order.provider_instance_id)
    // Fetch VNC info
    let vnc = null
    try {
      const vncData = await contaboFetch(`/v1/compute/instances/${order.provider_instance_id}/vnc`)
      vnc = vncData?.data?.[0] || null
    } catch {}
    return NextResponse.json({ instance: { ...instance, vncIp: vnc?.vncIp, vncPort: vnc?.vncPort, vncEnabled: vnc?.enabled }, order })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { instanceId } = await params
  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ?').get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { action } = await req.json()

  try {
    switch (action) {
      case 'start':   await startInstance(instanceId); break
      case 'stop':    await stopInstance(instanceId); break
      case 'restart': await restartInstance(instanceId); break
      default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, 'vps', ?, ?)`).run(
      user.id, `vps_${action}`, instanceId, `VPS ${action} by user`
    )
    return NextResponse.json({ success: true, action })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { instanceId } = await params
  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ?').get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    await cancelInstance(instanceId)
    db.prepare(`UPDATE gsws_compute_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(order.id)
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'vps_cancel', 'vps', ?, ?)`).run(
      user.id, instanceId, 'VPS cancelled by user')
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { instanceId } = await params
  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ?').get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { displayName } = await req.json()
  try {
    await contaboFetch(`/v1/compute/instances/${instanceId}`, {
      method: 'PATCH',
      body: JSON.stringify({ displayName }),
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
