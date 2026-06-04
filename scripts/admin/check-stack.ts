import { readFileSync } from 'fs'
const envFile = readFileSync('/home/ovie/gsws/.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const parts = line.split('=')
  const key = parts[0]
  const val = parts.slice(1).join('=').trim()
  if (key && val) process.env[key.trim()] = val
}

import axios from 'axios'
const encoded = Buffer.from(process.env.TWENTYI_API_KEY || '').toString('base64')
const client = axios.create({ baseURL: 'https://api.20i.com', headers: { Authorization: 'Bearer ' + encoded } })

async function main() {
  const res = await client.get('/reseller/*/stackUser')
  const users = res.data || []
  console.log('Total:', users.length)
  users.slice(0, 5).forEach((u: any) => {
    console.log('id:', u.id, 'contact:', JSON.stringify(u.contact))
  })
  // Also search for swstest
  const match = users.find((u: any) => JSON.stringify(u).toLowerCase().includes('swstest'))
  console.log('swstest match:', match ? JSON.stringify(match).substring(0, 200) : 'none')
}
main().catch(console.error)
