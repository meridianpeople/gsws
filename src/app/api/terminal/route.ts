import { NextRequest } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import { Client as SSHClient } from 'ssh2'
import { WebSocketServer, WebSocket } from 'ws'
import fs from 'fs'
import http from 'http'

// We use a standalone WebSocket server on a separate port
// This route just validates and redirects

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const packageId = searchParams.get('packageId')
  const type = searchParams.get('type') || 'hosting'

  const user = await getGswsSession(req)
  if (!user) return new Response('Unauthorized', { status: 401 })

  return new Response(JSON.stringify({
    wsUrl: `ws://${req.headers.get('host')?.replace(/:\d+/, '')}:3001/terminal`,
    packageId,
    type,
  }), { headers: { 'Content-Type': 'application/json' } })
}
