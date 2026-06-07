import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import { execSync } from 'child_process'

export async function GET(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { orderId } = await params
  const order = db.prepare(`SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'gpu'`).get(orderId, user.id) as any
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!order.ssh_host) return NextResponse.json({ error: 'SSH not ready' }, { status: 400 })

  try {
    const keyPath = process.env.SWS_SSH_PRIVATE_KEY_PATH || '/home/ovie/.ssh/sws_terminal'
    const cmd = `ssh -i ${keyPath} -o StrictHostKeyChecking=no -o ConnectTimeout=10 -p ${order.ssh_port} root@${order.ssh_host} "ps aux --no-header | head -20; echo '---PROCESSES---'; ls /; echo '---ROOT---'; cat /var/log/syslog 2>/dev/null | tail -50 || journalctl -n 50 --no-pager 2>/dev/null || echo 'No logs available'" 2>&1`
    const output = execSync(cmd, { timeout: 15000 }).toString()
    return NextResponse.json({ logs: output })
  } catch (err: any) {
    return NextResponse.json({ logs: err.stdout?.toString() || err.message || 'Failed to fetch logs' })
  }
}
