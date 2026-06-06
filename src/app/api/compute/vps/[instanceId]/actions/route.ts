import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import { contaboFetch, startInstance, stopInstance, restartInstance } from '@/lib/contabo'

export async function POST(req: NextRequest, { params }: { params: Promise<{ instanceId: string }> }) {
  const { instanceId } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE (id = ? OR provider_instance_id = ?) AND user_id = ? AND resource_type = 'vps'").get(instanceId, instanceId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { action, snapshotId, imageId } = body
  const pid = order.provider_instance_id

  try {
    switch (action) {
      case 'start':
        await startInstance(pid)
        return NextResponse.json({ message: 'VPS started' })

      case 'stop':
        await stopInstance(pid)
        return NextResponse.json({ message: 'VPS stopped' })

      case 'restart':
        await restartInstance(pid)
        return NextResponse.json({ message: 'VPS restarted' })

      case 'snapshot':
        await contaboFetch(`/v1/compute/instances/${pid}/snapshots`, {
          method: 'POST',
          body: JSON.stringify({ name: `snapshot-${Date.now()}` }),
        })
        return NextResponse.json({ message: 'Snapshot created' })

      case 'rollback':
        if (!snapshotId) return NextResponse.json({ error: 'snapshotId required' }, { status: 400 })
        await contaboFetch(`/v1/compute/instances/${pid}/snapshots/${snapshotId}/rollback`, { method: 'POST' })
        return NextResponse.json({ message: 'Rollback initiated' })

      case 'delete_snapshot':
        if (!snapshotId) return NextResponse.json({ error: 'snapshotId required' }, { status: 400 })
        await contaboFetch(`/v1/compute/instances/${pid}/snapshots/${snapshotId}`, { method: 'DELETE' })
        return NextResponse.json({ message: 'Snapshot deleted' })

      case 'reinstall':
        if (!imageId) return NextResponse.json({ error: 'imageId required' }, { status: 400 })
        await contaboFetch(`/v1/compute/instances/${pid}`, {
          method: 'PUT',
          body: JSON.stringify({ imageId, sshKeys: [Number(process.env.CONTABO_SSH_KEY_ID || '384170')], rootPassword: 299673 }),
        })
        db.prepare("UPDATE gsws_compute_orders SET status = 'active', updated_at = datetime('now') WHERE id = ?").run(instanceId)
        return NextResponse.json({ message: 'Reinstall initiated — server will be ready in ~5 minutes' })

      case 'rescue':
        await contaboFetch(`/v1/compute/instances/${pid}/actions/rescue`, { method: 'POST' })
        return NextResponse.json({ message: 'Rescue mode activated — server rebooting into rescue system' })

      case 'shutdown':
        await contaboFetch(`/v1/compute/instances/${pid}/actions/shutdown`, { method: 'POST' })
        return NextResponse.json({ message: 'Graceful shutdown initiated' })

      case 'reset_credentials':
        await contaboFetch(`/v1/compute/instances/${pid}/actions/resetPassword`, { method: 'POST' })
        return NextResponse.json({ message: 'Password reset — check your registered email' })

      case 'cancel':
        await contaboFetch(`/v1/compute/instances/${pid}/cancel`, { method: 'POST' })
        db.prepare("UPDATE gsws_compute_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(instanceId)
        return NextResponse.json({ message: 'VPS cancellation scheduled for end of billing period' })

      case 'upgrade':
        const { productId } = body
        if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })
        await contaboFetch(`/v1/compute/instances/${pid}/upgrade`, {
          method: 'POST',
          body: JSON.stringify({ productId }),
        })
        return NextResponse.json({ message: 'Upgrade initiated' })

      case 'create_firewall':
        let fwId: string | null = null
        try {
          const fw = await contaboFetch('/v1/firewalls', {
            method: 'POST',
            body: JSON.stringify({ name: `fw-${pid}`, description: 'SWS managed firewall', status: 'active' }),
          })
          fwId = fw?.data?.[0]?.firewallId
        } catch (fwErr: any) {
          // 409 = already exists, find it
          if (fwErr.message?.includes('409')) {
            const existing = await contaboFetch('/v1/firewalls')
            const found = existing?.data?.find((f: any) => f.name === `fw-${pid}`)
            fwId = found?.firewallId || null
          } else throw fwErr
        }
        if (fwId) {
          try {
            await contaboFetch(`/v1/firewalls/${fwId}/instances/${pid}`, { method: 'POST' })
          } catch {}
        }
        return NextResponse.json({ message: 'Firewall created and assigned', firewallId: fwId })

      case 'create_dns_zone':
        const { zoneName } = body
        if (!zoneName) return NextResponse.json({ error: 'zoneName required' }, { status: 400 })
        await contaboFetch('/v1/dns/zones', {
          method: 'POST',
          body: JSON.stringify({ name: zoneName }),
        })
        return NextResponse.json({ message: `DNS zone ${zoneName} created` })

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
