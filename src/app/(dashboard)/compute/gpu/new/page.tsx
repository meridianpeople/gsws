'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ConfirmModal from '@/components/ui/ConfirmModal'

const TIERS = [
  { key: 'entry',       label: 'Entry',       vram: '16GB',    desc: 'RTX 5060 Ti · RTX 5070 Ti · RTX 4070S Ti', color: '#6b7280', pricing: { hourly: 0.27, daily: 6.12, weekly: 40.54, monthly: 162.16, annual: 1742 } },
  { key: 'workstation', label: 'Workstation', vram: '24–32GB', desc: 'RTX PRO 4000 · RTX 5090',                  color: '#3b82f6', pricing: { hourly: 0.74, daily: 16.90, weekly: 111.96, monthly: 447.84, annual: 4810 } },
  { key: 'pro',         label: 'Pro',         vram: '45–48GB', desc: 'L40 · L40S · RTX 6000 Ada · RTX 4090',    color: '#8b5cf6', pricing: { hourly: 0.86, daily: 19.58, weekly: 129.78, monthly: 519.12, annual: 5573 } },
  { key: 'dc',          label: 'Data Centre', vram: '80GB',    desc: 'A100 PCIE · H100 SXM · A100 SXM4',        color: '#f59e0b', pricing: { hourly: 2.20, daily: 50.11, weekly: 331.93, monthly: 1327.70, annual: 14260 } },
  { key: 'hpc',         label: 'HPC',         vram: '94–96GB', desc: 'H100 NVL · RTX PRO 6000 WS/S',            color: '#ef4444', pricing: { hourly: 2.94, daily: 66.94, weekly: 443.39, monthly: 1773.56, annual: 19038 } },
  { key: 'elite',       label: 'Elite',       vram: '140GB+',  desc: 'H200 · H200 NVL · B200 · B300',           color: '#10b981', pricing: { hourly: 15.26, daily: 347.30, weekly: 2300, monthly: 9200, annual: 98800 } },
]

const BILLING_PERIODS = [
  { key: 'hourly',  label: 'Hourly',  discount: '' },
  { key: 'daily',   label: 'Daily',   discount: '5% off' },
  { key: 'weekly',  label: 'Weekly',  discount: '10% off' },
  { key: 'monthly', label: 'Monthly', discount: '15% off' },
  { key: 'annual',  label: 'Annual',  discount: '25% off' },
]

const MANAGED_LEVELS = [
  { key: 'none',       label: 'Self-Managed',  pct: 0,   desc: 'SSH/Jupyter access only' },
  { key: 'basic',      label: 'Basic',         pct: 20,  desc: 'Setup + Docker + health checks' },
  { key: 'standard',   label: 'Standard',      pct: 35,  desc: 'Setup + monitoring + restarts + reports' },
  { key: 'full',       label: 'Fully Managed', pct: 60,  desc: 'Setup + monitoring + fallback + optimisation' },
  { key: 'enterprise', label: 'Enterprise',    pct: 100, desc: 'SLA support + reserved capacity + architecture' },
]

