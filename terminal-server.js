const { WebSocketServer } = require('ws')
const { Client: SSHClient } = require('ssh2')
const fs = require('fs')
const http = require('http')
const path = require('path')
const crypto = require('crypto')
const Redis = require('ioredis')
const redis = new Redis({ host: '127.0.0.1', port: 6379 })

// Load env
const envPath = path.join(__dirname, '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const getEnv = (key) => env.match(new RegExp(key + '=(.+)'))?.[1]?.trim()

const TWENTYI_API_KEY = getEnv('TWENTYI_API_KEY')
const SWS_PRIVATE_KEY_PATH = getEnv('SWS_SSH_PRIVATE_KEY_PATH') || '/home/ovie/.ssh/sws_terminal'
const PORT = 3002

// Rate limiting — max 3 concurrent WS connections per user (shared across cluster via Redis)
const MAX_CONNECTIONS_PER_USER = 3

// Session validation via DB
async function validateSession(req) {
  try {
    const Database = require('better-sqlite3')
    const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
    const cookieHeader = req.headers.cookie || ''

    // Try Better Auth session cookie
    const secureCookie = cookieHeader.match(/__Secure-gsws_ba\.session_token=([^;]+)/)
    const normalCookie = cookieHeader.match(/gsws_ba\.session_token=([^;]+)/)
    const tokenMatch = secureCookie || normalCookie

    if (tokenMatch) {
      const rawToken = decodeURIComponent(tokenMatch[1].trim())
      const tokenId = rawToken.split('.')[0]
      if (tokenId) {
        const baSession = db.prepare(`
          SELECT s.token, s.userId, u.email, u.gswsUserId
          FROM session s
          JOIN user u ON u.id = s.userId
          WHERE s.token = ? AND s.expiresAt > datetime('now')
        `).get(tokenId)

        if (baSession) {
          const gswsUser = baSession.gswsUserId
            ? db.prepare('SELECT id, role, is_active FROM gsws_users WHERE id = ? AND is_active = 1').get(baSession.gswsUserId)
            : db.prepare('SELECT id, role, is_active FROM gsws_users WHERE email = ? AND is_active = 1').get(baSession.email)
          db.close()
          if (gswsUser) return { user_id: gswsUser.id, email: baSession.email, role: gswsUser.role }
        }
      }
    }

    // Try gsws_sessions
    const gswsMatch = cookieHeader.match(/gsws_session=([^;]+)/)
    if (gswsMatch) {
      const token = decodeURIComponent(gswsMatch[1].trim())
      const session = db.prepare(`
        SELECT s.*, u.id as user_id, u.email, u.role
        FROM gsws_sessions s
        JOIN gsws_users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > datetime('now') AND u.is_active = 1
      `).get(token)
      db.close()
      if (session) return session
    }

    db.close()
    return null
  } catch (e) {
    console.error('Session validation error:', e.message)
    return null
  }
}

// Verify session is still valid (called periodically during active connections)
function isSessionStillValid(userId) {
  try {
    const Database = require('better-sqlite3')
    const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
    const user = db.prepare('SELECT id FROM gsws_users WHERE id = ? AND is_active = 1').get(userId)
    db.close()
    return !!user
  } catch { return false }
}

async function getHostingCredentials(packageId, userId) {
  const axios = require('axios')
  const encoded = Buffer.from(TWENTYI_API_KEY).toString('base64')
  const client = axios.create({
    baseURL: 'https://api.20i.com',
    headers: { Authorization: `Bearer ${encoded}`, 'Content-Type': 'application/json' }
  })

  const Database = require('better-sqlite3')
  const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(packageId, userId)
  db.close()
  if (!pkg) throw new Error('Access denied')

  const [limits, webInfo] = await Promise.all([
    client.get(`/package/${packageId}/web/limits`).then(r => r.data).catch(() => ({})),
    client.get(`/package/${packageId}/web`).then(r => r.data).catch(() => null),
  ])

  if (!limits.ssh) throw new Error('SSH not enabled for this package type. Contact support to enable SSH access.')

  const ftpServer = webInfo?.info?.ftpserver || 'ftp.gb.stackcp.com'
  const host = ftpServer.replace('ftp.', 'ssh.')
  const username = pkg.domain_name
  if (!username) throw new Error('No SSH credentials found')

  return { host, port: 22, username, domain: pkg.domain_name }
}

async function getGpuCredentials(orderId, userId) {
  const Database = require('better-sqlite3')
  const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'gpu'").get(orderId, userId)
  db.close()
  if (!order) throw new Error('Access denied')

  const host = order.ssh_host
  const port = order.ssh_port || 22
  if (!host) throw new Error('GPU instance SSH not ready yet — please wait a few minutes and try again')

  return { host, port, username: order.ssh_user || 'root', domain: `GPU #${orderId}` }
}

async function getVpsCredentials(orderId, userId) {
  const Database = require('better-sqlite3')
  const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'vps'").get(orderId, userId)
  db.close()
  if (!order) throw new Error('Access denied')

  // Use stored ssh_host/ssh_user if available, fall back to provider_data
  const host = order.ssh_host || (() => {
    const pd = order.provider_data ? JSON.parse(order.provider_data) : null
    return pd?.ipConfig?.v4?.ip
  })()
  if (!host) throw new Error('VPS IP not available yet — provisioning may still be in progress')

  const username = order.ssh_user || 'root'
  return { host, port: order.ssh_port || 22, username, domain: order.service_key || order.notes }
}

function auditLog(userId, action, detail) {
  try {
    const Database = require('better-sqlite3')
    const db = new Database(path.join(__dirname, 'data/gsws.db')); db.pragma('busy_timeout = 5000')
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, 'terminal', 'ssh', ?)`).run(userId, action, detail)
    db.close()
  } catch {}
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString(), pid: process.pid }))
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('SWS Terminal Server')
})

const wss = new WebSocketServer({ server })

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const packageId = url.searchParams.get('packageId')
  const type = url.searchParams.get('type') || 'hosting' // cli, hosting, vps, gpu
  const orderId = url.searchParams.get('orderId')

  const send = (data) => ws.readyState === ws.OPEN && ws.send(data)
  const sendCtrl = (msg) => send(JSON.stringify({ type: 'control', msg }))

  // 1. Validate session
  const session = await validateSession(req)
  if (!session) {
    sendCtrl('Authentication failed')
    return ws.close()
  }

  // 2. Rate limit — max connections per user (shared across cluster via Redis)
  const connKey = `terminal:conns:${session.user_id}`
  const userConns = await redis.incr(connKey)
  redis.expire(connKey, 3600).catch(() => {}) // safety TTL in case decrement is missed
  if (userConns > MAX_CONNECTIONS_PER_USER) {
    await redis.decr(connKey)
    sendCtrl('Too many active terminal sessions. Please disconnect an existing session first.')
    return ws.close()
  }

  // 3. Get credentials
  sendCtrl(`Connecting to ${type === 'vps' ? 'VPS' : 'hosting package'}...`)
  let credentials
  try {
    if (type === 'vps') credentials = await getVpsCredentials(orderId, session.user_id)
    if (type === 'gpu') credentials = await getGpuCredentials(orderId, session.user_id)
    else credentials = await getHostingCredentials(packageId, session.user_id)
  } catch (err) {
    sendCtrl(`Error: ${err.message}`)
    await redis.decr(connKey)
    return ws.close()
  }

  sendCtrl(`Connecting to ${credentials.domain} (${credentials.host})...`)
  auditLog(session.user_id, 'terminal_connect', `SSH to ${credentials.domain} (${credentials.host})`)

  const ssh = new SSHClient()
  let stream = null
  let sessionCheckInterval = null

  // 4. Periodic session validation — disconnect if user logs out
  sessionCheckInterval = setInterval(() => {
    if (!isSessionStillValid(session.user_id)) {
      sendCtrl('Session expired. Disconnecting.')
      if (stream) stream.close()
      ssh.end()
      ws.close()
    }
  }, 30000) // check every 30s

  ssh.on('ready', () => {
    sendCtrl('Connected! Starting shell...')
    ssh.shell({ term: 'xterm-256color', cols: 220, rows: 50 }, (err, s) => {
      if (err) {
        sendCtrl(`Shell error: ${err.message}`)
        return ws.close()
      }
      stream = s

      stream.on('data', (data) => {
        if (ws.readyState === ws.OPEN) ws.send(data, { binary: true })
      })
      stream.stderr.on('data', (data) => {
        if (ws.readyState === ws.OPEN) ws.send(data, { binary: true })
      })
      stream.on('close', () => {
        sendCtrl('Session closed')
        ssh.end()
        ws.close()
      })

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data)
          if (msg.type === 'resize' && stream) {
            stream.setWindow(msg.rows, msg.cols, 0, 0)
          } else if (msg.type === 'input' && stream) {
            stream.write(msg.data)
          }
        } catch {
          if (stream) stream.write(data)
        }
      })
    })
  })

  ssh.on('error', (err) => {
    sendCtrl(`SSH error: ${err.message}`)
    ws.close()
  })

  ws.on('close', () => {
    clearInterval(sessionCheckInterval)
    if (stream) stream.close()
    ssh.end()
    redis.decr(connKey).catch(() => {})
    auditLog(session.user_id, 'terminal_disconnect', `SSH session ended for ${credentials?.domain || 'unknown'}`)
  })

  // Load private key
  let privateKey
  try {
    privateKey = fs.readFileSync(SWS_PRIVATE_KEY_PATH)
  } catch {
    sendCtrl('SSH key not found on server. Contact support.')
    return ws.close()
  }

  ssh.connect({
    host: credentials.host,
    port: credentials.port,
    username: credentials.username,
    privateKey,
    readyTimeout: 15000,
    keepaliveInterval: 10000,
  })
})

server.listen(PORT, () => {
  console.log(`SWS Terminal Server running on port ${PORT}`)
})
