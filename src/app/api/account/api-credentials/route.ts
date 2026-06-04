import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

function generateClientId(): string {
  return 'gsws_' + crypto.randomBytes(16).toString('hex')
}

function generateClientSecret(): string {
  return crypto.randomBytes(32).toString('hex')
}

export async function GET(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const creds = db.prepare(`
    SELECT id, client_id, client_secret_preview, name, scopes, is_active, last_used_at, created_at
    FROM gsws_api_credentials WHERE user_id = ? ORDER BY created_at DESC
  `).all(user.id)

  return NextResponse.json({ credentials: creds })
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { name, scopes } = await req.json()

  // Limit to 5 credentials per user
  const count = (db.prepare('SELECT COUNT(*) as c FROM gsws_api_credentials WHERE user_id = ?').get(user.id) as any)?.c || 0
  if (count >= 5) return NextResponse.json({ error: 'Maximum 5 API credentials allowed' }, { status: 400 })

  const clientId = generateClientId()
  const clientSecret = generateClientSecret()
  const secretHash = await bcrypt.hash(clientSecret, 10)
  const secretPreview = clientSecret.substring(0, 8) + '...' + clientSecret.substring(clientSecret.length - 4)

  db.prepare(`
    INSERT INTO gsws_api_credentials (user_id, client_id, client_secret_hash, client_secret_preview, name, scopes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(user.id, clientId, secretHash, secretPreview, name || 'Default', scopes || 'read')

  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'api_credential_create', 'api', ?, ?)`).run(
    user.id, clientId, `API credential created: ${name || 'Default'}`)

  // Return secret only once
  return NextResponse.json({
    success: true,
    clientId,
    clientSecret,
    warning: 'Save your client secret now — it will not be shown again'
  })
}

export async function DELETE(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id } = await req.json()

  const cred = db.prepare('SELECT * FROM gsws_api_credentials WHERE id = ? AND user_id = ?').get(id, user.id) as any
  if (!cred) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare('DELETE FROM gsws_api_credentials WHERE id = ?').run(id)
  db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, 'api_credential_delete', 'api', ?, ?)`).run(
    user.id, cred.client_id, 'API credential deleted')

  return NextResponse.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const { id, is_active, name } = await req.json()

  const cred = db.prepare('SELECT * FROM gsws_api_credentials WHERE id = ? AND user_id = ?').get(id, user.id) as any
  if (!cred) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  db.prepare(`UPDATE gsws_api_credentials SET is_active = COALESCE(?, is_active), name = COALESCE(?, name), updated_at = datetime('now') WHERE id = ?`).run(
    is_active !== undefined ? (is_active ? 1 : 0) : null, name || null, id)

  return NextResponse.json({ success: true })
}
