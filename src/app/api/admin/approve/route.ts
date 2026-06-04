import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import crypto from 'crypto'

const APPROVAL_SECRET = process.env.BETTER_AUTH_SECRET || ''
const APP_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  const sig = searchParams.get('sig')
  const cancel = searchParams.get('cancel') === '1'

  if (!token || !sig) {
    return new NextResponse('<h1>Invalid link</h1>', { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  const approval = db.prepare(`
    SELECT * FROM gsws_admin_approvals WHERE token = ? AND status = 'pending' AND expires_at > datetime('now')
  `).get(token) as any

  if (!approval) {
    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
        <h2>❌ Invalid or expired approval link</h2>
        <p>This link has already been used, expired, or cancelled.</p>
      </body></html>
    `, { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  // Verify signature
  const expectedSig = crypto.createHmac('sha256', APPROVAL_SECRET)
    .update(`${token}|${approval.action}|${approval.target_user_id}|${approval.amount}`)
    .digest('hex')

  if (sig !== expectedSig) {
    return new NextResponse('<h1>Invalid signature</h1>', { status: 403, headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  if (cancel) {
    db.prepare("UPDATE gsws_admin_approvals SET status = 'cancelled' WHERE token = ?").run(token)
    return new NextResponse(`
      <html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
        <h2>✅ Approval cancelled</h2>
        <p>The credit request for <strong>${approval.target_email}</strong> has been cancelled.</p>
      </body></html>
    `, { headers: { 'content-type': 'text/html; charset=utf-8' } })
  }

  // Apply the credit
  const amount = approval.amount
  const userId = approval.target_user_id

  if (approval.action === 'credit_add') {
    db.prepare(`
      INSERT INTO gsws_user_credits (user_id, balance) VALUES (?, ?)
      ON CONFLICT(user_id) DO UPDATE SET balance = balance + ?, updated_at = datetime('now')
    `).run(userId, amount, amount)
  } else {
    const balance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any)?.balance || 0
    if (balance < amount) {
      return new NextResponse(`
        <html><body style="font-family:sans-serif;max-width:500px;margin:80px auto;text-align:center">
          <h2>❌ Insufficient balance</h2>
          <p>Cannot deduct £${amount.toFixed(2)} — current balance is £${balance.toFixed(2)}</p>
        </body></html>
      `, { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } })
    }
    db.prepare(`UPDATE gsws_user_credits SET balance = balance - ?, updated_at = datetime('now') WHERE user_id = ?`).run(amount, userId)
  }

  const newBalance = (db.prepare('SELECT balance FROM gsws_user_credits WHERE user_id = ?').get(userId) as any)?.balance || 0
  const sign = approval.action === 'credit_add' ? '+' : '-'

  // Log transaction
  db.prepare(`
    INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after)
    VALUES (?, ?, ?, ?, 'ADMIN_APPROVED', ?)
  `).run(userId, approval.action === 'credit_add' ? amount : -amount,
    approval.action === 'credit_add' ? 'admin_credit' : 'admin_deduct',
    approval.reason, newBalance)

  // Audit log
  db.prepare(`
    INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail)
    VALUES (?, ?, 'account', 'credit', ?)
  `).run(userId, approval.action,
    `${sign}£${amount.toFixed(2)} approved by Ovie — ${approval.reason}`)

  // Notify user
  db.prepare(`
    INSERT INTO gsws_notifications (user_id, type, title, message)
    VALUES (?, 'system', ?, ?)
  `).run(userId,
    approval.action === 'credit_add' ? 'Credit added to your account' : 'Credit adjustment applied',
    `${sign}£${amount.toFixed(2)} has been applied to your account. Reason: ${approval.reason}. New balance: £${newBalance.toFixed(2)}`)

  // Mark approved
  db.prepare("UPDATE gsws_admin_approvals SET status = 'approved', approved_at = datetime('now') WHERE token = ?").run(token)

  return new NextResponse(`
    <html><body style="font-family:-apple-system,sans-serif;max-width:500px;margin:80px auto;text-align:center">
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:32px">
        <h2 style="color:#166534;margin:0 0 16px">✅ Approved</h2>
        <p style="color:#444;margin:0 0 8px">Credit applied to <strong>${approval.target_email}</strong></p>
        <p style="font-size:24px;font-weight:700;color:#166534;margin:16px 0">${sign}£${amount.toFixed(2)}</p>
        <p style="color:#666;font-size:14px">New balance: £${newBalance.toFixed(2)}</p>
        <p style="color:#666;font-size:14px">Reason: ${approval.reason}</p>
      </div>
    </body></html>
  `, { headers: { 'content-type': 'text/html; charset=utf-8' } })
}
