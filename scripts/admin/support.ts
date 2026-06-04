import { readFileSync } from 'fs'
const envFile = readFileSync('/home/ovie/gsws/.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const parts = line.split('=')
  const key = parts[0]
  const val = parts.slice(1).join('=').trim()
  if (key && val) process.env[key.trim()] = val
}

import Database from 'better-sqlite3'

const db = new Database('/home/ovie/gsws/data/gsws.db')
const [,, command, ...args] = process.argv

function pad(str: string, len: number) { return String(str).substring(0, len).padEnd(len) }
function line() { console.log('─'.repeat(90)) }

async function main() {
  switch (command) {

    case 'audit': {
      // audit [email] [--limit=50] [--action=login]
      const email = args.find(a => a.includes('@'))
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '30')
      const action = args.find(a => a.startsWith('--action='))?.split('=')[1]

      let query = `
        SELECT a.*, u.email FROM gsws_audit_log a
        JOIN gsws_users u ON u.id = a.user_id
        WHERE 1=1
      `
      const params: any[] = []

      if (email) {
        const user = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!user) { console.error('User not found:', email); break }
        query += ' AND a.user_id = ?'
        params.push(user.id)
      }
      if (action) {
        query += ' AND a.action = ?'
        params.push(action)
      }
      query += ` ORDER BY a.created_at DESC LIMIT ${limit}`

      const logs = db.prepare(query).all(...params) as any[]
      console.log(`\nAudit log (${logs.length} entries)${email ? ` for ${email}` : ''}:`)
      line()
      console.log(`${pad('DATE', 20)} ${pad('USER', 28)} ${pad('ACTION', 18)} ${pad('RESOURCE', 15)} DETAIL`)
      line()
      for (const l of logs) {
        console.log(`${pad(l.created_at, 20)} ${pad(l.email, 28)} ${pad(l.action, 18)} ${pad(l.resource_type, 15)} ${(l.detail || '').substring(0, 40)}`)
      }
      console.log()
      break
    }

    case 'support': {
      // support list [--status=open] [--email=x]
      // support view <id>
      // support update <id> <status>
      // support close <id>
      const sub = args[0]

      if (sub === 'list' || !sub) {
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1]
        const email = args.find(a => a.includes('@'))

        let query = `
          SELECT s.*, u.email FROM gsws_support_requests s
          JOIN gsws_users u ON u.id = s.user_id WHERE 1=1
        `
        const params: any[] = []
        if (status) { query += ' AND s.status = ?'; params.push(status) }
        if (email) {
          const user = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
          if (user) { query += ' AND s.user_id = ?'; params.push(user.id) }
        }
        query += ' ORDER BY s.created_at DESC LIMIT 50'

        const requests = db.prepare(query).all(...params) as any[]
        console.log(`\nSupport requests (${requests.length}):`)
        line()
        console.log(`${pad('ID', 5)} ${pad('STATUS', 12)} ${pad('USER', 28)} ${pad('TYPE', 15)} SUBJECT`)
        line()
        for (const r of requests) {
          const statusColor = r.status === 'open' ? '🔴' : r.status === 'in_progress' ? '🟡' : '🟢'
          console.log(`${pad(r.id, 5)} ${statusColor} ${pad(r.status, 10)} ${pad(r.email, 28)} ${pad(r.request_type, 15)} ${r.subject.substring(0, 40)}`)
        }
        console.log()
        break
      }

      if (sub === 'view') {
        const id = args[1]
        const req = db.prepare(`
          SELECT s.*, u.email, u.name FROM gsws_support_requests s
          JOIN gsws_users u ON u.id = s.user_id WHERE s.id = ?
        `).get(id) as any
        if (!req) { console.error('Request not found:', id); break }
        console.log(`\nSupport Request #${req.id}`)
        line()
        console.log(`User:        ${req.email} (${req.name})`)
        console.log(`Status:      ${req.status}`)
        console.log(`Type:        ${req.request_type}`)
        console.log(`Package:     ${req.package_id || '—'}`)
        console.log(`Resource:    ${req.resource_name || '—'}`)
        console.log(`Subject:     ${req.subject}`)
        console.log(`Created:     ${req.created_at}`)
        console.log(`Updated:     ${req.updated_at}`)
        console.log(`\nDescription:\n${req.description || '(none)'}`)
        console.log()
        break
      }

      if (sub === 'update') {
        const id = args[1]
        const status = args[2] as 'open' | 'in_progress' | 'resolved' | 'closed'
        if (!['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
          console.error('Invalid status. Use: open, in_progress, resolved, closed')
          break
        }
        db.prepare(`UPDATE gsws_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(status, id)
        const req = db.prepare('SELECT * FROM gsws_support_requests WHERE id = ?').get(id) as any
        if (req) {
          db.prepare(`INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, 'system', 'Support request updated', ?)`)
            .run(req.user_id, `Your support request #${id} status updated to: ${status}`)
        }
        console.log(`\n✅ Request #${id} updated to: ${status}\n`)
        break
      }

      break
    }

    case 'logs': {
      // logs [--lines=50] [--error] [--today]
      const lines = parseInt(args.find(a => a.startsWith('--lines='))?.split('=')[1] || '50')
      const today = args.includes('--today')
      const errorOnly = args.includes('--error')

      let query = 'SELECT * FROM gsws_audit_log WHERE 1=1'
      const params: any[] = []

      if (today) {
        query += " AND created_at >= date('now')"
      }
      if (errorOnly) {
        query += " AND (action LIKE '%error%' OR action LIKE '%fail%' OR detail LIKE '%error%')"
      }
      query += ` ORDER BY created_at DESC LIMIT ${lines}`

      const logs = db.prepare(query).all(...params) as any[]
      console.log(`\nSystem logs (${logs.length} entries):`)
      line()
      for (const l of logs) {
        console.log(`${l.created_at}  [${pad(l.action, 20)}]  ${l.ip_address || ''}  ${(l.detail || '').substring(0, 60)}`)
      }
      console.log()
      break
    }

    case 'users': {
      const users = db.prepare(`
        SELECT u.id, u.email, u.role, u.is_active, u.created_at,
               COALESCE(c.balance, 0) as balance,
               (SELECT COUNT(*) FROM gsws_user_packages WHERE user_id = u.id AND status = 'active') as packages,
               (SELECT COUNT(*) FROM gsws_sessions WHERE user_id = u.id AND expires_at > datetime('now')) as sessions,
               (SELECT MAX(created_at) FROM gsws_audit_log WHERE user_id = u.id AND action = 'login') as last_login
        FROM gsws_users u LEFT JOIN gsws_user_credits c ON c.user_id = u.id
        ORDER BY u.id
      `).all() as any[]

      console.log(`\nAll users (${users.length}):`)
      line()
      for (const u of users) {
        console.log(`[${u.id}] ${pad(u.email, 35)} ${pad(u.role, 12)} bal:£${pad(u.balance.toFixed(2), 8)} pkgs:${u.packages} active:${u.is_active}`)
        console.log(`    last login: ${u.last_login || 'never'} | sessions: ${u.sessions}`)
      }
      console.log()
      break
    }

    case 'stats': {
      const stats = {
        users: (db.prepare('SELECT COUNT(*) as n FROM gsws_users WHERE is_active = 1').get() as any).n,
        packages: (db.prepare("SELECT COUNT(*) as n FROM gsws_user_packages WHERE status = 'active'").get() as any).n,
        managed: (db.prepare("SELECT COUNT(*) as n FROM gsws_managed_services WHERE status = 'active'").get() as any).n,
        domains: (db.prepare("SELECT COUNT(*) as n FROM gsws_user_domains").get() as any).n,
        totalCredits: (db.prepare('SELECT COALESCE(SUM(balance), 0) as n FROM gsws_user_credits').get() as any).n,
        openSupport: (db.prepare("SELECT COUNT(*) as n FROM gsws_support_requests WHERE status = 'open'").get() as any).n,
        auditToday: (db.prepare("SELECT COUNT(*) as n FROM gsws_audit_log WHERE created_at >= date('now')").get() as any).n,
      }
      console.log('\nGSWS Platform Stats')
      line()
      console.log(`Active users:      ${stats.users}`)
      console.log(`Active packages:   ${stats.packages}`)
      console.log(`Managed services:  ${stats.managed}`)
      console.log(`Domains:           ${stats.domains}`)
      console.log(`Total credits:     £${stats.totalCredits.toFixed(2)}`)
      console.log(`Open support reqs: ${stats.openSupport}`)
      console.log(`Audit events today:${stats.auditToday}`)
      console.log()
      break
    }

    default:
      console.log(`
GSWS Support CLI
────────────────
Commands:
  audit [email] [--limit=N] [--action=X]    View audit log
  logs [--lines=N] [--today] [--error]      View system logs
  users                                      List all users with stats
  stats                                      Platform overview stats
  support list [--status=open] [email]      List support requests
  support view <id>                          View request details
  support update <id> <status>              Update request status
`)
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
