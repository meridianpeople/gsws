import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    db.prepare('SELECT 1').get()
    return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString(), pid: process.pid })
  } catch (err: any) {
    return NextResponse.json({ status: 'error', error: err.message }, { status: 500 })
  }
}
