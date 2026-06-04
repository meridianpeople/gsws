import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  const invoices = db.prepare(`
    SELECT * FROM gsws_credit_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, limit, offset) as any[]

  const total = (db.prepare('SELECT COUNT(*) as count FROM gsws_credit_transactions WHERE user_id = ?').get(user.id) as any)?.count || 0

  return NextResponse.json({ invoices, total, page, limit })
}
