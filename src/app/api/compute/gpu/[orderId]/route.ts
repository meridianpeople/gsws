import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { getInstance, startInstance, stopInstance, destroyInstance } from '@/lib/vastai'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { orderId } = await params

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ?').get(orderId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let instance = null
  if (order.provider_instance_id) {
    try { instance = await getInstance(order.provider_instance_id) } catch {}
  }

  return NextResponse.json({ order, instance })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { orderId } = await params
  const { action } = await req.json()

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ?').get(orderId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!order.provider_instance_id) return NextResponse.json({ error: 'No instance assigned yet' }, { status: 400 })

  try {
    switch (action) {
      case 'start':   await startInstance(order.provider_instance_id); break
      case 'stop':    await stopInstance(order.provider_instance_id); break
      default: return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, 'gpu', ?, ?)`).run(
      user.id, `gpu_${action}`, orderId, `GPU instance ${action}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { orderId } = await params

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ?').get(orderId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (order.status === 'cancelled') return NextResponse.json({ error: 'Already cancelled' }, { status: 400 })

  if (order.provider_instance_id) {
    try { await destroyInstance(order.provider_instance_id) } catch {}
  }

  db.prepare(`UPDATE gsws_compute_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?`).run(orderId)
  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, 'gpu', ?, ?)`).run(
    user.id, 'gpu_cancel', orderId, `GPU order #${orderId} cancelled`)

  return NextResponse.json({ success: true })
}
