import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth'
import db from '@/lib/db'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('gsws_session')?.value
  if (!token || !validateSession(token)) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const catalogue = db.prepare("SELECT * FROM gsws_service_catalogue WHERE service_type='hosting' AND active=1").all() as any[]
  const priceMap: Record<string, any> = {}
  catalogue.forEach(c => { priceMap[c.service_key] = c })

  const types = [
    { id: 4440, label: 'WordPress Unlimited', category: 'wordpress', serviceKey: 'wordpress_unlimited', description: 'Optimised WordPress · Staging · Auto-updates · Unlimited mailboxes' },
    { id: 4438, label: 'Linux Unlimited', category: 'linux', serviceKey: 'linux_unlimited', description: 'PHP · MySQL · FTP · SSH · Unlimited mailboxes' },
    { id: 4439, label: 'Windows Unlimited', category: 'windows', serviceKey: 'windows_unlimited', description: 'IIS · ASP.NET · MSSQL · Unlimited mailboxes' },
  ].map(t => ({
    ...t,
    monthlyExVat: priceMap[t.serviceKey]?.sell_price || 6.00,
    monthlyIncVat: Math.round((priceMap[t.serviceKey]?.sell_price || 6.00) * 1.20 * 100) / 100,
    firstMonthTotal: Math.round((priceMap[t.serviceKey]?.sell_price || 6.00) * 1.20 * 100) / 100,
  }))

  return NextResponse.json({ types })
}
