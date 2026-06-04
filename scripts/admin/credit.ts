#!/usr/bin/env npx tsx
/**
 * GSWS Admin CLI — Credit Management (Approval Required)
 * Usage:
 *   npx tsx scripts/admin/credit.ts add <email> <amount> <reason>
 *   npx tsx scripts/admin/credit.ts deduct <email> <amount> <reason>
 *   npx tsx scripts/admin/credit.ts balance <email>
 *   npx tsx scripts/admin/credit.ts history <email>
 *   npx tsx scripts/admin/credit.ts users
 *   npx tsx scripts/admin/credit.ts pending
 *   npx tsx scripts/admin/credit.ts cancel <token>
 */
import { config } from 'dotenv'
import { resolve } from 'path'
config({ path: resolve(process.cwd(), '.env.local') })

import Database from 'better-sqlite3'
import path from 'path'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import os from 'os'

const db = new Database(path.join(process.cwd(), 'data', 'gsws.db'))
const [,, command, email, amountStr, ...reasonParts] = process.argv
const reason = reasonParts.join(' ')

const APPROVAL_EMAIL = 'ovie@meridianpeople.co.uk'
const APP_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'
const APPROVAL_SECRET = process.env.BETTER_AUTH_SECRET || ''

const mailer = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.stackmail.com',
  port: Number(process.env.MAIL_PORT || 465),
  secure: Number(process.env.MAIL_PORT || 465) === 465,
  auth: {
    user: process.env.MAIL_USER || 'hello@sws.geig.co.uk',
    pass: process.env.MAIL_PASS || '',
  },
})

function getUser(email: string) {
  const user = db.prepare('SELECT * FROM gsws_users WHERE email = ?').get(email) as any
  if (!user) { console.error(`❌ User not found: ${email}`); process.exit(1) }
  return user
}

function getBalance(userId: number): number {
  const c = db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any
  return c?.balance ?? 0
}

async function requestApproval(action: 'credit_add' | 'credit_deduct', targetEmail: string, amount: number, reason: string) {
  const user = getUser(targetEmail)
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
  const requestedBy = `${os.userInfo().username}@${os.hostname()}`

  // Sign the token
  const sig = crypto.createHmac('sha256', APPROVAL_SECRET)
    .update(`${token}|${action}|${user.id}|${amount}`)
    .digest('hex')

  const approvalUrl = `${APP_URL}/api/admin/approve?token=${token}&sig=${sig}`
  const cancelUrl = `${APP_URL}/api/admin/approve?token=${token}&sig=${sig}&cancel=1`

  // Store pending approval
  db.prepare(`
    INSERT INTO gsws_admin_approvals (token, action, target_user_id, target_email, amount, reason, requested_by, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(token, action, user.id, targetEmail, amount, reason, requestedBy, expiresAt)

  const actionLabel = action === 'credit_add' ? 'ADD CREDIT' : 'DEDUCT CREDIT'
  const sign = action === 'credit_add' ? '+' : '-'
  const currentBalance = getBalance(user.id)
  const newBalance = action === 'credit_add' ? currentBalance + amount : currentBalance - amount

  // Send approval email
  await mailer.sendMail({
    from: `"GeiG SWS Admin" <hello@sws.geig.co.uk>`,
    to: APPROVAL_EMAIL,
    subject: `[APPROVAL REQUIRED] ${actionLabel} £${amount.toFixed(2)} for ${targetEmail}`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <div style="background:#0a1628;padding:20px;border-radius:10px 10px 0 0">
          <h1 style="color:#fff;margin:0;font-size:18px">⚠️ Admin Credit Approval Required</h1>
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px">
          <table style="width:100%;font-size:14px;border-collapse:collapse;margin-bottom:24px">
            <tr><td style="padding:8px 0;color:#666;width:140px">Action</td><td style="font-weight:700;color:${action === 'credit_add' ? '#166534' : '#991b1b'}">${actionLabel}</td></tr>
            <tr><td style="padding:8px 0;color:#666">User</td><td>${targetEmail}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Amount</td><td style="font-weight:700">${sign}£${amount.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Current balance</td><td>£${currentBalance.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Balance after</td><td style="font-weight:700">£${newBalance.toFixed(2)}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Reason</td><td>${reason}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Requested by</td><td>${requestedBy}</td></tr>
            <tr><td style="padding:8px 0;color:#666">Expires</td><td>${new Date(expiresAt).toLocaleString('en-GB')}</td></tr>
          </table>
          <a href="${approvalUrl}" style="display:inline-block;padding:14px 28px;background:#166534;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;margin-right:12px">
            ✅ Approve
          </a>
          <a href="${cancelUrl}" style="display:inline-block;padding:14px 28px;background:#991b1b;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
            ❌ Cancel
          </a>
          <p style="margin-top:20px;font-size:12px;color:#999">
            This link expires in 24 hours. If you did not request this, ignore this email.
          </p>
        </div>
      </div>
    `,
  })

  console.log(`\n📧 Approval email sent to ${APPROVAL_EMAIL}`)
  console.log(`   Action: ${actionLabel} £${amount.toFixed(2)} for ${targetEmail}`)
  console.log(`   Reason: ${reason}`)
  console.log(`   Token: ${token.substring(0, 16)}...`)
  console.log(`   Expires: ${new Date(expiresAt).toLocaleString('en-GB')}\n`)
}

