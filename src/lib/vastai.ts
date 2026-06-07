import axios from 'axios'

const VASTAI_API_KEY = process.env.VASTAI_API_KEY || ''
const BASE_URL = 'https://console.vast.ai/api/v0'

const client = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${VASTAI_API_KEY}`, 'Content-Type': 'application/json' },
  timeout: 30000,
})

const TIER_FILTERS: Record<string, { min_vram: number; max_vram: number; max_price_per_hr: number }> = {
  entry:        { min_vram: 14*1024,  max_vram: 18*1024,  max_price_per_hr: 1.0 },
  workstation:  { min_vram: 22*1024,  max_vram: 34*1024,  max_price_per_hr: 3.0 },
  pro:          { min_vram: 44*1024,  max_vram: 50*1024,  max_price_per_hr: 4.0 },
  dc:           { min_vram: 78*1024,  max_vram: 82*1024,  max_price_per_hr: 10.0 },
  hpc:          { min_vram: 92*1024,  max_vram: 98*1024,  max_price_per_hr: 15.0 },
  elite:        { min_vram: 138*1024, max_vram: 300*1024, max_price_per_hr: 50.0 },
}

export async function searchOffers(tier: string, limit = 5) {
  const filters = TIER_FILTERS[tier]
  if (!filters) throw new Error(`Unknown tier: ${tier}`)

  const query = {
    verified: { eq: true },
    rentable: { eq: true },
    gpu_ram: { gte: filters.min_vram, lte: filters.max_vram },
    dph_base: { lte: filters.max_price_per_hr },
    disk_space: { gte: 50 },
  }

  const res = await client.get(`/bundles/?q=${encodeURIComponent(JSON.stringify(query))}`)
  const offers = res.data?.offers || []

  return offers.slice(0, limit).map((o: any) => ({
    id: o.id,
    gpu_name: o.gpu_name,
    gpu_ram_gb: Math.round((o.gpu_ram || 0) / 1024),
    cpu_cores: o.cpu_cores,
    ram_gb: Math.round((o.cpu_ram || 0) / 1024),
    disk_gb: Math.round(o.disk_space || 0),
    price_per_hr: o.dph_base,
    location: o.geolocation || 'Unknown',
    reliability: o.reliability2 || 0,
    cuda_version: o.cuda_max_good,
    compute_cap: o.compute_cap,
  }))
}

export async function getInstance(instanceId: string) {
  const res = await client.get(`/instances/${instanceId}/`)
  return res.data?.instances?.[0] || null
}

export async function listInstances() {
  const res = await client.get('/instances/')
  return res.data?.instances || []
}

export async function destroyInstance(instanceId: string) {
  const res = await client.delete(`/instances/${instanceId}/`)
  return res.data
}

export async function stopInstance(instanceId: string) {
  const res = await client.put(`/instances/${instanceId}/`, { state: 'stopped' })
  return res.data
}

export async function startInstance(instanceId: string) {
  const res = await client.put(`/instances/${instanceId}/`, { state: 'running' })
  return res.data
}

export async function createInstance(offerId: number, options: {
  imageId?: string
  env?: Record<string, string>
  diskGb?: number
  jupyterLabToken?: string
}) {
  const res = await client.put(`/asks/${offerId}/`, {
    image: options.imageId || 'pytorch/pytorch:latest',
    env: options.env || {},
    disk: options.diskGb || 20,
    jupyter_token: options.jupyterLabToken || '',
    label: 'sws-gpu',
  })
  return res.data
}

export const TEMPLATE_IMAGES: Record<string, string> = {
  bare: 'ubuntu:22.04',
  pytorch: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',
  tensorflow: 'tensorflow/tensorflow:2.14.0-gpu',
  jupyter: 'jupyter/tensorflow-notebook:cuda12-python-3.11',
  ollama: 'ollama/ollama:latest',
  vllm: 'vllm/vllm-openai:latest',
  stablediffusion: 'universecoder/sd-auto:latest',
  comfyui: 'yanwk/comfyui-boot:latest',
  cudadev: 'nvidia/cuda:12.2.0-devel-ubuntu22.04',
}
