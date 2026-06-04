import { readFileSync } from 'fs'
const envFile = readFileSync('/home/ovie/gsws/.env.local', 'utf8')
for (const line of envFile.split('\n')) {
  const parts = line.split('=')
  const key = parts[0]; const val = parts.slice(1).join('=').trim()
  if (key && val) process.env[key.trim()] = val
}

import axios from 'axios'
const client = axios.create({
  baseURL: 'https://console.vast.ai/api/v0',
  headers: { Authorization: `Bearer ${process.env.VASTAI_API_KEY}` },
})

async function main() {
  const res = await client.get('/templates/')
  const templates = res.data?.templates || res.data || []
  console.log('Response type:', typeof templates, Array.isArray(templates))
  console.log('Sample:', JSON.stringify(templates).substring(0, 500))
}
main().catch(console.error)
