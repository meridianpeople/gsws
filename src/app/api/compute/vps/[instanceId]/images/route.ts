import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { contaboFetch } from '@/lib/contabo'

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  try {
    const data = await contaboFetch('/v1/compute/images?size=100')
    return NextResponse.json({ images: data?.data || [] })
  } catch (err: any) {
    return NextResponse.json({ images: [] })
  }
}
