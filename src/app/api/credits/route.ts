import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  const user = token ? validateSession(token) : null
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const credits = db.prepare('SELECT balance, currency FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
  const transactions = db.prepare(`
    SELECT id, amount, type, description, reference, balance_after, created_at
    FROM gsws_credit_transactions
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(user.id) as any[]

  return NextResponse.json({
    balance: credits?.balance || 0,
    currency: credits?.currency || 'GBP',
    transactions,
  })
}