const TEMPLATES = [
  { key: 'none',             label: 'No Template',       desc: 'Bare Ubuntu 22.04 + CUDA',                    image: 'nvidia/cuda:12.1.0-base-ubuntu22.04',             tags: ['Bare'],            color: '#6b7280' },
  { key: 'pytorch',          label: 'PyTorch',           desc: 'PyTorch 2.x + CUDA + cuDNN',                  image: 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime',   tags: ['ML', 'Training'],  color: '#ee4c2c' },
  { key: 'tensorflow',       label: 'TensorFlow',        desc: 'TensorFlow 2.x + GPU support',                image: 'tensorflow/tensorflow:latest-gpu',                tags: ['ML', 'Training'],  color: '#ff6f00' },
  { key: 'jupyter',          label: 'Jupyter Lab',       desc: 'Jupyter Lab + PyTorch + transformers',         image: 'jupyter/datascience-notebook:latest',             tags: ['Notebook'],        color: '#f37626' },
  { key: 'ollama',           label: 'Ollama',            desc: 'Run LLMs locally — Llama, Mistral, Gemma',    image: 'ollama/ollama:latest',                            tags: ['LLM'],             color: '#4f46e5' },
  { key: 'vllm',             label: 'vLLM',              desc: 'High-throughput LLM inference server',         image: 'vllm/vllm-openai:latest',                         tags: ['LLM'],             color: '#7c3aed' },
  { key: 'stable_diffusion', label: 'Stable Diffusion',  desc: 'AUTOMATIC1111 WebUI',                         image: 'universonic/stable-diffusion-webui:latest',       tags: ['Image Gen'],       color: '#db2777' },
  { key: 'comfyui',          label: 'ComfyUI',           desc: 'Node-based Stable Diffusion interface',        image: 'yanwk/comfyui-boot:latest',                       tags: ['Image Gen'],       color: '#be185d' },
  { key: 'cuda',             label: 'CUDA Dev',          desc: 'Ubuntu 22.04 + CUDA 12 + dev tools',          image: 'nvidia/cuda:12.1.0-devel-ubuntu22.04',            tags: ['Dev'],             color: '#76b900' },
  { key: 'custom',           label: 'Custom Image',      desc: 'Bring your own Docker image',                  image: '',                                                tags: ['Custom'],          color: '#9ca3af' },
]

export default function GPUComputePage() {
  const [selectedTier, setSelectedTier] = useState('entry')
  const [selectedPeriod, setSelectedPeriod] = useState('hourly')
  const [selectedManaged, setSelectedManaged] = useState('none')
  const [selectedTemplate, setSelectedTemplate] = useState('none')
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [customImage, setCustomImage] = useState('')
  const [offers, setOffers] = useState<any[]>([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [ordering, setOrdering] = useState(false)
  const router = useRouter()
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => { loadOrders() }, [])

  async function loadOrders() {
    try {
      const res = await fetch('/api/compute/gpu')
      const data = await res.json()
      setOrders(data.orders || [])
    } catch {}
  }

  async function handleInstanceAction(orderId: number, action: string) {
    try {
      const res = await fetch('/api/compute/gpu/' + orderId, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (data.success) loadOrders()
      else setError(data.error)
    } catch {}
  }

  async function handleCancelOrder(orderId: number) {
    if (!window.confirm('Cancel this GPU order? This will destroy the instance.')) return
    try {
      const res = await fetch('/api/compute/gpu/' + orderId, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { loadOrders(); setSuccess('Order cancelled') }
      else setError(data.error)
    } catch {}
  }

  useEffect(() => { loadOffers(); setSelectedOffer(null) }, [selectedTier])


  async function loadOffers() {
    setLoadingOffers(true)
    try {
      const res = await fetch(`/api/compute/gpu?tier=${selectedTier}`)
      const data = await res.json()
      setOffers(data.offers || [])
    } catch { setOffers([]) }
    finally { setLoadingOffers(false) }
  }

  const tier = TIERS.find(t => t.key === selectedTier)!

  // If a specific node is selected, price from its Vast.ai rate + 5% margin
  // Otherwise use tier base price
  const GBP_RATE = 0.79
  const MARGIN = 1.05
  const PERIOD_HOURS: Record<string, number> = { hourly: 1, daily: 24, weekly: 168, monthly: 720, annual: 8760 }
  const PERIOD_DISCOUNT: Record<string, number> = { hourly: 1.0, daily: 0.95, weekly: 0.90, monthly: 0.85, annual: 0.75 }

  const nodeBasePrice = selectedOffer
    ? selectedOffer.price_per_hr * MARGIN * GBP_RATE * PERIOD_HOURS[selectedPeriod] * PERIOD_DISCOUNT[selectedPeriod]
    : tier.pricing[selectedPeriod as keyof typeof tier.pricing]

  const basePrice = Math.round(nodeBasePrice * 100) / 100
  const managedPct = MANAGED_LEVELS.find(m => m.key === selectedManaged)?.pct || 0
  const managedAddon = basePrice * (managedPct / 100)
  const totalExVat = basePrice + managedAddon
  const totalIncVat = totalExVat * 1.2

  async function handleOrder(pin?: string) {
    setShowOrderModal(false)
    setOrdering(true); setError(''); setSuccess('')
    try {
      console.log('Placing GPU order...', { tier: selectedTier, billing_period: selectedPeriod })
      const res = await fetch('/api/compute/gpu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(pin ? { 'x-spend-pin': pin } : {}) },
        body: JSON.stringify({ tier: selectedTier, billing_period: selectedPeriod, managed_level: selectedManaged, template: selectedTemplate, custom_image: customImage, offer_id: selectedOffer?.id }),
      })
      console.log('Response status:', res.status)
      const data = await res.json()
      console.log('Response data:', data)
      if (!res.ok) { setError(data.error || 'Order failed'); return }
      setSuccess(`Order #${data.orderId} confirmed! £${data.priceIncVat?.toFixed(2)} charged.`)
      setTimeout(() => router.push('/compute/gpu'), 2000)
    } catch (err: any) { 
      console.error('Order error:', err)
      setError('Order failed: ' + err.message) 
    }
    finally { setOrdering(false) }
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#111', margin: 0 }}>Raw GPU Compute</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>High-performance GPU instances via Vast.ai — hourly, daily, weekly, monthly or annual</p>
      </div>

      {error && <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}

      {/* Active GPU Orders */}
      {/* Step 1: GPU Class */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>1. Select GPU class</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {TIERS.map(t => (
            <button key={t.key} onClick={() => setSelectedTier(t.key)}
              style={{ padding: '14px 16px', border: `2px solid ${selectedTier === t.key ? t.color : '#e5e7eb'}`, borderRadius: '10px', background: selectedTier === t.key ? `${t.color}15` : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: selectedTier === t.key ? t.color : '#111' }}>{t.label}</div>
                <span style={{ fontSize: '11px', fontWeight: 700, background: selectedTier === t.key ? t.color : '#f3f4f6', color: selectedTier === t.key ? '#fff' : '#666', padding: '2px 6px', borderRadius: '4px' }}>{t.vram}</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>{t.desc}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#444', marginTop: '8px' }}>from £{t.pricing.hourly}/hr</div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Select Node */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 4px' }}>
          2. Select a node
          {loadingOffers && <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '12px' }}> — loading...</span>}
        </h3>
        <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: '0 0 14px' }}>Pick a specific node or leave on auto for best available at provisioning</p>

        <button onClick={() => setSelectedOffer(null)}
          style={{ width: '100%', padding: '12px 16px', border: `2px solid ${!selectedOffer ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: !selectedOffer ? '#e8f0fe' : '#f9fafb', cursor: 'pointer', textAlign: 'left', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: !selectedOffer ? '#1a6ef5' : '#111' }}>Auto-assign best node</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>We pick the most reliable available instance</span>
          </div>
          {!selectedOffer && <span style={{ fontSize: '11px', color: '#1a6ef5', fontWeight: 700 }}>✓ Selected</span>}
        </button>

        {offers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {offers.map(o => (
              <button key={o.id} onClick={() => setSelectedOffer(selectedOffer?.id === o.id ? null : o)}
                style={{ padding: '12px 16px', border: `2px solid ${selectedOffer?.id === o.id ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedOffer?.id === o.id ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: '8px', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: selectedOffer?.id === o.id ? '#1a6ef5' : '#111' }}>{o.gpu_name}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{o.gpu_ram_gb}GB VRAM</div>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: '#444' }}>{o.cpu_cores} vCPU</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{o.ram_gb}GB RAM</div>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: '#444' }}>{o.disk_gb}GB</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Disk</div>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: '#444' }}>{o.location?.split(',')[1]?.trim() || o.location || 'Unknown'}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{o.location?.split(',')[0]?.trim()}</div>
                </div>
                <div style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: (o.reliability || 0) > 0.9 ? '#16a34a' : '#d97706' }}>{o.reliability ? (o.reliability * 100).toFixed(0) + '%' : 'N/A'}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Reliability</div>
                </div>
                <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                  <div style={{ fontWeight: 600, color: '#444' }}>#{o.id}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Node</div>
                </div>
                <div style={{ fontSize: '11px', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: selectedOffer?.id === o.id ? '#1a6ef5' : '#111' }}>
                    £{(o.price_per_hr * 1.05 * 0.79 * ({hourly:1,daily:24,weekly:168,monthly:720,annual:8760}[selectedPeriod] || 1) * ({hourly:1.0,daily:0.95,weekly:0.90,monthly:0.85,annual:0.75}[selectedPeriod] || 1)).toFixed(selectedPeriod === 'hourly' ? 3 : 2)}/{selectedPeriod === 'hourly' ? 'hr' : selectedPeriod}
                  </div>
                  {selectedOffer?.id === o.id && <div style={{ color: '#1a6ef5', fontWeight: 700, fontSize: '10px' }}>✓ Selected</div>}
                </div>
              </button>
            ))}
          </div>
        )}
        {offers.length === 0 && !loadingOffers && (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>No instances available for this tier. Auto-assign will find best node at provisioning.</p>
        )}
      </div>

      {/* Step 3: Billing period */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>3. Billing period</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          {BILLING_PERIODS.map(p => (
            <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
              style={{ padding: '12px 8px', border: `2px solid ${selectedPeriod === p.key ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedPeriod === p.key ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: selectedPeriod === p.key ? '#1a6ef5' : '#111' }}>{p.label}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                £{selectedOffer
                  ? Math.round(selectedOffer.price_per_hr * 1.05 * 0.79 * ({hourly:1,daily:24,weekly:168,monthly:720,annual:8760}[p.key as string] || 1) * ({hourly:1.0,daily:0.95,weekly:0.90,monthly:0.85,annual:0.75}[p.key as string] || 1) * 100) / 100
                  : tier.pricing[p.key as keyof typeof tier.pricing]
                }
              </div>
              {p.discount && <div style={{ fontSize: '10px', color: '#16a34a', marginTop: '2px', fontWeight: 600 }}>{p.discount}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Step 4: Managed add-on */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>4. Managed add-on <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(optional)</span></h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MANAGED_LEVELS.map(m => (
            <button key={m.key} onClick={() => setSelectedManaged(m.key)}
              style={{ padding: '12px 16px', border: `2px solid ${selectedManaged === m.key ? '#1a6ef5' : '#e5e7eb'}`, borderRadius: '8px', background: selectedManaged === m.key ? '#e8f0fe' : '#fff', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: selectedManaged === m.key ? '#1a6ef5' : '#111' }}>{m.label}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>{m.desc}</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: m.pct > 0 ? '#444' : '#9a9a9a', whiteSpace: 'nowrap' }}>{m.pct > 0 ? `+${m.pct}%` : 'Free'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step 5: Environment template */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#111', margin: '0 0 14px' }}>5. Environment template</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {TEMPLATES.map(t => (
            <button key={t.key} onClick={() => setSelectedTemplate(t.key)}
              style={{ padding: '12px', border: `2px solid ${selectedTemplate === t.key ? t.color : '#e5e7eb'}`, borderRadius: '8px', background: selectedTemplate === t.key ? `${t.color}12` : '#fff', cursor: 'pointer', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: selectedTemplate === t.key ? t.color : '#111' }}>{t.label}</span>
                {t.tags.map(tag => (
                  <span key={tag} style={{ fontSize: '9px', background: '#f3f4f6', color: 'var(--text-secondary)', padding: '1px 5px', borderRadius: '3px', fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{t.desc}</div>
            </button>
          ))}
        </div>
        {selectedTemplate === 'custom' && (
          <div style={{ marginTop: '12px' }}>
            <input type="text" placeholder="e.g. myrepo/myimage:latest" value={customImage} onChange={e => setCustomImage(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
          </div>
        )}
        <div style={{ marginTop: '10px', padding: '8px 12px', background: '#f9fafb', borderRadius: '6px', fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {selectedTemplate === 'custom' ? (customImage || 'Enter Docker image above') : TEMPLATES.find(t => t.key === selectedTemplate)?.image}
        </div>
      </div>

      {/* Order summary */}
      <div style={{ background: '#0a1628', borderRadius: '12px', padding: '20px', color: '#fff' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 14px', color: '#e5e7eb' }}>Order summary</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>{tier.label} {tier.vram} ({selectedPeriod})</span>
            <span>£{basePrice.toLocaleString()}</span>
          </div>
          {selectedOffer && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>Node</span>
              <span style={{ fontSize: '12px' }}>{selectedOffer.gpu_name} #{selectedOffer.id}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
            <span style={{ color: '#9ca3af' }}>Template</span>
            <span style={{ fontSize: '12px' }}>{TEMPLATES.find(t => t.key === selectedTemplate)?.label}</span>
          </div>
          {managedAddon > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ color: '#9ca3af' }}>{MANAGED_LEVELS.find(m => m.key === selectedManaged)?.label} (+{managedPct}%)</span>
              <span>£{managedAddon.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
            <span>VAT (20%)</span>
            <span>£{(totalIncVat - totalExVat).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, borderTop: '1px solid #1f2937', paddingTop: '10px', marginTop: '4px' }}>
            <span>Total</span>
            <span style={{ color: '#4ade80' }}>£{totalIncVat.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => setShowOrderModal(true)} disabled={ordering}
          style={{ width: '100%', height: '46px', background: ordering ? '#374151' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: ordering ? 'not-allowed' : 'pointer' }}>
          {ordering ? 'Processing...' : `Order ${tier.label} GPU — £${totalIncVat.toFixed(2)} inc VAT`}
        </button>
        <p style={{ fontSize: '11px', color: '#6b7280', textAlign: 'center', margin: '10px 0 0' }}>Charged from credit balance · Provisioned within 15 minutes</p>
      </div>
      {showOrderModal && (
        <ConfirmModal
          title={`GPU Compute — ${tier?.label}`}
          subtitle={`${tier?.desc} · ${selectedPeriod} billing`}
          price={totalIncVat}
          priceLabel={selectedPeriod}
          features={[
            `${tier?.vram} VRAM — ${tier?.desc}`,
            `Billing: ${selectedPeriod} (charged immediately)`,
            `Managed level: ${MANAGED_LEVELS.find(m => m.key === selectedManaged)?.label || 'Self-managed'}`,
            `Template: ${TEMPLATES.find(t => t.key === selectedTemplate)?.label || 'None'}`,
          ]}
          terms="GPU compute is charged immediately and non-refundable. Instances are provisioned within 2 hours."
          confirmLabel={ordering ? 'Processing...' : `Confirm Order · £${totalIncVat.toFixed(2)}`}
          loading={ordering}
          onConfirm={(pin) => handleOrder(pin)}
          onCancel={() => setShowOrderModal(false)}
        />
      )}
    </div>
  )
}
