import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'

const VERSION = '1.0.0'

function auditLog(userId: number, command: string, ip: string) {
  try {
    db.prepare(`
      INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address)
      VALUES (?, 'cli_command', 'cli', 'web_cli', ?, ?)
    `).run(userId, command.substring(0, 200), ip)
  } catch {}
}

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

// Command handlers
async function handleCommand(cmd: string, args: string[], user: any, isSuperAdmin: boolean): Promise<string> {
  
  switch (cmd) {

    case 'help': {
      const base = `
\x1b[1;36mGSWS Web CLI v${VERSION}\x1b[0m
\x1b[90m${'─'.repeat(50)}\x1b[0m

\x1b[1mAccount:\x1b[0m
  balance                          Show credit balance
  notifications                    Show recent notifications
  statement [--limit=N]            Show credit transactions

\x1b[1mPackages:\x1b[0m
  packages                         List your packages
  package <id> info                Package details
  package <id> dns                 List DNS records
  package <id> email               List mailboxes
  package <id> ssl                 SSL status
  package <id> php                 PHP version

\x1b[1mDomains:\x1b[0m
  domains                          List your domains

\x1b[1mSystem:\x1b[0m
  help                             Show this help
  clear                            Clear terminal
  whoami                           Show current user
  version                          Show CLI version`

      const admin = `

\x1b[1;33mAdmin commands:\x1b[0m
  customer lookup <email>          Find customer
  customer packages <email>        Customer packages
  customer balance <email>         Customer balance
  customer notify <email> <msg>    Send notification
  audit [email] [--limit=N]        Audit log
  stats                            Platform stats
  support list [--status=X]        Support requests
  support update <id> <status>     Update request`

      return base + (isSuperAdmin ? admin : '') + '\n'
    }

    case 'whoami': {
      return `\x1b[1m${user.email}\x1b[0m (${user.role})${user.isMember ? ` — viewing \x1b[33m${user.ownerEmail}\x1b[0m as ${user.memberRole}` : ''}\n`
    }

    case 'version': return `GSWS Web CLI v${VERSION}\n`

    case 'balance': {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
      return `\x1b[1;32m£${(credits?.balance || 0).toFixed(2)}\x1b[0m available credit\n`
    }

    case 'packages': {
      const pkgs = db.prepare(`
        SELECT twentyi_package_id as id, domain_name, package_label, status
        FROM gsws_user_packages WHERE user_id = ? AND status != 'deleted'
        ORDER BY created_at DESC
      `).all(user.id) as any[]
      if (!pkgs.length) return '\x1b[33mNo packages found\x1b[0m\n'
      let out = '\n'
      for (const p of pkgs) {
        const status = p.status === 'active' ? '\x1b[32m●\x1b[0m' : '\x1b[31m●\x1b[0m'
        out += `  ${status} \x1b[1m${p.domain_name}\x1b[0m \x1b[90m(${p.id})\x1b[0m — ${p.package_label}\n`
      }
      return out + '\n'
    }

    case 'domains': {
      const domains = db.prepare(`
        SELECT domain_name, status, expires_at FROM gsws_user_domains WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(user.id) as any[]
      if (!domains.length) return '\x1b[33mNo domains found\x1b[0m\n'
      let out = '\n'
      for (const d of domains) {
        out += `  \x1b[1m${d.domain_name}\x1b[0m — ${d.status} ${d.expires_at ? `(expires ${d.expires_at})` : ''}\n`
      }
      return out + '\n'
    }

    case 'notifications': {
      const notifs = db.prepare(`
        SELECT * FROM gsws_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5
      `).all(user.id) as any[]
      if (!notifs.length) return '\x1b[33mNo notifications\x1b[0m\n'
      let out = '\n'
      for (const n of notifs) {
        const read = n.is_read ? '\x1b[90m' : '\x1b[1m'
        out += `  ${read}${n.title}\x1b[0m\n  \x1b[90m${n.message}\x1b[0m\n  \x1b[90m${n.created_at}\x1b[0m\n\n`
      }
      return out
    }

    case 'statement': {
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')
      const txns = db.prepare(`
        SELECT * FROM gsws_credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?
      `).all(user.id, limit) as any[]
      if (!txns.length) return '\x1b[33mNo transactions\x1b[0m\n'
      let out = '\n'
      for (const t of txns) {
        const sign = t.amount > 0 ? '\x1b[32m+' : '\x1b[31m'
        out += `  ${sign}£${Math.abs(t.amount).toFixed(2)}\x1b[0m  ${t.type.padEnd(15)} ${(t.description || '').substring(0, 40)}\n`
      }
      return out + '\n'
    }

    case 'package': {
      const pkgId = args[0]
      const sub = args[1]
      if (!pkgId || !sub) return '\x1b[31mUsage: package <id> <info|dns|email|ssl|php>\x1b[0m\n'

      const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(pkgId, user.id) as any
      if (!pkg) return `\x1b[31mPackage ${pkgId} not found or access denied\x1b[0m\n`

      if (sub === 'info') {
        return `\n  \x1b[1m${pkg.domain_name}\x1b[0m\n  ID: ${pkg.twentyi_package_id}\n  Type: ${pkg.package_label}\n  Status: ${pkg.status}\n\n`
      }

      if (sub === 'dns') {
        try {
          const res = await client.get(`/package/${pkgId}/dns`) as any
          const records = res?.data || []
          if (!records.length) return '\x1b[33mNo DNS records\x1b[0m\n'
          let out = '\n'
          for (const r of records) {
            out += `  \x1b[1m${(r.type || '').padEnd(6)}\x1b[0m ${(r.host || '@').padEnd(20)} ${r.target || r.ip || r.txt || ''}\n`
          }
          return out + '\n'
        } catch (e: any) { return `\x1b[31mError: ${e.message}\x1b[0m\n` }
      }

      if (sub === 'email') {
        try {
          const emailRes = await client.get(`/package/${pkgId}/email`) as any
          const domains = emailRes?.data || emailRes || {}
          let out = '\n'
          for (const [domain, mailboxes] of Object.entries(domains as any)) {
            out += `  \x1b[1m${domain}\x1b[0m\n`
            const enc = encodeURIComponent(domain)
            const mbRes = await client.get(`/package/${pkgId}/email/${enc}/mailbox`) as any
            const mbs = mbRes?.data?.mailbox || []
            for (const mb of mbs) {
              out += `    \x1b[90m${mb.local}@${domain}\x1b[0m  ${mb.quotaMB}MB quota\n`
            }
          }
          return out + '\n'
        } catch (e: any) { return `\x1b[31mError: ${e.message}\x1b[0m\n` }
      }

      if (sub === 'ssl') {
        try {
          const res = await client.get(`/package/${pkgId}/web/ssl`) as any
          const ssl = res?.data
          return `\n  SSL: \x1b[${ssl?.enabled ? '32mEnabled' : '31mDisabled'}\x1b[0m\n  Force HTTPS: ${ssl?.forceSSL ? '\x1b[32mYes' : '\x1b[31mNo'}\x1b[0m\n\n`
        } catch (e: any) { return `\x1b[31mError: ${e.message}\x1b[0m\n` }
      }

      if (sub === 'php') {
        try {
          const res = await client.get(`/package/${pkgId}/web/php`) as any
          return `\n  PHP Version: \x1b[1m${res?.data?.version || 'unknown'}\x1b[0m\n\n`
        } catch (e: any) { return `\x1b[31mError: ${e.message}\x1b[0m\n` }
      }

      return `\x1b[31mUnknown subcommand: ${sub}\x1b[0m\n`
    }

    // SUPER ADMIN COMMANDS
    case 'customer': {
      if (!isSuperAdmin) return '\x1b[31mPermission denied\x1b[0m\n'
      const sub = args[0]
      const email = args[1]

      if (sub === 'lookup') {
        if (!email) return '\x1b[31mUsage: customer lookup <email>\x1b[0m\n'
        const u = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `\x1b[31mUser not found: ${email}\x1b[0m\n`
        const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(u.id) as any
        const pkgs = (db.prepare('SELECT COUNT(*) as n FROM gsws_user_packages WHERE user_id = ? AND status = ?').get(u.id, 'active') as any).n
        return `\n  \x1b[1m${u.email}\x1b[0m\n  ID: ${u.id}\n  Role: ${u.role}\n  Active: ${u.is_active ? 'Yes' : 'No'}\n  Balance: \x1b[32m£${(credits?.balance || 0).toFixed(2)}\x1b[0m\n  Packages: ${pkgs}\n  Joined: ${u.created_at}\n\n`
      }

      if (sub === 'packages') {
        if (!email) return '\x1b[31mUsage: customer packages <email>\x1b[0m\n'
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `\x1b[31mUser not found: ${email}\x1b[0m\n`
        const pkgs = db.prepare('SELECT * FROM gsws_user_packages WHERE user_id = ? AND status != ?').all(u.id, 'deleted') as any[]
        if (!pkgs.length) return '\x1b[33mNo packages\x1b[0m\n'
        let out = '\n'
        for (const p of pkgs) {
          out += `  \x1b[1m${p.domain_name}\x1b[0m \x1b[90m(${p.twentyi_package_id})\x1b[0m — ${p.package_label} — ${p.status}\n`
        }
        return out + '\n'
      }

      if (sub === 'balance') {
        if (!email) return '\x1b[31mUsage: customer balance <email>\x1b[0m\n'
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `\x1b[31mUser not found: ${email}\x1b[0m\n`
        const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(u.id) as any
        return `  ${email}: \x1b[1;32m£${(credits?.balance || 0).toFixed(2)}\x1b[0m\n`
      }

      if (sub === 'notify') {
        if (!email || !args[2]) return '\x1b[31mUsage: customer notify <email> <message>\x1b[0m\n'
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `\x1b[31mUser not found: ${email}\x1b[0m\n`
        const message = args.slice(2).join(' ')
        db.prepare('INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(u.id, 'system', 'Message from support', message)
        return `\x1b[32m✓ Notification sent to ${email}\x1b[0m\n`
      }

      return `\x1b[31mUnknown: customer ${sub}\x1b[0m\n`
    }

    case 'stats': {
      if (!isSuperAdmin) return '\x1b[31mPermission denied\x1b[0m\n'
      const s = {
        users: (db.prepare('SELECT COUNT(*) as n FROM gsws_users WHERE is_active = 1').get() as any).n,
        packages: (db.prepare("SELECT COUNT(*) as n FROM gsws_user_packages WHERE status = 'active'").get() as any).n,
        managed: (db.prepare("SELECT COUNT(*) as n FROM gsws_managed_services WHERE status = 'active'").get() as any).n,
        credits: (db.prepare('SELECT COALESCE(SUM(balance),0) as n FROM gsws_user_credits').get() as any).n,
        support: (db.prepare("SELECT COUNT(*) as n FROM gsws_support_requests WHERE status = 'open'").get() as any).n,
      }
      return `\n  \x1b[1mPlatform Stats\x1b[0m\n  Users: ${s.users}  Packages: ${s.packages}  Managed: ${s.managed}\n  Total credits: \x1b[32m£${s.credits.toFixed(2)}\x1b[0m  Open support: ${s.support}\n\n`
    }

    case 'audit': {
      if (!isSuperAdmin) return '\x1b[31mPermission denied\x1b[0m\n'
      const email = args.find(a => a.includes('@'))
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')
      let query = 'SELECT a.*, u.email FROM gsws_audit_log a JOIN gsws_users u ON u.id = a.user_id WHERE 1=1'
      const params: any[] = []
      if (email) {
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `\x1b[31mUser not found: ${email}\x1b[0m\n`
        query += ' AND a.user_id = ?'; params.push(u.id)
      }
      query += ` ORDER BY a.created_at DESC LIMIT ${limit}`
      const logs = db.prepare(query).all(...params) as any[]
      let out = '\n'
      for (const l of logs) {
        out += `  \x1b[90m${l.created_at}\x1b[0m  \x1b[33m${l.email.split('@')[0]}\x1b[0m  \x1b[1m${l.action}\x1b[0m  ${(l.detail || '').substring(0, 50)}\n`
      }
      return out + '\n'
    }

    case 'support': {
      if (!isSuperAdmin) return '\x1b[31mPermission denied\x1b[0m\n'
      const sub = args[0]
      if (sub === 'list') {
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1]
        let query = 'SELECT s.*, u.email FROM gsws_support_requests s JOIN gsws_users u ON u.id = s.user_id WHERE 1=1'
        const params: any[] = []
        if (status) { query += ' AND s.status = ?'; params.push(status) }
        query += ' ORDER BY s.created_at DESC LIMIT 20'
        const reqs = db.prepare(query).all(...params) as any[]
        if (!reqs.length) return '\x1b[33mNo support requests\x1b[0m\n'
        let out = '\n'
        for (const r of reqs) {
          const col = r.status === 'open' ? '\x1b[31m' : r.status === 'in_progress' ? '\x1b[33m' : '\x1b[32m'
          out += `  [${r.id}] ${col}${r.status}\x1b[0m  ${r.email}  ${r.subject.substring(0, 40)}\n`
        }
        return out + '\n'
      }
      if (sub === 'update') {
        const id = args[1]; const status = args[2]
        if (!id || !status) return '\x1b[31mUsage: support update <id> <status>\x1b[0m\n'
        db.prepare("UPDATE gsws_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
        return `\x1b[32m✓ Request #${id} → ${status}\x1b[0m\n`
      }
      return `\x1b[31mUnknown: support ${sub}\x1b[0m\n`
    }

    default:
      return `\x1b[31mCommand not found: ${cmd}\x1b[0m. Type \x1b[1mhelp\x1b[0m for available commands.\n`
  }
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Block managed accounts
  const managed = db.prepare(`
    SELECT id FROM gsws_managed_services
    WHERE user_id = ? AND status IN ('active', 'cancelling')
    LIMIT 1
  `).get(user.id)

  const { command } = await req.json()
  if (!command?.trim()) return NextResponse.json({ output: '' })

  const parts = command.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  const isSuperAdmin = db.prepare('SELECT role FROM gsws_users WHERE id = ?').get(user.actualUserId) as any
  const superAdmin = isSuperAdmin?.role === 'super_admin'

  // Audit every command
  auditLog(user.actualUserId, command, getIP(req))

  if (cmd === 'clear') return NextResponse.json({ output: '\x1b[2J\x1b[H' })

  try {
    const output = await handleCommand(cmd, args, user, superAdmin)
    return NextResponse.json({ output })
  } catch (e: any) {
    return NextResponse.json({ output: `\x1b[31mError: ${e.message}\x1b[0m\n` })
  }
}