async function main() {
switch (command) {
  case 'add': {
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) { console.error('❌ Invalid amount'); process.exit(1) }
    if (!reason) { console.error('❌ Reason required'); process.exit(1) }
    await requestApproval('credit_add', email, amount, reason)
    break
  }

  case 'deduct': {
    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) { console.error('❌ Invalid amount'); process.exit(1) }
    if (!reason) { console.error('❌ Reason required'); process.exit(1) }
    await requestApproval('credit_deduct', email, amount, reason)
    break
  }

  case 'balance': {
    const user = getUser(email)
    console.log(`\n${user.email} — Balance: £${getBalance(user.id).toFixed(2)}\n`)
    break
  }

  case 'history': {
    const user = getUser(email)
    const txns = db.prepare(`
      SELECT * FROM gsws_credit_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20
    `).all(user.id) as any[]
    console.log(`\nCredit history for ${user.email}:`)
    console.log('─'.repeat(70))
    for (const t of txns) {
      const sign = t.amount > 0 ? '+' : ''
      console.log(`${t.created_at}  ${sign}£${t.amount.toFixed(2)}  [${t.type}]  ${t.description || ''}`)
    }
    console.log(`\nCurrent balance: £${getBalance(user.id).toFixed(2)}\n`)
    break
  }

  case 'users': {
    const users = db.prepare(`
      SELECT u.id, u.email, u.role, u.is_active, COALESCE(c.balance, 0) as balance
      FROM gsws_users u LEFT JOIN gsws_user_credits c ON c.user_id = u.id
      ORDER BY u.id
    `).all() as any[]
    console.log('\nAll users:')
    console.log('─'.repeat(70))
    for (const u of users) {
      console.log(`[${u.id}] ${u.email.padEnd(35)} role:${u.role.padEnd(12)} balance:£${u.balance.toFixed(2)} active:${u.is_active}`)
    }
    console.log()
    break
  }

  case 'pending': {
    const pending = db.prepare(`
      SELECT * FROM gsws_admin_approvals WHERE status = 'pending' AND expires_at > datetime('now')
      ORDER BY created_at DESC
    `).all() as any[]
    console.log(`\nPending approvals (${pending.length}):`)
    console.log('─'.repeat(70))
    for (const p of pending) {
      console.log(`[${p.id}] ${p.action.padEnd(15)} £${p.amount.toFixed(2).padEnd(10)} ${p.target_email.padEnd(30)} "${p.reason}"`)
      console.log(`      token: ${p.token.substring(0,16)}...  expires: ${p.expires_at}`)
    }
    console.log()
    break
  }

  case 'cancel': {
    const token = email // reuse email arg as token
    const approval = db.prepare('SELECT * FROM gsws_admin_approvals WHERE token = ?').get(token) as any
    if (!approval) { console.error('❌ Approval not found'); process.exit(1) }
    db.prepare("UPDATE gsws_admin_approvals SET status = 'cancelled' WHERE token = ?").run(token)
    console.log(`\n✅ Cancelled approval for ${approval.target_email} — £${approval.amount}\n`)
    break
  }

  default:
    console.log(`
GSWS Admin Credit CLI (approval required)
─────────────────────────────────────────
Commands:
  add <email> <amount> <reason>      Request to add credit (sends approval email)
  deduct <email> <amount> <reason>   Request to deduct credit (sends approval email)
  balance <email>                    Show current balance
  history <email>                    Show last 20 transactions
  users                              List all users with balances
  pending                            List pending approvals
  cancel <token>                     Cancel a pending approval
`)
}
}

main().catch(err => { console.error('❌', err.message); process.exit(1) })
