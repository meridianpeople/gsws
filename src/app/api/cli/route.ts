import { NextRequest, NextResponse } from 'next/server'
import { getGswsSession } from '@/lib/session'
import db from '@/lib/db'
import client from '@/lib/api/client'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

const VERSION = '1.0.0'

function getMailer() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.stackmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER || 'hello@sws.geig.co.uk',
      pass: process.env.MAIL_PASS || '',
    },
  })
}
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
        '  package <id> mysql               List MySQL databases',
        '  package <id> backup              Trigger backup',
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
        lines.push('  sessions                         Active impersonation sessions')
        lines.push('  audit [email] [--limit=N]        Audit log')
        lines.push('  support list [--status=X]        Support requests')
        lines.push('  support update <id> <status>     Update request status')
        lines.push('  compute list [email]             List compute orders')
        lines.push('  compute show <id>                Show compute order')
        lines.push('  compute update <id> <instance>   Set instance ID')
        lines.push('  compute status <id> <status>     Update order status')
        lines.push('  compute sync <id>                Sync from Contabo')
        lines.push('  compute cancel <id>              Cancel order')
        lines.push('  vps list [email]                 List VPS orders')
        lines.push('  gpu list [email]                 List GPU orders')
      }
      if (isSuperAdmin) {
        lines.push('', c('1;31', 'Admin commands:'))
        lines.push('  stats                            Platform stats')
        lines.push('  credit add <email> <amount>      Add credit to account')
        lines.push('  credit deduct <email> <amount>   Deduct credit from account')
        lines.push('  user list [--limit=N]            List all users')
        lines.push('  user disable <email>             Disable user account')
        lines.push('  user enable <email>              Enable user account')
        lines.push('  coupon list                      List coupons')
        lines.push('  coupon create <code> <amount>    Create coupon')
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
      // First try local DB
      const localDomains = db.prepare('SELECT domain_name FROM gsws_user_domains WHERE user_id = ? ORDER BY registered_at DESC').all(user.id) as any[]
      if (localDomains.length) {
        return '\n' + localDomains.map((d: any) => `  ${c('1', d.domain_name)}`).join('\n') + '\n\n'
      }
      // Fall back to 20i API
      try {
        const res = await client.get('/domain') as any
        const all = res?.data || []
        // Filter to domains owned by this user via gsws_user_packages
        const userPkgs = db.prepare('SELECT domain_name FROM gsws_user_packages WHERE user_id = ?').all(user.id) as any[]
        const pkgDomains = new Set(userPkgs.map((p: any) => p.domain_name))
        const userDomains = all.filter((d: any) => pkgDomains.has(d.name) || pkgDomains.has(d.domain))
        const domainList = userDomains.length ? userDomains : all.slice(0, 50)
        if (!domainList.length) return `${c('33', 'No domains found')}\n`
        return '\n' + domainList.map((d: any) => {
          const name = d.name || d.domain || d.domain_name
          const expiry = d.expiryDate ? ` (exp: ${new Date(d.expiryDate).toLocaleDateString('en-GB')})` : ''
          return `  ${c('1', name)}${c('90', expiry)}`
        }).join('\n') + '\n\n'
      } catch (ex: any) {
        return `${c('31', 'Error fetching domains: ' + ex.message)}\n`
      }
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

      if (sub === 'mysql') {
        try {
          const res = await client.get(`/package/${pkgId}/web/mysqlDatabases`) as any
          const dbs = res?.data || []
          if (!dbs.length) return `${c('33', 'No MySQL databases')}\n`
          return '\n' + dbs.map((d: any) => `  ${c('1', d.name)}  ${d.server || ''}  ${d.quotaMb ? d.quotaMb+'MB quota' : ''}`).join('\n') + '\n\n'
        } catch (ex: any) { return `${c('31', `Error: ${ex.message}`)}\n` }
      }

      if (sub === 'backup') {
        try {
          await client.post(`/package/${pkgId}/web/backup`, {})
          return `${c('32', `✓ Backup triggered for ${pkg.domain_name}`)}\n`
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
      if (['support', 'super_admin'].includes(target.role)) return `${c('31', 'Cannot impersonate privileged users')}\n`

      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

      db.prepare('INSERT INTO gsws_impersonation (support_user_id, target_user_id, token, expires_at) VALUES (?, ?, ?, ?)').run(user.actualUserId, target.id, token, expiresAt)
      db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'impersonate_start', 'support', targetEmail, `Impersonation started via web CLI`)
      db.prepare('INSERT INTO gsws_notifications (user_id, type, title, message) VALUES (?, ?, ?, ?)').run(target.id, 'system', 'Support access', `A support agent accessed your account. If unexpected, contact us.`)

      // Email Ovie
      try {
        const mailer = getMailer()
        const agentUser = db.prepare('SELECT email FROM gsws_users WHERE id = ?').get(user.actualUserId) as any
        await mailer.sendMail({
          from: '"GSWS Security" <hello@sws.geig.co.uk>',
          to: 'ovie@meridianpeople.co.uk',
          subject: `[GSWS] Support impersonation started — ${targetEmail}`,
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px">
              <div style="background:#dc2626;padding:16px 20px;border-radius:8px 8px 0 0">
                <h2 style="color:#fff;margin:0;font-size:16px">⚠️ Support Impersonation Started</h2>
              </div>
              <div style="border:1px solid #e5e7eb;border-top:none;padding:20px;border-radius:0 0 8px 8px">
                <table style="width:100%;font-size:13px">
                  <tr><td style="color:#666;padding:4px 0;width:120px">Support agent</td><td><strong>${agentUser?.email}</strong></td></tr>
                  <tr><td style="color:#666;padding:4px 0">Target account</td><td><strong>${targetEmail}</strong></td></tr>
                  <tr><td style="color:#666;padding:4px 0">Time</td><td>${new Date().toLocaleString('en-GB')}</td></tr>
                  <tr><td style="color:#666;padding:4px 0">Expires</td><td>${new Date(expiresAt).toLocaleString('en-GB')}</td></tr>
                </table>
                <p style="font-size:12px;color:#999;margin-top:16px">This is an automated security alert. All actions during this session are logged.</p>
              </div>
            </div>
          `,
        })
      } catch (mailErr) {
        console.error('[impersonate] email failed:', mailErr)
      }

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

    case 'compute': {
      if (!user.isSupport && user.role !== 'super_admin') return c('31', 'Access denied') + '\n'
      const sub = args[0]
      const arg1 = args[1]
      const arg2 = args.slice(2).join(' ')

      if (!sub || sub === 'list') {
        let orders: any[]
        if (arg1) {
          const cu = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(arg1) as any
          if (!cu) return c('31', 'User not found: ' + arg1) + '\n'
          orders = db.prepare('SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.user_id = ? ORDER BY o.created_at DESC LIMIT 20').all(cu.id) as any[]
        } else {
          orders = db.prepare('SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id ORDER BY o.created_at DESC LIMIT 20').all() as any[]
        }
        if (!orders.length) return c('33', 'No compute orders found') + '\n'
        const lines = [c('36', 'Compute Orders (' + orders.length + ')')]
        for (const o of orders) {
          const statusCol = o.status === 'active' ? '32' : o.status === 'pending' ? '33' : '31'
          const instancePart = o.provider_instance_id ? ' | ID:' + o.provider_instance_id : ' | ' + c('33', 'no instance')
          lines.push('  #' + o.id + ' [' + c(statusCol, o.status) + '] ' + c('33', o.resource_type.toUpperCase()) + ' ' + o.service_key + ' | ' + o.user_email + ' | ' + o.billing_period + ' | £' + (o.price_inc_vat?.toFixed(2) || '?') + instancePart)
        }
        return lines.join('\n') + '\n'
      }

      if (sub === 'show') {
        if (!arg1) return c('31', 'Usage: compute show <order_id>') + '\n'
        const o = db.prepare('SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.id = ?').get(arg1) as any
        if (!o) return c('31', 'Order #' + arg1 + ' not found') + '\n'
        const pd = o.provider_data ? JSON.parse(o.provider_data) : null
        return [
          c('36', 'Compute Order #' + o.id),
          '  Customer:   ' + o.user_email,
          '  Type:       ' + o.resource_type.toUpperCase() + ' — ' + o.service_key,
          '  Status:     ' + o.status,
          '  Period:     ' + o.billing_period,
          '  Price:      £' + (o.price_inc_vat?.toFixed(2) || '?') + ' inc VAT',
          '  Instance:   ' + (o.provider_instance_id || 'not set'),
          '  IP:         ' + (pd?.ipConfig?.v4?.ip || 'not available'),
          '  Created:    ' + o.created_at,
          '  Expires:    ' + (o.expires_at || 'N/A'),
          '  Notes:      ' + (o.notes || 'none'),
        ].join('\n') + '\n'
      }

      if (sub === 'update') {
        if (!arg1 || !arg2) return c('31', 'Usage: compute update <order_id> <instance_id>') + '\n'
        const o = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ?').get(arg1) as any
        if (!o) return c('31', 'Order #' + arg1 + ' not found') + '\n'
        db.prepare("UPDATE gsws_compute_orders SET provider_instance_id = ?, status = 'active', updated_at = datetime('now') WHERE id = ?").run(arg2, arg1)
        db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'compute_update', 'compute', arg1, 'Instance ID set to ' + arg2 + ' by support')
        return c('32', '✓ Order #' + arg1 + ' updated — instance ID: ' + arg2) + '\n'
      }

      if (sub === 'status') {
        if (!arg1 || !arg2) return c('31', 'Usage: compute status <order_id> <status>') + '\n'
        const validStatuses = ['pending', 'active', 'suspended', 'cancelled', 'expired']
        if (!validStatuses.includes(arg2)) return c('31', 'Invalid status. Use: ' + validStatuses.join(', ')) + '\n'
        db.prepare("UPDATE gsws_compute_orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(arg2, arg1)
        db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'compute_status', 'compute', arg1, 'Status changed to ' + arg2 + ' by support')
        return c('32', '✓ Order #' + arg1 + ' status: ' + arg2) + '\n'
      }

      if (sub === 'notes') {
        if (!arg1 || !arg2) return c('31', 'Usage: compute notes <order_id> <notes>') + '\n'
        db.prepare("UPDATE gsws_compute_orders SET notes = ?, updated_at = datetime('now') WHERE id = ?").run(arg2, arg1)
        return c('32', '✓ Notes updated for order #' + arg1) + '\n'
      }

      if (sub === 'sync') {
        if (!arg1) return c('31', 'Usage: compute sync <order_id>') + '\n'
        const o = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ?').get(arg1) as any
        if (!o) return c('31', 'Order #' + arg1 + ' not found') + '\n'
        if (!o.provider_instance_id) return c('31', 'No instance ID — use: compute update <order_id> <instance_id>') + '\n'
        try {
          const contabo = await import('@/lib/contabo')
          const instance = await contabo.getInstance(o.provider_instance_id)
          if (instance) {
            const newStatus = instance.status === 'running' ? 'active' : instance.status
            db.prepare("UPDATE gsws_compute_orders SET provider_data = ?, status = ?, updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(instance), newStatus, arg1)
            return c('32', '✓ Order #' + arg1 + ' synced — status: ' + newStatus + ', IP: ' + (instance.ipConfig?.v4?.ip || 'pending')) + '\n'
          }
          return c('33', 'Instance not found on Contabo') + '\n'
        } catch (err: any) {
          return c('31', 'Sync failed: ' + err.message) + '\n'
        }
      }

      if (sub === 'cancel') {
        if (!arg1) return c('31', 'Usage: compute cancel <order_id>') + '\n'
        const o = db.prepare('SELECT * FROM gsws_compute_orders WHERE id = ?').get(arg1) as any
        if (!o) return c('31', 'Order #' + arg1 + ' not found') + '\n'
        if (o.provider_instance_id) {
          try {
            const contabo = await import('@/lib/contabo')
            await contabo.cancelInstance(o.provider_instance_id)
          } catch (err: any) {
            return c('31', 'Contabo cancel failed: ' + err.message) + '\n'
          }
        }
        db.prepare("UPDATE gsws_compute_orders SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(arg1)
        db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'compute_cancel', 'compute', arg1, 'Order cancelled by support')
        return c('32', '✓ Order #' + arg1 + ' cancelled') + '\n'
      }

      return c('31', 'Unknown: compute ' + sub) + '\n'
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

    case 'sessions': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const sessions = db.prepare(`
        SELECT i.*, su.email as support_email, tu.email as target_email
        FROM gsws_impersonation i
        JOIN gsws_users su ON su.id = i.support_user_id
        JOIN gsws_users tu ON tu.id = i.target_user_id
        WHERE i.status = 'active' AND i.expires_at > datetime('now')
        ORDER BY i.created_at DESC
      `).all() as any[]
      if (!sessions.length) return `${c('33', 'No active impersonation sessions')}\n`
      const lines = ['', c('1', 'Active impersonation sessions:'), '']
      for (const s of sessions) {
        const expiresIn = Math.round((new Date(s.expires_at).getTime() - Date.now()) / 60000)
        lines.push(`  ${c('33', `[${s.id}]`)} ${c('1', s.support_email)} → ${c('36', s.target_email)}`)
        lines.push(`        Started: ${s.created_at}  Expires in: ${expiresIn}m`)
      }
      lines.push('')
      return lines.join('\n')
    }

    default:

    case 'vps': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const emailArgV = args[0]?.includes('@') ? args[0] : undefined
      let vpsOrders: any[]
      if (emailArgV) {
        const cu = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(emailArgV) as any
        if (!cu) return `${c('31', 'User not found: ' + emailArgV)}\n`
        vpsOrders = db.prepare("SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.user_id = ? AND o.resource_type = 'vps' ORDER BY o.created_at DESC LIMIT 20").all(cu.id) as any[]
      } else {
        vpsOrders = db.prepare("SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.resource_type = 'vps' ORDER BY o.created_at DESC LIMIT 20").all() as any[]
      }
      if (!vpsOrders.length) return `${c('33', 'No VPS orders found')}\n`
      return '\n' + vpsOrders.map((o: any) => {
        const sc = o.status === 'active' ? '32' : o.status === 'pending' ? '33' : '31'
        return `  #${o.id} [${c(sc, o.status)}] ${o.service_key} | ${o.user_email} | £${(o.price_inc_vat||0).toFixed(2)} | ${o.provider_instance_id || c('90', 'no instance')}`
      }).join('\n') + '\n\n'
    }

    case 'gpu': {
      if (!isSupport) return `${c('31', 'Permission denied')}\n`
      const emailArgG = args[0]?.includes('@') ? args[0] : undefined
      let gpuOrders: any[]
      if (emailArgG) {
        const cu = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(emailArgG) as any
        if (!cu) return `${c('31', 'User not found: ' + emailArgG)}\n`
        gpuOrders = db.prepare("SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.user_id = ? AND o.resource_type = 'gpu' ORDER BY o.created_at DESC LIMIT 20").all(cu.id) as any[]
      } else {
        gpuOrders = db.prepare("SELECT o.*, u.email as user_email FROM gsws_compute_orders o JOIN gsws_users u ON u.id = o.user_id WHERE o.resource_type = 'gpu' ORDER BY o.created_at DESC LIMIT 20").all() as any[]
      }
      if (!gpuOrders.length) return `${c('33', 'No GPU orders found')}\n`
      return '\n' + gpuOrders.map((o: any) => {
        const sc = o.status === 'active' ? '32' : o.status === 'pending' ? '33' : '31'
        return `  #${o.id} [${c(sc, o.status)}] ${o.tier} ${o.billing_period} | ${o.user_email} | £${(o.price_inc_vat||0).toFixed(2)}`
      }).join('\n') + '\n\n'
    }

    case 'credit': {
      if (!isSuperAdmin) return `${c('31', 'Permission denied')}\n`
      const creditSub = args[0]; const creditEmail = args[1]; const creditAmount = parseFloat(args[2])
      if (!creditSub || !creditEmail || isNaN(creditAmount)) return `${c('31', 'Usage: credit <add|deduct> <email> <amount>')}\n`
      const creditUser = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(creditEmail) as any
      if (!creditUser) return `${c('31', 'User not found: ' + creditEmail)}\n`
      const adj = creditSub === 'deduct' ? -Math.abs(creditAmount) : Math.abs(creditAmount)
      db.prepare('INSERT OR IGNORE INTO gsws_user_credits (user_id, balance) VALUES (?, 0)').run(creditUser.id)
      db.prepare('UPDATE gsws_user_credits SET balance = balance + ? WHERE user_id = ?').run(adj, creditUser.id)
      const newBal = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(creditUser.id) as any)?.balance || 0
      db.prepare('INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, ?, ?, ?, ?)').run(creditUser.id, adj, 'admin_adjustment', `${creditSub === 'deduct' ? 'Deduction' : 'Credit'} by admin via CLI`, 'cli', newBal)
      db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'credit_adjust', 'account', creditEmail, `${creditSub} £${Math.abs(creditAmount).toFixed(2)} — new balance: £${newBal.toFixed(2)}`)
      return `${c('32', `✓ ${creditSub === 'deduct' ? 'Deducted' : 'Added'} £${Math.abs(creditAmount).toFixed(2)} — new balance: £${newBal.toFixed(2)}`)}\n`
    }

    case 'user': {
      if (!isSuperAdmin) return `${c('31', 'Permission denied')}\n`
      const userSub = args[0]
      if (userSub === 'list') {
        const ulimit = parseInt(args.find((a: string) => a.startsWith('--limit='))?.split('=')[1] || '20')
        const users = db.prepare('SELECT id, email, role, is_active, created_at FROM gsws_users ORDER BY created_at DESC LIMIT ?').all(ulimit) as any[]
        return '\n' + users.map((u: any) => `  ${u.is_active ? c('32', '●') : c('31', '●')} ${c('1', u.email)} ${c('90', '(' + u.role + ')')} — ${u.created_at.substring(0,10)}`).join('\n') + '\n\n'
      }
      if (userSub === 'disable' || userSub === 'enable') {
        const uemail = args[1]
        if (!uemail) return `${c('31', 'Usage: user ' + userSub + ' <email>')}\n`
        const uu = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(uemail) as any
        if (!uu) return `${c('31', 'User not found: ' + uemail)}\n`
        db.prepare('UPDATE gsws_users SET is_active = ? WHERE id = ?').run(userSub === 'enable' ? 1 : 0, uu.id)
        db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail) VALUES (?, ?, ?, ?, ?)').run(user.actualUserId, 'user_' + userSub, 'user', uemail, 'Account ' + userSub + 'd by admin')
        return `${c('32', '✓ ' + uemail + ' ' + userSub + 'd')}\n`
      }
      return `${c('31', 'Unknown: user ' + userSub)}\n`
    }

    case 'coupon': {
      if (!isSuperAdmin) return `${c('31', 'Permission denied')}\n`
      const couponSub = args[0]
      if (couponSub === 'list') {
        const coupons = db.prepare('SELECT * FROM gsws_coupons ORDER BY created_at DESC LIMIT 20').all() as any[]
        if (!coupons.length) return `${c('33', 'No coupons')}\n`
        return '\n' + coupons.map((cp: any) => `  ${cp.active ? c('32', cp.code) : c('31', cp.code)}  £${cp.amount.toFixed(2)}  used:${cp.used_count}/${cp.max_uses || '∞'}  exp:${cp.expires_at || 'never'}`).join('\n') + '\n\n'
      }
      if (couponSub === 'create') {
        const couponCode = args[1]?.toUpperCase(); const couponAmount = parseFloat(args[2])
        if (!couponCode || isNaN(couponAmount)) return `${c('31', 'Usage: coupon create <code> <amount>')}\n`
        try {
          db.prepare('INSERT INTO gsws_coupons (code, amount, currency, active) VALUES (?, ?, ?, 1)').run(couponCode, couponAmount, 'GBP')
          return `${c('32', '✓ Coupon ' + couponCode + ' created — £' + couponAmount.toFixed(2))}\n`
        } catch { return `${c('31', 'Coupon code ' + couponCode + ' already exists')}\n` }
      }
      return `${c('31', 'Unknown: coupon ' + couponSub)}\n`
    }

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
