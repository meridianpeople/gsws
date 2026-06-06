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
    const firewall = fws?.data?.find((f: any) => f.name === `fw-${pid}`) || null
    return NextResponse.json({ firewall })
  } catch {
    return NextResponse.json({ firewall: null })
  }
}
