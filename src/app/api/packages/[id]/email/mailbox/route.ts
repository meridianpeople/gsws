import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { checkManagedLock } from '@/lib/managed'
import { chargeEmailAddon } from '@/lib/email-billing'
import { requireWrite } from '@/lib/auth'
import db from '@/lib/db'
import client from '@/lib/api/client'

async function checkOwnership(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  return db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })
  const domain = req.nextUrl.searchParams.get('domain') || ''
  try {
    const res = await client.get(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox`)
    return NextResponse.json({ mailboxes: res.data?.mailbox || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  try {
    const { domain, local, password, quotaMB } = await req.json()
    if (!domain || !local || !password) return NextResponse.json({ error: 'Domain, username and password required' }, { status: 400 })
    const res = await client.post(`/package/${id}/email/${encodeURIComponent(domain)}`, {
      new: {
        mailbox: {
          local,
          password,
          quotaMB: quotaMB || 1000,
          receive: true,
          send: true,
          enabled: true,
        }
      }
    })
    const created = res.data?.result?.result?.[0]
    if (!created) return NextResponse.json({ error: 'Mailbox not created' }, { status: 500 })

    // Charge for extra mailboxes beyond free allowance
    const billing = chargeEmailAddon(user.id, id, domain, local, 'mailbox')

    return NextResponse.json({
      success: true,
      id: created.generatedId || created.id,
      billing: { charged: billing.charged, amount: billing.amount, reason: billing.reason }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  try {
    const { domain, local } = await req.json()
    await client.delete(`/package/${id}/email/${encodeURIComponent(domain)}/mailbox/${encodeURIComponent(local)}`)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
