const { WebSocketServer } = require('ws')
const { Client: SSHClient } = require('ssh2')
const fs = require('fs')
const http = require('http')
const path = require('path')

// Load env
const envPath = path.join(__dirname, '.env.local')
const env = fs.readFileSync(envPath, 'utf8')
const getEnv = (key) => env.match(new RegExp(key + '=(.+)'))?.[1]?.trim()

const TWENTYI_API_KEY = getEnv('TWENTYI_API_KEY')
const SWS_PRIVATE_KEY_PATH = getEnv('SWS_SSH_PRIVATE_KEY_PATH') || '/home/ovie/.ssh/sws_terminal'
const PORT = 3001

// Simple session validation via SWS API
async function validateSession(req) {
  try {
    const Database = require('better-sqlite3')
    const db = new Database(path.join(__dirname, 'data/gsws.db'))
    const cookieHeader = req.headers.cookie || ''

    // Try gsws_session cookie first
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

    // Try Better Auth session cookie
    const secureCookie = cookieHeader.match(/__Secure-gsws_ba\.session_token=([^;]+)/)
    const normalCookie = cookieHeader.match(/gsws_ba\.session_token=([^;]+)/)
    const tokenMatch = secureCookie || normalCookie
    if (tokenMatch) {
      const rawToken = decodeURIComponent(tokenMatch[1].trim())
      const tokenId = rawToken.split('.')[0]
      if (tokenId) {
        const session = db.prepare(`
          SELECT s.token, s.userId as user_id, u.email, u.role
          FROM session s
          JOIN user u ON u.id = s.userId
          WHERE s.token = ? AND s.expiresAt > datetime('now')
        `).get(tokenId)
        db.close()
        if (session) return session
      }
    }

    db.close()
    return null
  } catch (e) {
    console.error('Session validation error:', e.message)
    return null
  }
}

async function getHostingCredentials(packageId, userId) {
  const axios = require('axios')
  const encoded = Buffer.from(TWENTYI_API_KEY).toString('base64')
  const client = axios.create({
    baseURL: 'https://api.20i.com',
    headers: { Authorization: `Bearer ${encoded}`, 'Content-Type': 'application/json' }
  })

  // Verify ownership
  const Database = require('better-sqlite3')
  const db = new Database(path.join(__dirname, 'data/gsws.db'))
  const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(packageId, userId)
  db.close()
  if (!pkg) throw new Error('Access denied')

  const [limits, webInfo, creds] = await Promise.all([
    client.get(`/package/${packageId}/web/limits`).then(r => r.data).catch(() => ({})),
    client.get(`/package/${packageId}/web`).then(r => r.data).catch(() => null),
    client.get(`/package/${packageId}/web/ftpCredentials`).then(r => r.data).catch(() => []),
  ])

  if (!limits.ssh) throw new Error('SSH not enabled for this package. Please contact support.')

  const ftpServer = webInfo?.info?.ftpserver || 'ftp.gb.stackcp.com'
  const host = ftpServer.replace('ftp.', 'ssh.')
  const username = creds[0]?.username
  if (!username) throw new Error('No SSH credentials found')

  return { host, port: 22, username, domain: pkg.domain_name }
}

async function getVpsCredentials(orderId, userId) {
  const Database = require('better-sqlite3')
  const db = new Database(path.join(__dirname, 'data/gsws.db'))
  const order = db.prepare("SELECT * FROM gsws_compute_orders WHERE id = ? AND user_id = ? AND resource_type = 'vps'").get(orderId, userId)
  db.close()
  if (!order) throw new Error('Access denied')

  const providerData = order.provider_data ? JSON.parse(order.provider_data) : null
  const ip = providerData?.ipConfig?.v4?.ip
  if (!ip) throw new Error('VPS IP not available yet — provisioning may still be in progress')

  return { host: ip, port: 22, username: 'root', domain: order.service_key }
}

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('SWS Terminal Server')
})

const wss = new WebSocketServer({ server })

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  // Auth via cookie (forwarded by nginx)
  const packageId = url.searchParams.get('packageId')
  const type = url.searchParams.get('type') || 'hosting'
  const orderId = url.searchParams.get('orderId')

  const send = (data) => ws.readyState === ws.OPEN && ws.send(data)
  const sendCtrl = (msg) => send(JSON.stringify({ type: 'control', msg }))

  // Validate session
  const session = await validateSession(req)
  if (!session) {
    sendCtrl('Authentication failed')
    return ws.close()
  }

  sendCtrl(`Connecting to ${type === 'vps' ? 'VPS' : 'hosting package'}...`)

  let credentials
  try {
    if (type === 'vps') {
      credentials = await getVpsCredentials(orderId, session.user_id)
    } else {
      credentials = await getHostingCredentials(packageId, session.user_id)
    }
  } catch (err) {
    sendCtrl(`Error: ${err.message}`)
    return ws.close()
  }

  sendCtrl(`Connecting to ${credentials.domain} (${credentials.host})...`)

  const ssh = new SSHClient()
  let stream = null

  ssh.on('ready', () => {
    sendCtrl('Connected! Starting shell...')
    ssh.shell({ term: 'xterm-256color', cols: 220, rows: 50 }, (err, s) => {
      if (err) {
        sendCtrl(`Shell error: ${err.message}`)
        return ws.close()
      }
      stream = s

      // SSH → WebSocket
      stream.on('data', (data) => send(data))
      stream.stderr.on('data', (data) => send(data))
      stream.on('close', () => {
        sendCtrl('Session closed')
        ssh.end()
        ws.close()
      })

      // WebSocket → SSH
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data)
          if (msg.type === 'resize' && stream) {
            stream.setWindow(msg.rows, msg.cols, 0, 0)
          } else if (msg.type === 'input' && stream) {
            stream.write(msg.data)
          }
        } catch {
          // Raw input
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
    if (stream) stream.close()
    ssh.end()
  })

  // Load private key
  let privateKey
  try {
    privateKey = fs.readFileSync(SWS_PRIVATE_KEY_PATH)
  } catch {
    sendCtrl('SSH key not found on server')
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
