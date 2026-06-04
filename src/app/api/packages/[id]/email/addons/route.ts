import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'

// GET — list email addons for a package
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const addons = db.prepare(`
    SELECT * FROM gsws_email_addons
    WHERE user_id = ? AND package_id = ? AND status = 'active'
    ORDER BY created_at DESC
  `).all(user.id, id) as any[]

  // Count free vs paid mailboxes
  const freeIncluded = 3
  const mailboxAddons = addons.filter(a => a.addon_type === 'mailbox')
  const storageAddons = addons.filter(a => a.addon_type === 'storage')

  return NextResponse.json({
    addons,
    mailboxCount: mailboxAddons.reduce((sum, a) => sum + a.quantity, 0),
    storageBlocks: storageAddons.reduce((sum, a) => sum + a.quantity, 0),
    freeIncluded,
    monthlyTotal: mailboxAddons.reduce((sum, a) => sum + (a.price_ex_vat * a.quantity), 0),
  })
}
