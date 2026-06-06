import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { requireWrite } from '@/lib/auth'
import client from '@/lib/api/client'
import db from '@/lib/db'

const VAT_RATE = 0.20
const MSSQL_PRICE_INC_VAT = 14.95
const MSSQL_PRICE_EX_VAT = Math.round((MSSQL_PRICE_INC_VAT / (1 + VAT_RATE)) * 100) / 100

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  try {
    // List all reseller MSSQL slots and find ones assigned to this package
    const res = await client.get('/mssql')
    const all = res.data || []
    const assigned = all.filter((m: any) => String(m.packageId) === String(id) || String(m.packageName) === pkg.domain_name)
    return NextResponse.json({ mssqlDatabases: assigned, hasSlot: assigned.length > 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  const writeCheck = requireWrite(user)
  if (writeCheck) return NextResponse.json({ error: writeCheck.error }, { status: writeCheck.status })

  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) as any
  if (!pkg) return NextResponse.json({ error: 'Access denied' }, { status: 403 })

  if (pkg.package_type !== 'windows') {
    return NextResponse.json({ error: 'MSSQL is only available for Windows hosting packages' }, { status: 400 })
  }

  // Check credit
  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
  const balance = credits?.balance || 0
  if (balance < MSSQL_PRICE_INC_VAT) {
    return NextResponse.json({
      error: `Insufficient credit. MSSQL costs £${MSSQL_PRICE_INC_VAT.toFixed(2)}/year (inc. VAT) but your balance is £${balance.toFixed(2)}.`,
      required: MSSQL_PRICE_INC_VAT,
      balance,
    }, { status: 402 })
  }

  try {
    // Step 1: Order MSSQL slot from 20i
    const RESELLER_ID = process.env.TWENTYI_RESELLER_ID_NUM || '511'
    const orderRes = await client.post(`/reseller/${RESELLER_ID}/addMssql`, {})
    if (!orderRes.data) throw new Error('Failed to order MSSQL from provider')

    // Step 2: Get the new MSSQL ID
    const listRes = await client.get('/mssql')
    const all = listRes.data || []
    // Find unassigned slot (no packageId)
    const unassigned = all.find((m: any) => !m.packageId)
    if (!unassigned) throw new Error('MSSQL slot ordered but could not find unassigned slot')

    // Step 3: Assign to this package
    await client.post(`/mssql/${unassigned.id}/package`, { packageId: Number(id) })

    // Step 4: Deduct credit
    const newBalance = Math.round((balance - MSSQL_PRICE_INC_VAT) * 100) / 100
    db.prepare('INSERT OR REPLACE INTO gsws_user_credits (user_id, balance) VALUES (?, ?)').run(user.id, newBalance)
    db.prepare(`
      INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
      VALUES (?, ?, 'mssql', ?, ?, ?)
    `).run(user.id, -MSSQL_PRICE_INC_VAT, `MSSQL Database - annual (ex VAT £${MSSQL_PRICE_EX_VAT.toFixed(2)} + VAT £${(MSSQL_PRICE_INC_VAT - MSSQL_PRICE_EX_VAT).toFixed(2)})`, pkg.domain_name, newBalance)

    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'mssql_order', 'database', ?, ?)`
    ).run(user.id, pkg.domain_name, `MSSQL database ordered and assigned to ${pkg.domain_name}, charged £${MSSQL_PRICE_INC_VAT.toFixed(2)}`)

    // Notification
    db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'MSSQL Database Provisioned', ?)`
    ).run(user.id, `Your MSSQL database has been provisioned for ${pkg.domain_name}. £${MSSQL_PRICE_INC_VAT.toFixed(2)} charged from your credit balance.`)

    return NextResponse.json({ success: true, mssqlId: unassigned.id, newBalance, charged: MSSQL_PRICE_INC_VAT })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
