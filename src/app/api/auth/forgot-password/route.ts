import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const APP_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'

export async function POST(req: NextRequest) {
  // Rate limit: 3 attempts per 15 minutes per IP
  const rl = rateLimit(getRateLimitKey(req, 'forgot'), 3, 15 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ success: true, message: 'If an account exists with this email, you will receive a reset link shortly.' })
  }
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  // Always return success to prevent email enumeration
  const user = db.prepare('SELECT * FROM gsws_users WHERE email = ? AND password_hash IS NOT NULL').get(email.toLowerCase()) as any

  if (user) {
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    db.prepare('UPDATE gsws_users SET reset_token = ?, reset_token_expires = ? WHERE id = ?').run(token, expires, user.id)

    const resetUrl = `${APP_URL}/reset-password?token=${token}`

    try {
      const mailer = nodemailer.createTransport({
        host: process.env.MAIL_HOST || 'smtp.stackmail.com',
        port: 465, secure: true,
        auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS },
      })

      await mailer.sendMail({
        from: '"GeiG SWS" <hello@sws.geig.co.uk>',
        to: email,
        subject: 'Reset your GeiG SWS password',
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <div style="background:#0a1628;padding:20px 24px;border-radius:10px 10px 0 0">
              <h1 style="color:#fff;margin:0;font-size:18px">Reset your password</h1>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px">
              <p style="color:#444;font-size:14px">We received a request to reset your password for <strong>${email}</strong>.</p>
              <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#1a6ef5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
                Reset password
              </a>
              <p style="color:#999;font-size:12px">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.error('[forgot-password] email failed:', err)
    }

    db.prepare('INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address) VALUES (?, ?, ?, ?, ?, ?)').run(user.id, 'password_reset_request', 'auth', 'account', `Password reset requested for ${email}`, req.headers.get('x-forwarded-for') || 'unknown')
  }

  return NextResponse.json({ success: true, message: 'If an account exists with this email, you will receive a reset link shortly.' })
}
