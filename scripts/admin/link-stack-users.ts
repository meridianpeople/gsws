import { readFileSync } from 'fs'

// Load env before any other imports
const envFile = readFileSync('/home/ovie/gsws/.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const [key, ...vals] = line.split('=')
  if (key && !key.startsWith('#') && vals.length) {
    process.env[key.trim()] = vals.join('=').trim()
  }
}

import Database from 'better-sqlite3'
import axios from 'axios'

const db = new Database('/home/ovie/gsws/data/gsws.db')

const API_KEY = process.env.TWENTYI_API_KEY || ''
const encoded = Buffer.from(API_KEY).toString('base64')
const client = axios.create({
  baseURL: 'https://api.20i.com',
  headers: { Authorization: `Bearer ${encoded}`, 'Content-Type': 'application/json' },
  timeout: 15000,
})

async function main() {
  const res = await client.get('/reseller/*/stackUser')
  const stackUsers = res?.data || []
  console.log('Total stack users:', stackUsers.length)

  const gswsUsers = db.prepare('SELECT * FROM gsws_users').all() as any[]
  for (const user of gswsUsers) {
    const match = stackUsers.find((su: any) =>
      su?.contact?.email?.toLowerCase() === user.email.toLowerCase()
    )
    if (match) {
      const stackId = 'stack-user:' + match.id
      db.prepare('UPDATE gsws_users SET stackcp_user_id = ? WHERE id = ?').run(stackId, user.id)
      console.log('Linked:', user.email, '->', stackId)
    } else {
      console.log('No match:', user.email)
    }
  }
}

main().catch(console.error)
