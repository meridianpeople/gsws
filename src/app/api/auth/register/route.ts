import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'

const APP_URL = process.env.GSWS_URL || 'https://sws.geig.co.uk'

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

export async function POST(req: NextRequest) {
  // Rate limit: 5 registrations per hour per IP
  const rl = rateLimit(getRateLimitKey(req, 'register'), 5, 60 * 60 * 1000)
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
  }
  try {
    const { email, password, name, couponCode } = await req.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Check email not already registered
    const existing = db.prepare('SELECT id FROM gsws_users WHERE email = ?').get(email.toLowerCase())
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    // Validate coupon if provided
    let coupon: any = null
    if (couponCode?.trim()) {
      coupon = db.prepare(`
        SELECT * FROM gsws_coupons
        WHERE code = ? AND status = 'active'
        AND (expires_at IS NULL OR expires_at > datetime('now'))
        AND uses_count < max_uses
      `).get(couponCode.trim())

      if (!coupon) {
        return NextResponse.json({ error: 'Invalid or expired coupon code' }, { status: 400 })
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString('hex')
    const verifyExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create user
    const result = db.prepare(`
      INSERT INTO gsws_users (email, name, password_hash, role, auth_provider, is_active, email_verified, email_verify_token, email_verify_expires)
      VALUES (?, ?, ?, 'user', 'gsws_native', 1, 0, ?, ?)
    `).run(email.toLowerCase(), name, passwordHash, verifyToken, verifyExpiry)

    const userId = result.lastInsertRowid as number

    // Create BA user record
    const baUserId = crypto.randomUUID()
    db.prepare(`INSERT OR IGNORE INTO user (id, name, email, emailVerified, createdAt, updatedAt) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))`).run(baUserId, name, email.toLowerCase())
    db.prepare(`INSERT OR IGNORE INTO account (id, accountId, providerId, userId, createdAt, updatedAt) VALUES (?, ?, 'credential', ?, datetime('now'), datetime('now'))`).run(crypto.randomUUID(), email.toLowerCase(), baUserId)

    // Init credits
    db.prepare(`INSERT INTO gsws_user_credits (user_id, balance) VALUES (?, 0)`).run(userId)

    // Apply coupon if valid
    if (coupon) {
      const creditAmount = coupon.credit_amount
      db.prepare(`UPDATE gsws_user_credits SET balance = balance + ? WHERE user_id = ?`).run(creditAmount, userId)
      db.prepare(`INSERT INTO gsws_credit_transactions (user_id, amount, type, description, reference, balance_after) VALUES (?, ?, 'coupon', ?, ?, ?)`).run(userId, creditAmount, `Coupon: ${coupon.code} — ${coupon.description || ''}`, coupon.code, creditAmount)
      db.prepare(`UPDATE gsws_coupons SET uses_count = uses_count + 1 WHERE id = ?`).run(coupon.id)
      db.prepare(`INSERT INTO gsws_coupon_redemptions (coupon_id, user_id) VALUES (?, ?)`).run(coupon.id, userId)
    }

    // Send verification email
    const verifyUrl = `${APP_URL}/verify-email?token=${verifyToken}`
    try {
      const mailer = getMailer()
      await mailer.sendMail({
        from: '"GeiG SWS" <hello@sws.geig.co.uk>',
        to: email,
        subject: 'Verify your GeiG SWS account',
        html: `
          <div style="font-family:-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <div style="background:#0a1628;padding:20px 24px;border-radius:10px 10px 0 0">
              <h1 style="color:#fff;margin:0;font-size:18px">Welcome to GeiG SWS, ${name}!</h1>
            </div>
            <div style="border:1px solid #e5e7eb;border-top:none;padding:24px;border-radius:0 0 10px 10px">
              <p style="color:#444;font-size:14px">Thanks for registering. Please verify your email address to activate your account.</p>
              ${coupon ? `<p style="color:#166534;font-size:13px;background:#f0fdf4;padding:12px;border-radius:6px">🎁 Coupon <strong>${coupon.code}</strong> applied — £${coupon.credit_amount.toFixed(2)} credit added to your account!</p>` : ''}
              <a href="${verifyUrl}" style="display:inline-block;margin:20px 0;padding:14px 28px;background:#1a6ef5;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px">
                Verify email address
              </a>
              <p style="color:#999;font-size:12px">This link expires in 24 hours. If you didn't register, you can ignore this email.</p>
            </div>
          </div>
        `,
      })
    } catch (mailErr) {
      console.error('[register] email failed:', mailErr)
    }

    // Audit log
    db.prepare(`INSERT INTO gsws_audit_log (user_id, action, resource_type, resource_name, detail, ip_address) VALUES (?, 'register', 'auth', 'account', ?, ?)`).run(userId, `New registration: ${email}${coupon ? ` (coupon: ${coupon.code})` : ''}`, req.headers.get('x-forwarded-for') || 'unknown')

    return NextResponse.json({
      success: true,
      message: 'Account created. Please check your email to verify your account.',
      couponApplied: coupon ? { code: coupon.code, amount: coupon.credit_amount } : null,
    })
  } catch (err: any) {
    console.error('[register]', err)
    console.error('[register]', err)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
