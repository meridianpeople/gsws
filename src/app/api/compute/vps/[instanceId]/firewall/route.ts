import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import { contaboFetch } from '@/lib/contabo'

export async function GET(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const { instanceId } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ? AND resource_type = 'vps'").get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const pid = order.provider_instance_id
    const fws = await contaboFetch('/v1/firewalls')
    // Find by stored firewall_id, or by instance membership, or by legacy name
    const firewall = fws?.data?.find((f: any) =>
      (order.firewall_id && f.firewallId === order.firewall_id) ||
      f.instances?.some((i: any) => String(i.instanceId) === String(pid)) ||
      f.name === `fw-${pid}`
    ) || null
    // Store firewallId if found and not yet stored
    if (firewall && !order.firewall_id) {
      db.prepare("UPDATE gsws_compute_orders SET firewall_id = ? WHERE id = ?").run(firewall.firewallId, order.id)
    }
    return NextResponse.json({ firewall })
  } catch {
    return NextResponse.json({ firewall: null })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const { instanceId } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ? AND resource_type = 'vps'").get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { firewallId, rules } = await req.json()
    const data = await contaboFetch(`/v1/firewalls/${firewallId}`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    })
    return NextResponse.json({ success: true, firewall: data?.data?.[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const { instanceId } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ? AND resource_type = 'vps'").get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const { firewallId, name } = await req.json()
    const data = await contaboFetch(`/v1/firewalls/${firewallId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    })
    return NextResponse.json({ success: true, firewall: data?.data?.[0] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
