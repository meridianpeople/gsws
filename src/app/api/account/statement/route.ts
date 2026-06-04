import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit
  const type = req.nextUrl.searchParams.get('type') || ''

  const whereType = type ? `AND type = '${type}'` : ''

  const transactions = db.prepare(`
    SELECT * FROM gsws_credit_transactions
    WHERE user_id = ? ${whereType}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(user.id, limit, offset) as any[]

  const total = (db.prepare(`
    SELECT COUNT(*) as count FROM gsws_credit_transactions WHERE user_id = ? ${whereType}
  `).get(user.id) as any)?.count || 0

  const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any

  // Summary stats
  const stats = db.prepare(`
    SELECT 
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_credited,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as total_spent,
      COUNT(CASE WHEN type = 'topup' THEN 1 END) as topup_count,
      COUNT(CASE WHEN type = 'domain_register' THEN 1 END) as domain_count,
      COUNT(CASE WHEN type = 'hosting' THEN 1 END) as hosting_count
    FROM gsws_credit_transactions WHERE user_id = ?
  `).get(user.id) as any

  return NextResponse.json({
    balance: credits?.balance || 0,
    transactions,
    total,
    page,
    pages: Math.ceil(total / limit),
    stats,
  })
}
