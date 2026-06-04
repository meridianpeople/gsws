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

function pad(s: string, n: number) { return s.substring(0, n).padEnd(n) }
function lpad(s: string, n: number) { return s.substring(0, n).padStart(n) }

async function main() {
  const q = { verified: { eq: true }, rentable: { eq: true } }
  const res = await client.get(`/bundles/?q=${encodeURIComponent(JSON.stringify(q))}`)
  const offers = res.data?.offers || []

  const gpus: Record<string, { count: number; vram: number; min_price: number; max_price: number; total: number }> = {}

  for (const o of offers) {
    const name = o.gpu_name || 'Unknown'
    const vram = Math.round((o.gpu_ram || 0) / 1024)
    const price = o.dph_base || 0
    if (!gpus[name]) gpus[name] = { count: 0, vram, min_price: price, max_price: price, total: 0 }
    gpus[name].count++
    gpus[name].min_price = Math.min(gpus[name].min_price, price)
    gpus[name].max_price = Math.max(gpus[name].max_price, price)
    gpus[name].total += price
  }

  const sorted = Object.entries(gpus)
    .map(([name, data]) => ({ name, ...data, avg: data.total / data.count }))
    .sort((a, b) => a.vram - b.vram || a.avg - b.avg)

  console.log(`\nTotal: ${offers.length} offers | ${sorted.length} unique GPUs\n`)
  console.log(`${pad('GPU', 32)} ${lpad('VRAM', 6)} ${lpad('Count', 6)} ${lpad('Min$/hr', 8)} ${lpad('Avg$/hr', 8)} ${lpad('£+5%/hr', 9)}`)
  console.log('─'.repeat(75))

  for (const g of sorted) {
    const gbp = g.avg * 1.05 * 0.79
    console.log(`${pad(g.name, 32)} ${lpad(g.vram+'GB', 6)} ${lpad(String(g.count), 6)} $${lpad(g.min_price.toFixed(3), 7)} $${lpad(g.avg.toFixed(3), 7)} £${lpad(gbp.toFixed(3), 8)}/hr`)
  }
}
main().catch(console.error)
