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

const TIERS = [
  { name: 'budget',      min: 14*1024,  max: 18*1024,  max_price: 1.0 },
  { name: 'performance', min: 22*1024,  max: 26*1024,  max_price: 3.0 },
  { name: 'pro',         min: 44*1024,  max: 52*1024,  max_price: 8.0 },
  { name: 'enterprise',  min: 70*1024,  max: 110*1024, max_price: 20.0 },
]

async function main() {
  for (const tier of TIERS) {
    const q = { verified:{eq:true}, rentable:{eq:true}, gpu_ram:{gte:tier.min,lte:tier.max}, dph_base:{lte:tier.max_price} }
    const res = await client.get(`/bundles/?q=${encodeURIComponent(JSON.stringify(q))}`)
    const offers = res.data?.offers || []
    if (!offers.length) { console.log(`${tier.name}: no offers`); continue }
    const prices = offers.map((o:any) => o.dph_base).sort((a:any,b:any) => a-b)
    const avg = prices.reduce((s:any,p:any) => s+p, 0) / prices.length
    const min = prices[0]
    const max = prices[prices.length-1]
    console.log(`${tier.name}: ${offers.length} offers | min $${min.toFixed(3)} avg $${avg.toFixed(3)} max $${max.toFixed(3)}/hr`)
    console.log(`  With 40% margin: $${(avg*1.4).toFixed(3)}/hr = £${(avg*1.4*0.79).toFixed(2)}/hr`)
    console.log(`  Daily (24hr avg): £${(avg*1.4*0.79*24).toFixed(2)} | Monthly (720hr): £${(avg*1.4*0.79*720).toFixed(0)}`)
  }
}
main().catch(console.error)
