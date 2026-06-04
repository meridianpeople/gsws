import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function POST(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const { instanceId } = await params

  const order = db.prepare('SELECT * FROM gsws_compute_orders WHERE provider_instance_id = ? AND user_id = ?').get(instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  try {
    const contabo = await import('@/lib/contabo')
    const { v4: uuidv4 } = await import('uuid')
    const token = await (contabo as any).getToken()
    const res = await fetch(`https://api.contabo.com/v1/compute/instances/${instanceId}/actions/rescue`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'x-request-id': uuidv4() },
    })
    const data = await res.json()
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'vps_rescue', 'vps', ?, ?)`).run(
      user.id, instanceId, 'VPS rescue mode activated')
    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
