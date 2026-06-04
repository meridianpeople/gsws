import { readFileSync } from 'fs'
const envFile = readFileSync('/home/ovie/gsws/.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const parts = line.split('=')
  const key = parts[0]
  const val = parts.slice(1).join('=').trim()
  if (key && val) process.env[key.trim()] = val
}

import Database from 'better-sqlite3'
import crypto from 'crypto'

const db = new Database('/home/ovie/gsws/data/gsws.db')
const [,, command, ...args] = process.argv

function pad(str: string, len: number) { return String(str || '').substring(0, len).padEnd(len) }
function line() { console.log('─'.repeat(80)) }

async function main() {
  switch (command) {

    case 'create': {
      // coupons create <amount> [--code=X] [--uses=N] [--expires=YYYY-MM-DD] [--desc="..."]
      const amount = parseFloat(args[0])
      if (isNaN(amount) || amount <= 0) { console.error('Usage: coupons create <amount> [options]'); break }

      const code = args.find(a => a.startsWith('--code='))?.split('=')[1]?.toUpperCase()
        || crypto.randomBytes(4).toString('hex').toUpperCase()
      const maxUses = parseInt(args.find(a => a.startsWith('--uses='))?.split('=')[1] || '1')
      const expiresAt = args.find(a => a.startsWith('--expires='))?.split('=')[1] || null
      const desc = args.find(a => a.startsWith('--desc='))?.split('=')?.[1] || ''

      // Check code not taken
      const existing = db.prepare('SELECT id FROM gsws_coupons WHERE code = ?').get(code)
      if (existing) { console.error(`Code ${code} already exists`); break }

      db.prepare(`
        INSERT INTO gsws_coupons (code, description, credit_amount, max_uses, expires_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(code, desc, amount, maxUses, expiresAt)

      console.log(`\n✅ Coupon created`)
      console.log(`   Code:    ${code}`)
      console.log(`   Amount:  £${amount.toFixed(2)}`)
      console.log(`   Max uses: ${maxUses}`)
      console.log(`   Expires: ${expiresAt || 'never'}`)
      console.log(`   Desc:    ${desc || '—'}\n`)
      break
    }

    case 'list': {
      const showAll = args.includes('--all')
      let query = `SELECT c.*, 
        (SELECT COUNT(*) FROM gsws_coupon_redemptions WHERE coupon_id = c.id) as redemptions
        FROM gsws_coupons c WHERE 1=1`
      if (!showAll) query += ` AND c.status = 'active'`
      query += ' ORDER BY c.created_at DESC'

      const coupons = db.prepare(query).all() as any[]
      console.log(`\nCoupons (${coupons.length}):`)
      line()
      console.log(`${pad('CODE', 12)} ${pad('AMOUNT', 8)} ${pad('USES', 10)} ${pad('EXPIRES', 12)} ${pad('STATUS', 10)} DESC`)
      line()
      for (const c of coupons) {
        const uses = `${c.uses_count}/${c.max_uses}`
        const expired = c.expires_at && new Date(c.expires_at) < new Date()
        const status = expired ? 'expired' : c.status
        console.log(`${pad(c.code, 12)} £${pad(c.credit_amount.toFixed(2), 7)} ${pad(uses, 10)} ${pad(c.expires_at || 'never', 12)} ${pad(status, 10)} ${c.description || ''}`)
      }
      console.log()
      break
    }

    case 'disable': {
      const code = args[0]?.toUpperCase()
      if (!code) { console.error('Usage: coupons disable <code>'); break }
      const result = db.prepare("UPDATE gsws_coupons SET status = 'disabled' WHERE code = ?").run(code)
      if (result.changes === 0) { console.error(`Coupon not found: ${code}`); break }
      console.log(`\n✅ Coupon ${code} disabled\n`)
      break
    }

    case 'enable': {
      const code = args[0]?.toUpperCase()
      if (!code) { console.error('Usage: coupons enable <code>'); break }
      db.prepare("UPDATE gsws_coupons SET status = 'active' WHERE code = ?").run(code)
      console.log(`\n✅ Coupon ${code} enabled\n`)
      break
    }

    case 'redemptions': {
      const code = args[0]?.toUpperCase()
      let query = `
        SELECT r.*, c.code, c.credit_amount, u.email
        FROM gsws_coupon_redemptions r
        JOIN gsws_coupons c ON c.id = r.coupon_id
        JOIN gsws_users u ON u.id = r.user_id
        WHERE 1=1
      `
      const params: any[] = []
      if (code) { query += ' AND c.code = ?'; params.push(code) }
      query += ' ORDER BY r.redeemed_at DESC LIMIT 50'

      const redemptions = db.prepare(query).all(...params) as any[]
      console.log(`\nRedemptions (${redemptions.length}):`)
      line()
      for (const r of redemptions) {
        console.log(`  ${r.redeemed_at}  ${pad(r.code, 12)} £${r.credit_amount.toFixed(2)}  ${r.email}`)
      }
      console.log()
      break
    }

    case 'delete': {
      const code = args[0]?.toUpperCase()
      if (!code) { console.error('Usage: coupons delete <code>'); break }
      const coupon = db.prepare('SELECT * FROM gsws_coupons WHERE code = ?').get(code) as any
      if (!coupon) { console.error(`Coupon not found: ${code}`); break }
      if (coupon.uses_count > 0) { console.error(`Cannot delete coupon with ${coupon.uses_count} redemptions. Use disable instead.`); break }
      db.prepare('DELETE FROM gsws_coupons WHERE code = ?').run(code)
      console.log(`\n✅ Coupon ${code} deleted\n`)
      break
    }

    default:
      console.log(`
GSWS Coupon CLI
───────────────
Commands:
  create <amount> [--code=X] [--uses=N] [--expires=YYYY-MM-DD] [--desc="..."]
  list [--all]                List active coupons (--all includes disabled)
  disable <code>              Disable a coupon
  enable <code>               Re-enable a coupon
  redemptions [code]          List redemptions (optionally filter by code)
  delete <code>               Delete unused coupon

Examples:
  npx tsx scripts/admin/coupons.ts create 20 --code=WELCOME20 --uses=100 --desc="Welcome offer"
  npx tsx scripts/admin/coupons.ts create 50 --uses=1 --expires=2026-12-31 --desc="Black Friday"
  npx tsx scripts/admin/coupons.ts list
  npx tsx scripts/admin/coupons.ts redemptions WELCOME20
`)
  }
}

main().catch(err => { console.error('Error:', err.message); process.exit(1) })
