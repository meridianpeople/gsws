import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import crypto from 'crypto'

const VERSION = '1.0.0'
const e = '\x1b'
const c = (code: string, text: string) => `${e}[${code}m${text}${e}[0m`

function auditLog(userId: number, command: string, ip: string) {
  try {
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address) VALUES (?, 'cli_command', 'cli', 'web_cli', ?, ?)`).run(userId, command.substring(0, 200), ip)
  } catch {}
}

function getIP(req: NextRequest) {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

async function handleCommand(cmd: string, args: string[], user: any, role: string): Promise<string> {
  const isSuperAdmin = role === 'super_admin'
  const isSupport = role === 'support' || isSuperAdmin

  switch (cmd) {

    case 'help': {
      const lines = [
        '',
        c('1;36', `GSWS Web CLI v${VERSION}`),
        c('90', '─'.repeat(50)),
        '',
        c('1', 'Account:'),
        '  balance                          Show credit balance',
        '  notifications                    Show recent notifications',
        '  statement [--limit=N]            Show credit transactions',
        '',
        c('1', 'Packages:'),
        '  packages                         List your packages',
        '  package <id> info                Package details',
        '  package <id> dns                 List DNS records',
        '  package <id> email               List mailboxes',
        '  package <id> ssl                 SSL status',
        '  package <id> php                 PHP version',
        '',
        c('1', 'Domains:'),
        '  domains                          List your domains',
        '',
        c('1', 'System:'),
        '  whoami                           Show current user',
        '  version                          Show CLI version',
        '  clear                            Clear terminal',
        '  help                             Show this help',
      ]
      if (isSupport) {
        lines.push('', c('1;33', 'Support commands:'))
        lines.push('  customer lookup <email>          Find customer')
        lines.push('  customer packages <email>        Customer packages')
        lines.push('  customer balance <email>         Customer balance')
        lines.push('  customer notify <email> <msg>    Send notification')
        lines.push('  impersonate <email>              Start impersonation session')
        lines.push('  audit [email] [--limit=N]        Audit log')
        lines.push('  support list [--status=X]        Support requests')
        lines.push('  support update <id> <status>     Update request status')
      }
      if (isSuperAdmin) {
        lines.push('', c('1;31', 'Admin commands:'))
        lines.push('  stats                            Platform stats')
      }
      lines.push('')
      return lines.join('\n')
    }

    case 'whoami':
      return `${c('1', user.email)} (${user.role})${user.isMember ? ` — viewing ${c('33', user.ownerEmail)} as ${user.memberRole}` : ''}\n`

    case 'version':
      return `GSWS Web CLI v${VERSION}\n`

    case 'balance': {
      const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(user.id) as any
      return `${c('1;32', `£${(credits?.balance || 0).toFixed(2)}`)} available credit\n`
    }

    case 'packages': {
      const pkgs = db.prepare(`SELECT twentyi_package_id as id, domain_name, package_label, status FROM gsws_user_packages WHERE user_id = ? AND status != 'deleted' ORDER BY created_at DESC`).all(user.id) as any[]
      if (!pkgs.length) return `${c('33', 'No packages found')}\n`
      return '\n' + pkgs.map(p => `  ${p.status === 'active' ? c('32', '●') : c('31', '●')} ${c('1', p.domain_name)} ${c('90', `(${p.id})`)} — ${p.package_label}`).join('\n') + '\n\n'
    }

    case 'domains': {
      const domains = db.prepare(`SELECT domain_name, status, expires_at FROM gsws_user_domains WHERE user_id = ? ORDER BY created_at DESC`).all(user.id) as any[]
      if (!domains.length) return `${c('33', 'No domains found')}\n`
      return '\n' + domains.map(d => `  ${c('1', d.domain_name)} — ${d.status}${d.expires_at ? ` (expires ${d.expires_at})` : ''}`).join('\n') + '\n\n'
    }

    case 'notifications': {
      const notifs = db.prepare(`SELECT * FROM gsws_notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5`).all(user.id) as any[]
      if (!notifs.length) return `${c('33', 'No notifications')}\n`
      return '\n' + notifs.map(n => `  ${n.is_read ? c('90', n.title) : c('1', n.title)}\n  ${c('90', n.message)}\n  ${c('90', n.created_at)}`).join('\n\n') + '\n\n'
    }

    case 'statement': {
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')
      const txns = db.prepare(`SELECT * FROM gsws_credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`).all(user.id, limit) as any[]
      if (!txns.length) return `${c('33', 'No transactions')}\n`
      return '\n' + txns.map(t => `  ${t.amount > 0 ? c('32', `+£${t.amount.toFixed(2)}`) : c('31', `-£${Math.abs(t.amount).toFixed(2)}`)}  ${t.type.padEnd(15)} ${(t.description || '').substring(0, 40)}`).join('\n') + '\n\n'
    }

    case 'package': {
      const pkgId = args[0]; const sub = args[1]
      if (!pkgId || !sub) return `${c('31', 'Usage: package <id> <info|dns|email|ssl|php>')}\n`
      const pkg = db.prepare('SELECT * FROM gsws_user_packages WHERE twentyi_package_id = ? AND user_id = ?').get(pkgId, user.id) as any
      if (!pkg) return `${c('31', `Package ${pkgId} not found or access denied`)}\n`

      if (sub === 'info') return `\n  ${c('1', pkg.domain_name)}\n  ID: ${pkg.twentyi_package_id}\n  Type: ${pkg.package_label}\n  Status: ${pkg.status}\n\n`

      if (sub === 'dns') {
        try {
          const res = await client.get(`/package/${pkgId}/dns`) as any
          const records = res?.data || []
          if (!records.length) return `${c('33', 'No DNS records')}\n`
          return '\n' + records.map((r: any) => `  ${c('1', (r.type || '').padEnd(6))} ${(r.host || '@').padEnd(20)} ${r.target || r.ip || r.txt || ''}`).join('\n') + '\n\n'
        } catch (ex: any) { return `${c('31', `Error: ${ex.message}`)}\n` }
      }

      if (sub === 'email') {
        try {
          const emailRes = await client.get(`/package/${pkgId}/email`) as any
          const domains = emailRes?.data || emailRes || {}
          let out = '\n'
          for (const [domain] of Object.entries(domains as any)) {
            out += `  ${c('1', domain as string)}\n`
            const enc = encodeURIComponent(domain as string)
            const mbRes = await client.get(`/package/${pkgId}/email/${enc}/mailbox`) as any
            const mbs = mbRes?.data?.mailbox || []
            for (const mb of mbs) out += `    ${c('90', `${mb.local}@${domain}`)}  ${mb.quotaMB}MB quota\n`
          }
          return out + '\n'
        } catch (ex: any) { return `${c('31', `Error: ${ex.message}`)}\n` }
      }

      if (sub === 'ssl') {
        try {
          const res = await client.get(`/package/${pkgId}/web/ssl`) as any
          const ssl = res?.data
          return `\n  SSL: ${ssl?.enabled ? c('32', 'Enabled') : c('31', 'Disabled')}\n  Force HTTPS: ${ssl?.forceSSL ? c('32', 'Yes') : c('31', 'No')}\n\n`
        } catch (ex: any) { return `${c('31', `Error: ${ex.message}`)}\n` }
      }

      if (sub === 'php') {
        try {
          const res = await client.get(`/package/${pkgId}/web/php`) as any
          return `\n  PHP Version: ${c('1', res?.data?.version || 'unknown')}\n\n`
        } catch (ex: any) { return `${c('31', `Error: ${ex.message}`)}\n` }
      }

      return `${c('31', `Unknown subcommand: ${sub}`)}\n`
    }

    case 'impersonate': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const targetEmail = args[0]
      if (!targetEmail) return `${c('31', 'Usage: impersonate <email>')}\n`
      const target = db.prepare('SELECT * FROM gsws_users WHERE email = ? AND is_active = 1').get(targetEmail) as any
      if (!target) return `${c('31', `User not found: ${targetEmail}`)}\n`
      if (target.id === user.actualUserId) return `${c('31', 'Cannot impersonate yourself')}\n`

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      db.prepare('INSERT INTO gsws_impersonation (support_user_id, target_user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(user.actualUserId, target.id, token, expiresAt)
      db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'impersonate_start', 'support', targetEmail, `Impersonation started via web CLI`)
      db.prepare('INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(target.id, 'system', 'Support access', `A support agent accessed your account. If unexpected, contact us.`)

      return [
        '',
        c('33', `⚠️  Impersonation session created`),
        `  Target:  ${c('1', targetEmail)}`,
        `  Expires: ${new Date(expiresAt).toLocaleString('en-GB')}`,
        '',
        `  ${c('1;36', 'Click or open this URL to start session:')}`,
        `  /support/session?token=${token}`,
        '',
        c('90', '  All actions will be logged under your support account.'),
        '',
      ].join('\n')
    }

    case 'customer': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const sub = args[0]; const email = args[1]

      if (sub === 'lookup') {
        if (!email) return `${c('31', 'Usage: customer lookup <email>')}\n`
        const u = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `${c('31', `User not found: ${email}`)}\n`
        const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(u.id) as any
        const pkgs = (db.prepare("SELECT COUNT(*) as n FROM gsws_user_packages WHERE user_id = ? AND status = 'active'").get(u.id) as any).n
        return `\n  ${c('1', u.email)}\n  ID: ${u.id}  Role: ${u.role}  Active: ${u.is_active ? 'Yes' : 'No'}\n  Balance: ${c('32', `£${(credits?.balance || 0).toFixed(2)}`)}  Packages: ${pkgs}\n  Joined: ${u.created_at}\n\n`
      }

      if (sub === 'packages') {
        if (!email) return `${c('31', 'Usage: customer packages <email>')}\n`
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `${c('31', `User not found: ${email}`)}\n`
        const pkgs = db.prepare("SELECT * FROM gsws_user_packages WHERE user_id = ? AND status != 'deleted'").all(u.id) as any[]
        if (!pkgs.length) return `${c('33', 'No packages')}\n`
        return '\n' + pkgs.map(p => `  ${c('1', p.domain_name)} ${c('90', `(${p.twentyi_package_id})`)} — ${p.package_label} — ${p.status}`).join('\n') + '\n\n'
      }

      if (sub === 'balance') {
        if (!email) return `${c('31', 'Usage: customer balance <email>')}\n`
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `${c('31', `User not found: ${email}`)}\n`
        const credits = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(u.id) as any
        return `  ${email}: ${c('1;32', `£${(credits?.balance || 0).toFixed(2)}`)}\n`
      }

      if (sub === 'notify') {
        if (!email || !args[2]) return `${c('31', 'Usage: customer notify <email> <message>')}\n`
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `${c('31', `User not found: ${email}`)}\n`
        const message = args.slice(2).join(' ')
        db.prepare('INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(u.id, 'system', 'Message from support', message)
        return `${c('32', `✓ Notification sent to ${email}`)}\n`
      }

      return `${c('31', `Unknown: customer ${sub}`)}\n`
    }

    case 'audit': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const email = args.find(a => a.includes('@'))
      const limit = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '10')
      let query = 'SELECT a.*, u.email FROM gsws_audit_log a JOIN gsws_users u ON u.id = a.user_id WHERE 1=1'
      const params: any[] = []
      if (email) {
        const u = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email) as any
        if (!u) return `${c('31', `User not found: ${email}`)}\n`
        query += ' AND a.user_id = ?'; params.push(u.id)
      }
      query += ` ORDER BY a.created_at DESC LIMIT ${limit}`
      const logs = db.prepare(query).all(...params) as any[]
      if (!logs.length) return `${c('33', 'No audit entries')}\n`
      return '\n' + logs.map((l: any) => `  ${c('90', l.created_at)}  ${c('33', l.email.split('@')[0])}  ${c('1', l.action)}  ${(l.detail || '').substring(0, 50)}`).join('\n') + '\n\n'
    }

    case 'support': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const sub = args[0]
      if (sub === 'list') {
        const status = args.find(a => a.startsWith('--status='))?.split('=')[1]
        let query = 'SELECT s.*, u.email FROM gsws_support_requests s JOIN gsws_users u ON u.id = s.user_id WHERE 1=1'
        const params: any[] = []
        if (status) { query += ' AND s.status = ?'; params.push(status) }
        query += ' ORDER BY s.created_at DESC LIMIT 20'
        const reqs = db.prepare(query).all(...params) as any[]
        if (!reqs.length) return `${c('33', 'No support requests')}\n`
        return '\n' + reqs.map((r: any) => `  [${r.id}] ${r.status === 'open' ? c('31', r.status) : r.status === 'in_progress' ? c('33', r.status) : c('32', r.status)}  ${r.email}  ${r.subject.substring(0, 40)}`).join('\n') + '\n\n'
      }
      if (sub === 'update') {
        const id = args[1]; const status = args[2]
        if (!id || !status) return `${c('31', 'Usage: support update <id> <status>')}\n`
        db.prepare("UPDATE gsws_support_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id)
        return `${c('32', `✓ Request #${id} → ${status}`)}\n`
      }
      return `${c('31', `Unknown: support ${sub}`)}\n`
    }

    case 'stats': {
      if (!isSuperAdmin) return `${c('31', 'Permission denied')}\n`
      const s = {
        users: (db.prepare('SELECT COUNT(*) as n FROM gsws_users WHERE is_active = 1').get() as any).n,
        packages: (db.prepare("SELECT COUNT(*) as n FROM gsws_user_packages WHERE status = 'active'").get() as any).n,
        managed: (db.prepare("SELECT COUNT(*) as n FROM gsws_managed_services WHERE status = 'active'").get() as any).n,
        credits: (db.prepare('SELECT COALESCE(SUM(balance),0) as n FROM gsws_user_credits').get() as any).n,
        support: (db.prepare("SELECT COUNT(*) as n FROM gsws_support_requests WHERE status = 'open'").get() as any).n,
      }
      return `\n  ${c('1', 'Platform Stats')}\n  Users: ${s.users}  Packages: ${s.packages}  Managed: ${s.managed}\n  Total credits: ${c('32', `£${s.credits.toFixed(2)}`)}  Open support: ${s.support}\n\n`
    }

    default:
      return `${c('31', `Command not found: ${cmd}`)}. Type ${c('1', 'help')} for available commands.\n`
  }
}

export async function POST(req: NextRequest) {
  const user = await getGswsSession(req)
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  // Block managed accounts
  const managed = db.prepare(`SELECT id FROM gsws_managed_services WHERE user_id = ? AND status IN ('active', 'cancelling') LIMIT 1`).get(user.id)
  if (managed) return NextResponse.json({ output: `${'\x1b'}[31mCLI not available for managed accounts. Contact support.\n` })

  const { command } = await req.json()
  if (!command?.trim()) return NextResponse.json({ output: '' })

  const parts = command.trim().split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const args = parts.slice(1)

  const roleRow = db.prepare('SELECT role FROM gsws_users WHERE id = ?').get(user.actualUserId) as any
  const role = roleRow?.role || 'user'

  auditLog(user.actualUserId, command, getIP(req))

  if (cmd === 'clear') return NextResponse.json({ output: '\x1b[2J\x1b[H', clear: true })

  try {
    const output = await handleCommand(cmd, args, user, role)
    return NextResponse.json({ output })
  } catch (ex: any) {
    return NextResponse.json({ output: `${'\x1b'}[31mError: ${ex.message}\n` })
  }
}
