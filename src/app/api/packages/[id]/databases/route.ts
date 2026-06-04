import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import { checkManagedLock } from '@/lib/managed'
import db from '@/lib/db'
import client from '@/lib/api/client'
import crypto from 'crypto'

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  return Array.from(crypto.randomBytes(16)).map(b => chars[b % chars.length]).join('')
}

function encryptPassword(password: string): string {
  const key = process.env.NEXTAUTH_SECRET || 'gsws-key'
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.padEnd(32).slice(0, 32)), iv)
  const encrypted = Buffer.concat([cipher.update(password), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

async function checkOwnership(req: NextRequest, id: string) {
  const user = await getGswsSession(req)
  if (!user) return null
  return db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(id, user.id) ? user : null
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })

  try {
    const { name, password: customPassword } = await req.json()
    if (!name) return NextResponse.json({ error: 'Database name required' }, { status: 400 })

    // Sanitise name - alphanumeric and underscores only
    const safeName = name.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 32)
    if (!safeName) return NextResponse.json({ error: 'Invalid database name' }, { status: 400 })

    const password = customPassword || generatePassword()

    // Create on 20i
    const res = await client.post(`/package/${id}/web/mysqlDatabases`, {
      name: safeName,
      password,
      allow_random: true,
    })

    // Get actual database name (may have suffix added)
    const dbsRes = await client.get(`/package/${id}/web/mysqlDatabases`)
    const allDbs = dbsRes.data || []
    const created = allDbs.find((d: any) => d.name.startsWith(safeName)) || { name: safeName, host: 'shareddb.hosting.stackcp.net' }

    // Store in GSWS with encrypted password
    db.prepare(`
      INSERT INTO gsws_databases (user_id, package_id, db_name, db_user, db_password_enc, db_host)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, id, created.name, created.name, encryptPassword(password), created.host || 'shareddb.hosting.stackcp.net')

    // Audit log
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'db_create', 'database', ?, ?, ?)
    `).run(user.id, created.name, `Database ${created.name} created on package ${id}`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({
      success: true,
      database: {
        name: created.name,
        host: created.host || 'shareddb.hosting.stackcp.net',
        username: created.name,
        password, // Show once
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })

  try {
    const { dbId, dbName } = await req.json()
    if (!dbId) return NextResponse.json({ error: 'Database ID required' }, { status: 400 })

    await client.post(`/package/${id}/web/removeMysqlDatabase`, { id: dbId })

    // Remove from GSWS
    db.prepare('DELETE FROM gsws_databases WHERE package_id = ? AND db_name = ? AND user_id = ?')
      .run(id, dbName, user.id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  try {
    const res = await client.get(`/package/${id}/web/mysqlDatabases`)
    return NextResponse.json({ databases: res.data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await checkOwnership(req, id)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  if ((user as any).__managedError) return NextResponse.json({ error: (user as any).__managedError }, { status: (user as any).__managedStatus })
  try {
    const { userId, password } = await req.json()
    if (!userId || !password) return NextResponse.json({ error: 'User ID and password required' }, { status: 400 })
    await client.post(`/package/${id}/web/mysqlUserPassword`, { user_id: userId, password })

    // Update stored password
    db.prepare(`
      UPDATE gsws_databases SET db_password_enc = ?
      WHERE package_id = ? AND user_id = ?
    `).run(encryptPassword(password), id, user.id)

    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'db_password_reset', 'database', ?, ?, ?)
    `).run(user.id, String(userId), `Database password reset`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
