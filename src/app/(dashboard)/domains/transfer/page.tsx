'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const NAMESERVERS = ['ns1.kleip4wordpress.co.uk', 'ns2.kleip4wordpress.co.uk', 'ns3.kleip4wordpress.co.uk', 'ns4.kleip4wordpress.co.uk']

const TLD_RULES: Record<string, { method: 'ips_tag' | 'epp'; steps: string[]; notes?: string; timeframe: string }> = {
  'co.uk': { method: 'ips_tag', steps: ['Log in to your current registrar', 'Find domain settings and locate the IPS Tag field', 'Change the IPS Tag to: STACK', 'Transfer completes automatically — no EPP code needed'], timeframe: 'Instant to 24 hours' },
  'uk':    { method: 'ips_tag', steps: ['Log in to your current registrar', 'Find the IPS Tag setting', 'Change it to: STACK'], timeframe: 'Instant to 24 hours' },
  'org.uk':{ method: 'ips_tag', steps: ['Change IPS Tag to STACK at your current registrar'], timeframe: 'Instant to 24 hours' },
  'me.uk': { method: 'ips_tag', steps: ['Change IPS Tag to STACK at your current registrar'], timeframe: 'Instant to 24 hours' },
  'ltd.uk':{ method: 'ips_tag', steps: ['Change IPS Tag to STACK at your current registrar'], timeframe: 'Instant to 24 hours' },
  'com': { method: 'epp', steps: ['Log in to your current registrar', 'Unlock the domain (disable Registrar Lock)', 'Temporarily disable WHOIS privacy', 'Request your EPP / Authorisation Code', 'Enter the EPP code below and submit', 'Approve the transfer confirmation email'], notes: 'Domain must be at least 60 days old. Approve transfer email within 5 days.', timeframe: '2-5 days' },
  'net': { method: 'epp', steps: ['Unlock domain', 'Get EPP code from registrar', 'Enter below and approve email'], timeframe: '2-5 days' },
  'org': { method: 'epp', steps: ['Unlock domain', 'Get EPP code from registrar', 'Enter below and approve email'], timeframe: '2-5 days' },
  'io':  { method: 'epp', steps: ['Unlock domain', 'Get EPP code from registrar', 'Enter below and approve email'], notes: '.io transfers may take longer than standard gTLDs.', timeframe: '5-7 days' },
  'co':  { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below and approve email'], timeframe: '2-5 days' },
  'me':  { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below and approve email'], timeframe: '2-5 days' },
  'info':{ method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below'], timeframe: '2-5 days' },
  'biz': { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below'], timeframe: '2-5 days' },
  'app': { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below'], timeframe: '2-5 days' },
  'dev': { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below'], timeframe: '2-5 days' },
  'ai':  { method: 'epp', steps: ['Unlock domain', 'Get EPP code', 'Enter below'], notes: '.ai domains may require additional verification.', timeframe: '5-10 days' },
}
const DEFAULT_RULE = { method: 'epp' as const, steps: ['Unlock domain at current registrar', 'Disable WHOIS privacy temporarily', 'Get EPP/Authorisation code', 'Enter below and approve transfer email'], notes: 'Domain must be at least 60 days old.', timeframe: '2-7 days' }

function getTldRule(domain: string) {
  const parts = domain.toLowerCase().replace(/^www\./, '').split('.')
  if (parts.length >= 3) {
    const two = parts.slice(-2).join('.')
    if (TLD_RULES[two]) return { tld: two, rule: TLD_RULES[two], isFree: TLD_RULES[two].method === 'ips_tag' }
  }
  const one = parts[parts.length - 1]
  if (TLD_RULES[one]) return { tld: one, rule: TLD_RULES[one], isFree: false }
  return { tld: parts.slice(1).join('.'), rule: DEFAULT_RULE, isFree: false }
}

type Tab = 'transfer' | 'dns'

export default function DomainTransferPage() {
  const [tab, setTab] = useState<Tab>('transfer')

  // Transfer tab state
  const [transferDomain, setTransferDomain] = useState('')
  const [eppCode, setEppCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [transferPrice, setTransferPrice] = useState<number | null>(null)

  // DNS tab state
  const [dnsDomain, setDnsDomain] = useState('')
  const [dnsDomainLocked, setDnsDomainLocked] = useState(false)
  const [packages, setPackages] = useState<any[]>([])
  const [selectedPkg, setSelectedPkg] = useState('')
  const [pkgIp, setPkgIp] = useState('185.151.30.190')
  const [loadingPkgs, setLoadingPkgs] = useState(false)

  const detected = transferDomain.includes('.') ? getTldRule(transferDomain) : null
  const rule = detected?.rule || null

  useEffect(() => {
    if (!detected?.tld) { setTransferPrice(null); return }
    fetch(`/api/catalogue/domains?tld=.${detected.tld}&type=domain_transfer`)
      .then(r => r.json()).then(d => setTransferPrice(d?.sell_price ?? null)).catch(() => setTransferPrice(null))
  }, [detected?.tld])

  useEffect(() => {
    if (tab !== 'dns') return
    setLoadingPkgs(true)
    fetch('/api/packages/list').then(r => r.json()).then(d => { setPackages(d.packages || []); setLoadingPkgs(false) }).catch(() => setLoadingPkgs(false))
  }, [tab])

  useEffect(() => {
    if (!selectedPkg) { setPkgIp('185.151.30.190'); return }
    fetch(`/api/packages/${selectedPkg}/web/info`).then(r => r.json()).then(d => setPkgIp(d?.ip || '185.151.30.190')).catch(() => {})
  }, [selectedPkg])

  async function handleTransfer() {
    if (!transferDomain) return
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/domains/transfer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: transferDomain, eppCode: eppCode || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Transfer request failed')
      setSuccess(`Transfer initiated for ${transferDomain}. ${rule?.method === 'ips_tag' ? 'Change your IPS tag to STACK at your current registrar.' : 'Check your email to approve the transfer.'}`)
    } catch (err: any) { setError(err.message) }
    setSubmitting(false)
  }

  const totalTransfer = transferPrice !== null ? Math.round(transferPrice * 1.20 * 100) / 100 : null

  const pkgTypeInfo: Record<string, { icon: string; color: string; bg: string; features: string[] }> = {
    windows:   { icon: '🪟', color: '#185fa5', bg: '#e8f0fe', features: ['IIS web server', 'ASP.NET support', 'MSSQL databases', 'Windows apps'] },
    wordpress: { icon: '🌐', color: '#21759b', bg: '#e8f4fb', features: ['WordPress optimised', 'WP-CLI access', 'Staging environment', 'Auto updates'] },
    linux:     { icon: '🐧', color: '#3b6d11', bg: '#eaf3de', features: ['PHP & MySQL', 'SSH access', 'Unlimited email', 'cPanel compatible'] },
    email:     { icon: '📧', color: '#854f0b', bg: '#faeeda', features: ['Professional email', '10GB mailbox', 'IMAP/POP3/SMTP', 'Webmail access'] },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link>
            <span>›</span><span>Transfer / Point domain</span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Use an existing domain</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Transfer your domain to us, or point it to your hosting without transferring.</p>
        </div>
        <Link href="/domains/search" className="gsws-btn">Register new domain</Link>
      </div>

      {success && <div style={{ padding: '16px', borderRadius: '8px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97', fontSize: '13px' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1', fontSize: '12px' }}>{error}</div>}

      {/* Tab switcher */}
      <div style={{ display: 'flex', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
        {([['transfer', '↗️ Transfer domain', 'Move ownership to us'], ['dns', '🌐 Point DNS only', 'Keep at registrar, point here']] as const).map(([t, label, desc]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ flex: 1, padding: '16px 20px', background: tab === t ? '#1a6ef5' : '#fff', color: tab === t ? '#fff' : '#0a0a0a', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', borderRight: t === 'transfer' ? '1px solid #ebebeb' : 'none' }}>
            <p style={{ fontSize: '13px', fontWeight: 700 }}>{label}</p>
            <p style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px' }}>{desc}</p>
          </button>
        ))}
      </div>

      {/* ===== TRANSFER TAB ===== */}
      {tab === 'transfer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Enter your domain name</h3>
            <input value={transferDomain} onChange={e => setTransferDomain(e.target.value.toLowerCase().trim())}
              placeholder="e.g. yourdomain.co.uk"
              style={{ width: '100%', height: '44px', border: '1.5px solid #d4d4d4', borderRadius: '8px', fontSize: '15px', padding: '0 14px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box', outline: 'none' }}
              onFocus={e => e.target.style.borderColor = '#1a6ef5'}
              onBlur={e => e.target.style.borderColor = '#d4d4d4'} />
          </div>

          {rule && (
            <div className="gsws-card" style={{ border: '1.5px solid #1a6ef5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>{rule.method === 'ips_tag' ? '🇬🇧' : '🔑'}</span>
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>How to transfer {transferDomain}</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Timeframe: {rule.timeframe}</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {rule.steps.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#1a6ef5', color: '#fff', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{i + 1}</div>
                    <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: '1.5', paddingTop: '2px' }}>{step}</p>
                  </div>
                ))}
              </div>

              {rule.notes && (
                <div style={{ background: '#faeeda', border: '1px solid #f5d08a', borderRadius: '6px', padding: '10px 12px', marginBottom: '16px', fontSize: '12px', color: '#854f0b' }}>
                  ℹ️ {rule.notes}
                </div>
              )}

              {rule.method === 'ips_tag' && (
                <div style={{ background: '#e8f0fe', border: '1px solid #b3c8f5', borderRadius: '8px', padding: '14px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '11px', color: '#5a5a5a', fontWeight: 500 }}>IPS Tag to set</p>
                    <p style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'ui-monospace, monospace', color: '#1a6ef5', letterSpacing: '3px' }}>STACK</p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#5a5a5a', lineHeight: '1.5' }}>Set this at your current registrar. The transfer happens automatically.</p>
                </div>
              )}

              {rule.method === 'epp' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>EPP / Authorisation Code</label>
                  <input value={eppCode} onChange={e => setEppCode(e.target.value.trim())} placeholder="Enter your EPP code (case sensitive)"
                    style={{ width: '100%', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box' }} />
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>EPP codes are case-sensitive. Copy and paste to avoid errors.</p>
                </div>
              )}

              <div style={{ background: 'var(--card-bg-elevated)', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                {transferPrice === 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', color: '#5a5a5a' }}>Transfer fee</span>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#3b6d11' }}>Free</span>
                  </div>
                ) : totalTransfer !== null ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: '#5a5a5a' }}>Transfer fee (ex. VAT)</span>
                      <span style={{ fontSize: '12px' }}>£{transferPrice?.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '12px', color: '#5a5a5a' }}>VAT (20%)</span>
                      <span style={{ fontSize: '12px' }}>£{((transferPrice || 0) * 0.20).toFixed(2)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #d4d4d4', paddingTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700 }}>Total (from credit)</span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#1a6ef5' }}>£{totalTransfer.toFixed(2)}</span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Includes 1 additional year of registration.</p>
                  </>
                ) : (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Transfer pricing will appear once domain is entered.</p>
                )}
              </div>

              <button onClick={handleTransfer} disabled={submitting || !transferDomain || (rule.method === 'epp' && !eppCode)}
                style={{ width: '100%', height: '42px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: (!transferDomain || (rule.method === 'epp' && !eppCode)) ? 0.5 : 1 }}>
                {submitting ? 'Submitting…' : rule.method === 'ips_tag' ? "I've changed the IPS tag — notify me when complete" : 'Initiate transfer →'}
              </button>
            </div>
          )}

          {!rule && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {[
                { icon: '🇬🇧', title: 'UK domains (.co.uk, .uk, .org.uk)', desc: 'Free transfer via IPS Tag change to STACK. No EPP code needed. Usually instant.', badge: 'Free · IPS Tag', bc: '#3b6d11', bb: '#eaf3de' },
                { icon: '🔑', title: 'Generic domains (.com, .net, .org)', desc: 'Requires EPP code. Unlock domain, get code from registrar, approve email. Takes 2-5 days.', badge: 'From £13.99 · EPP Code', bc: '#854f0b', bb: '#faeeda' },
                { icon: '🌍', title: 'Country codes (.io, .co, .me, .ai)', desc: 'Most require EPP codes. Transfer time and cost varies by registry.', badge: 'Varies · EPP Code', bc: '#185fa5', bb: '#e8f0fe' },
                { icon: '❓', title: 'Other TLDs', desc: 'Enter your domain above to see exact steps and pricing for your specific TLD.', badge: 'Enter domain above', bc: '#5a5a5a', bb: '#f7f7f7' },
              ].map(c => (
                <div key={c.title} className="gsws-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{c.icon}</span>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: c.bb, color: c.bc }}>{c.badge}</span>
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>{c.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===== DNS TAB ===== */}
      {tab === 'dns' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          <div className="gsws-card" style={{ background: '#e8f0fe', border: '1px solid #b3c8f5' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Point your domain without transferring</h3>
            <p style={{ fontSize: '13px', color: '#5a5a5a', lineHeight: '1.6' }}>Keep your domain at your current registrar and point it to your hosting here. Two methods — Nameservers (simplest) or A Records (keep existing DNS).</p>
            <div style={{ display: 'flex', gap: '16px', marginTop: '10px', flexWrap: 'wrap' }}>
              {['Free — no transfer fee', 'Domain stays at your registrar', 'Takes effect in 24-48 hours', 'SSL still works'].map(t => (
                <span key={t} style={{ fontSize: '12px', color: '#3b6d11', fontWeight: 600 }}>✓ {t}</span>
              ))}
            </div>
          </div>

          {/* Step 1 - Domain */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Step 1 — Enter the domain you want to point</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>The domain currently at your other registrar that you want to point here.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input value={dnsDomain} onChange={e => { setDnsDomain(e.target.value.toLowerCase().trim()); setDnsDomainLocked(false); setSelectedPkg('') }}
                placeholder="e.g. yourdomain.co.uk" disabled={dnsDomainLocked}
                style={{ flex: 1, height: '40px', border: `1.5px solid ${dnsDomainLocked ? '#3b6d11' : '#d4d4d4'}`, borderRadius: '8px', fontSize: '14px', padding: '0 14px', fontFamily: 'ui-monospace, monospace', boxSizing: 'border-box', background: dnsDomainLocked ? '#eaf3de' : '#fff', color: dnsDomainLocked ? '#3b6d11' : '#0a0a0a', outline: 'none' }} />
              {!dnsDomainLocked ? (
                <button onClick={() => { if (dnsDomain) setDnsDomainLocked(true) }} disabled={!dnsDomain}
                  style={{ height: '40px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: !dnsDomain ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: !dnsDomain ? 0.5 : 1 }}>
                  Confirm domain
                </button>
              ) : (
                <button onClick={() => { setDnsDomainLocked(false); setSelectedPkg('') }}
                  style={{ height: '40px', padding: '0 16px', background: 'var(--card-bg)', color: '#5a5a5a', border: '1px solid var(--card-border-hover)', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Change
                </button>
              )}
            </div>
            {dnsDomainLocked && (
              <p style={{ fontSize: '12px', color: '#3b6d11', marginTop: '8px', fontWeight: 600 }}>
                ✓ Configuring DNS for: <span style={{ fontFamily: 'ui-monospace, monospace' }}>{dnsDomain}</span>
              </p>
            )}
          </div>

          {/* Step 2 - Package cards */}
          {dnsDomainLocked && (
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Step 2 — Select your hosting package</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Choose the hosting package you want {dnsDomain} to point to.</p>
              {loadingPkgs ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Loading packages…</p>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {packages.map((p: any) => {
                    const info = pkgTypeInfo[p.type] || pkgTypeInfo['linux']
                    const selected = selectedPkg === p.id
                    return (
                      <div key={p.id} onClick={() => setSelectedPkg(p.id)}
                        style={{ border: `2px solid ${selected ? info.color : '#ebebeb'}`, borderRadius: '10px', padding: '16px', cursor: 'pointer', background: selected ? info.bg : '#fff', transition: 'all 0.15s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '20px' }}>{info.icon}</span>
                          <div>
                            <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>{p.label || p.type}</p>
                            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>{p.name}</p>
                          </div>
                        </div>
                        <ul style={{ margin: 0, padding: '0 0 0 14px', fontSize: '11px', color: '#5a5a5a', lineHeight: '1.8' }}>
                          {info.features.map((f: string) => <li key={f}>{f}</li>)}
                        </ul>
                        {selected && (
                          <div style={{ marginTop: '10px', padding: '4px 10px', background: info.color, borderRadius: '20px', display: 'inline-block' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>✓ Selected</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 3 - DNS method */}
          {dnsDomainLocked && selectedPkg && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Step 3 — Choose how to point your domain</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>Two options — nameservers is simpler and recommended.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { id: 'ns', label: 'Option A — Change Nameservers', recommended: true, desc: 'Simplest. Point your nameservers to ours and we manage all DNS automatically.', pro: 'We manage all DNS records', con: 'All DNS must be managed here' },
                    { id: 'a', label: 'Option B — Update A Records only', recommended: false, desc: 'Keep your existing DNS at your registrar and just point the website IP here.', pro: 'Keep email and other DNS elsewhere', con: 'Manual DNS management required' },
                  ].map(opt => (
                    <div key={opt.id} style={{ border: `2px solid ${opt.recommended ? '#1a6ef5' : '#ebebeb'}`, borderRadius: '10px', padding: '16px', background: opt.recommended ? '#f0f5ff' : '#fff' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{opt.label}</p>
                        {opt.recommended && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#1a6ef5', color: '#fff' }}>Recommended</span>}
                      </div>
                      <p style={{ fontSize: '12px', color: '#5a5a5a', lineHeight: '1.5', marginBottom: '8px' }}>{opt.desc}</p>
                      <p style={{ fontSize: '11px', color: '#3b6d11' }}>✓ {opt.pro}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>⚠ {opt.con}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Option A - Nameservers */}
              <div className="gsws-card">
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>⭐ Option A — Set these Nameservers at your registrar</h4>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'var(--card-bg-elevated)', borderBottom: '1px solid var(--card-border)' }}>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#5a5a5a' }}>#</th>
                        <th style={{ padding: '8px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#5a5a5a' }}>Nameserver</th>
                      </tr>
                    </thead>
                    <tbody>
                      {NAMESERVERS.map((ns, i) => (
                        <tr key={ns} style={{ borderBottom: i < NAMESERVERS.length - 1 ? '1px solid #ebebeb' : 'none' }}>
                          <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>NS{i + 1}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: 700, color: '#1a6ef5' }}>{ns}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: '#eaf3de', border: '1px solid #c0dd97', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#3b6d11' }}>
                  ✓ Once nameservers are updated, all DNS for {dnsDomain} will be managed through your hosting package automatically.
                </div>
              </div>

              {/* Option B - A Records */}
              <div className="gsws-card">
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '10px' }}>Option B — Add these A Records at your registrar</h4>
                <div style={{ border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: 'var(--card-bg-elevated)', borderBottom: '1px solid var(--card-border)' }}>
                        {['Type', 'Name / Host', 'Value / Points to', 'TTL'].map(h => (
                          <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#5a5a5a' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { type: 'A', name: '@', value: pkgIp, ttl: '3600' },
                        { type: 'A', name: 'www', value: pkgIp, ttl: '3600' },
                        { type: 'CNAME', name: 'ftp', value: 'ftp.gb.stackcp.com', ttl: '3600' },
                      ].map((r, i) => (
                        <tr key={i} style={{ borderBottom: i < 2 ? '1px solid #ebebeb' : 'none' }}>
                          <td style={{ padding: '10px 12px' }}>
                            <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: r.type === 'A' ? '#e8f0fe' : '#f7f7f7', color: r.type === 'A' ? '#1a6ef5' : '#5a5a5a', fontFamily: 'ui-monospace, monospace' }}>{r.type}</span>
                          </td>
                          <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontWeight: 600 }}>{r.name}</td>
                          <td style={{ padding: '10px 12px', fontFamily: 'ui-monospace, monospace', color: '#1a6ef5', fontWeight: 600 }}>{r.value}</td>
                          <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{r.ttl}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div style={{ background: '#faeeda', border: '1px solid #f5d08a', borderRadius: '6px', padding: '10px 12px', fontSize: '12px', color: '#854f0b' }}>
                  ⚠️ Do not change MX records if you use email at this domain. DNS propagation takes 24-48 hours.
                </div>
              </div>

              {/* Step 4 - Add to package */}
              <div className="gsws-card">
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Step 4 — Add {dnsDomain} to your hosting package</h4>
                <p style={{ fontSize: '12px', color: '#5a5a5a', lineHeight: '1.6', marginBottom: '12px' }}>
                  After updating DNS, add {dnsDomain} to your hosting package so our servers know to serve it. Go to your package DNS settings and add it as a domain alias. Your site will be accessible immediately via a temporary URL while DNS propagates.
                </p>
                <Link href={`/packages/${selectedPkg}/dns`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
                  Add domain to package →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--card-bg-elevated)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        ℹ️ Need help? <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>Contact our support team</a> — we can assist with domain transfers and DNS configuration.
      </div>
    </div>
  )
}
