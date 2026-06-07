import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { getInstance, destroyInstance, stopInstance, startInstance } from '@/lib/vastai'
import db from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare(`SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'gpu'`).get(params.id, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let instance = null
  if (order.provider_instance_id) {
    try {
      instance = await getInstance(order.provider_instance_id)
    } catch {}
  }

  return NextResponse.json({ order, instance })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare(`SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'gpu'`).get(params.id, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { action } = await req.json()

  try {
    switch (action) {
      case 'start':
        await startInstance(order.provider_instance_id)
        db.prepare("UPDATE gsws_compute_orders SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(order.id)
        break
      case 'stop':
        await stopInstance(order.provider_instance_id)
        db.prepare("UPDATE gsws_compute_orders SET status = 'stopped', updated_at = datetime('now') WHERE id = ?").run(order.id)
        break
      case 'reboot':
        await stopInstance(order.provider_instance_id)
        await new Promise(r => setTimeout(r, 3000))
        await startInstance(order.provider_instance_id)
        break
      case 'destroy':
        await destroyInstance(order.provider_instance_id)
        db.prepare("UPDATE gsws_compute_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(order.id)
        db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'gpu_destroy', 'gpu', ?, ?)`)
          .run(user.id, order.service_key, `GPU instance #${order.provider_instance_id} destroyed`)
        break
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
