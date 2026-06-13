'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

function IconDomain() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> }
function IconHosting() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> }
function IconVPS() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg> }
function IconGPU() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3"/></svg> }
function IconBox() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2"/></svg> }
function IconClock() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> }
function IconAlert() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> }
function IconMoney() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }

const TYPE_META: Record<string, { label: string; color: string; bg: string; Icon: () => React.ReactElement }> = {
  domain:  { label: 'Domain',  color: '#1d4ed8', bg: '#eff6ff', Icon: IconDomain },
  hosting: { label: 'Hosting', color: '#6d28d9', bg: '#f5f3ff', Icon: IconHosting },
  vps:     { label: 'VPS',     color: '#15803d', bg: '#f0fdf4', Icon: IconVPS },
  gpu:     { label: 'GPU',     color: '#b45309', bg: '#fffbeb', Icon: IconGPU },
}

const URGENCY_INFO: Record<string, { label: string; color: string; bg: string }> = {
  ok:       { label: 'Active',   color: '#3b6d11', bg: '#eaf3de' },
  warning:  { label: 'Due soon', color: '#854f0b', bg: '#faeeda' },
  critical: { label: 'Due soon', color: '#a32d2d', bg: '#fcebeb' },
  overdue:  { label: 'Overdue',  color: 'var(--card-bg)',    bg: '#a32d2d' },
}

export default function RenewalsPage() {
  const [renewals, setRenewals] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch('/api/renewals').then(r => r.json()).then(d => {
      setRenewals(d.renewals || [])
      setStats(d.stats || {})
    }).finally(() => setLoading(false))
  }, [])

  async function toggleAutoRenew(id: number, current: boolean) {
    await fetch('/api/renewals', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, auto_renew: !current }) })
    setRenewals(prev => prev.map(r => r.id === id ? { ...r, auto_renew: !current ? 1 : 0 } : r))
  }

  function getUrgency(r: any) {
    if (r.daysLeft < 0) return 'overdue'
    if (r.daysLeft <= 7) return 'critical'
    if (r.daysLeft <= 30) return 'warning'
    return 'ok'
  }

  const filtered = renewals.filter(r => {
    if (filter === 'due') return r.daysLeft <= 30 && r.daysLeft >= 0
    if (filter === 'overdue') return r.daysLeft < 0
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Account</p>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', margin: 0 }}>Renewals</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Manage renewal settings for all your services. Auto-renew charges your credit balance.</p>
        </div>
        <Link href="/account/topup" style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', height: '38px', padding: '0 18px', background: '#0a0a0a', color: 'var(--card-bg)', borderRadius: '9px', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}>
          <IconMoney /> Top up credit
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {[
          { label: 'TOTAL SERVICES', value: stats.total || 0, Icon: IconVPS, color: '#185fa5', bg: '#e8f0fe' },
          { label: 'DUE THIS MONTH', value: stats.dueThisMonth || 0, Icon: IconClock, color: '#854f0b', bg: '#faeeda' },
          { label: 'OVERDUE', value: stats.overdue || 0, Icon: IconAlert, color: '#a32d2d', bg: '#fcebeb' },
          { label: 'ANNUAL COST', value: `£${((stats.monthlyTotal || 0) * 12).toFixed(2)}`, Icon: IconMoney, color: '#3b6d11', bg: '#eaf3de' },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
              <div style={{ width: '26px', height: '26px', background: bg, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}><Icon /></div>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>{label}</p>
            </div>
            <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '16px 20px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '12px' }}>Renewal timeline</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
          {[
            { period: '30 DAYS BEFORE', title: 'Reminder sent', desc: 'Email + notification sent', color: '#185fa5' },
            { period: '7 DAYS BEFORE', title: 'Final reminder', desc: 'Urgent reminder sent', color: '#854f0b' },
            { period: 'EXPIRY DATE', title: 'Auto-renew', desc: 'Credit charged if auto-renew on', color: '#3b6d11' },
            { period: '30 DAYS AFTER', title: 'Suspension', desc: 'Service suspended if unpaid', color: '#a32d2d' },
          ].map(({ period, title, desc, color }) => (
            <div key={period} style={{ borderRight: '1px solid var(--card-border)', paddingRight: '16px', marginRight: '16px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color, marginBottom: '4px' }}>{period}</p>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{title}</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[['all', 'All services'], ['due', 'Due this month'], ['overdue', 'Overdue']].map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ height: '32px', padding: '0 14px', background: filter === key ? '#0a0a0a' : 'var(--card-bg-elevated)', color: filter === key ? 'var(--page-bg)' : 'var(--text-tertiary)', border: `1px solid ${filter === key ? '#0a0a0a' : 'var(--card-border-hover)'}`, borderRadius: '7px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Renewals list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.map((r: any) => {
            const meta = TYPE_META[r.resource_type] || { label: 'Service', color: 'var(--text-tertiary)', bg: 'var(--card-bg-elevated)', Icon: IconBox }
            const urgency = getUrgency(r)
            const urg = URGENCY_INFO[urgency]
            const Icon = meta.Icon

            return (
              <div key={r.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Icon */}
                <div style={{ width: '36px', height: '36px', background: meta.bg, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color, flexShrink: 0 }}>
                  <Icon />
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{r.resource_name}</p>
                    <span style={{ padding: '1px 7px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: urg.bg, color: urg.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{urg.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {meta.label} · {r.plan_name}
                  </p>
                  <p style={{ fontSize: '11px', color: r.daysLeft < 7 ? '#a32d2d' : '#9a9a9a', marginTop: '1px', fontFamily: "'DM Mono', monospace" }}>
                    {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} days overdue` : `${r.daysLeft} days left`} · {r.expires_at}
                  </p>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0, marginRight: '16px' }}>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>£{(r.renewal_price_inc_vat || 0).toFixed(2)}</p>
                  <p style={{ fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>inc VAT / {r.billing_period || 'year'}</p>
                </div>

                {/* Auto-renew toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <button onClick={() => toggleAutoRenew(r.id, !!r.auto_renew)}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: r.auto_renew ? '#0a0a0a' : 'var(--card-border-hover)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: '3px', left: r.auto_renew ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: 'var(--card-bg)', transition: 'left 0.2s', display: 'block' }} />
                  </button>
                  <p style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>AUTO</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer note */}
      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        Auto-renew charges your credit balance on the renewal date. Ensure you have sufficient credit to avoid service interruption.
        Services suspended after 30 days of non-payment are permanently deleted after a further 30 days.
        For renewal assistance contact <a href="mailto:support@geig.co.uk" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>support@geig.co.uk</a>.
      </p>
    </div>
  )
}
