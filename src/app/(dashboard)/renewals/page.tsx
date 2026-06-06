'use client'
import React, { useState, useEffect } from 'react'
import Link from 'next/link'

const TYPE_ICONS: Record<string, React.ReactNode> = {
  domain: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  hosting: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>,
  vps: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg>,
  gpu: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>,
  managed: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
}
const TYPE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  domain:  { label: 'Domain', color: '#1d4ed8', bg: '#eff6ff', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  hosting: { label: 'Hosting', color: '#6d28d9', bg: '#f5f3ff', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg> },
  vps:     { label: 'VPS', color: '#15803d', bg: '#f0fdf4', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/></svg> },
  gpu:     { label: 'GPU', color: '#b45309', bg: '#fffbeb', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3"/></svg> },
  managed: { label: 'Managed', color: '#0e7490', bg: '#ecfeff', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> },
}

const URGENCY_INFO: Record<string, { label: string; color: string; bg: string }> = {
  ok:       { label: 'Active',   color: '#3b6d11', bg: '#eaf3de' },
  warning:  { label: 'Due soon', color: '#854f0b', bg: '#faeeda' },
  critical: { label: 'Due soon', color: '#a32d2d', bg: '#fcebeb' },
  overdue:  { label: 'Overdue',  color: '#fff',    bg: '#a32d2d' },
}

export default function RenewalsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [toggling, setToggling] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/renewals').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  async function toggleAutoRenew(id: number, current: number) {
    setToggling(id)
    await fetch('/api/renewals', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, auto_renew: !current }),
    })
    setData((d: any) => ({
      ...d,
      renewals: d.renewals.map((r: any) => r.id === id ? { ...r, auto_renew: current ? 0 : 1 } : r)
    }))
    setToggling(null)
  }

  const renewals = data?.renewals || []
  const filtered = filter === 'all' ? renewals : filter === 'due' 
    ? renewals.filter((r: any) => r.daysLeft >= 0 && r.daysLeft <= 30)
    : renewals.filter((r: any) => r.urgency === filter)

  const stats = data?.stats || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Renewals</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Manage renewal settings for all your services. Auto-renew charges your credit balance.</p>
        </div>
        <Link href="/account/topup"
          style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          💳 Top up credit
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Total services', value: stats.total || 0, icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><rect x='2' y='2' width='20' height='8' rx='2'/><rect x='2' y='14' width='20' height='8' rx='2'/><path d='M6 6h.01M6 18h.01'/></svg>, color: '#185fa5', bg: '#e8f0fe' },
          { label: 'Due this month', value: stats.dueThisMonth || 0, icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/></svg>, color: '#854f0b', bg: '#faeeda' },
          { label: 'Overdue', value: stats.overdue || 0, icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><path d='M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z'/><line x1='12' y1='9' x2='12' y2='13'/><line x1='12' y1='17' x2='12.01' y2='17'/></svg>, color: '#a32d2d', bg: '#fcebeb' },
          { label: 'Annual cost', value: `£${((stats.monthlyTotal || 0) * 12).toFixed(2)}`, icon: <svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' strokeLinecap='round' strokeLinejoin='round'><line x1='12' y1='1' x2='12' y2='23'/><path d='M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6'/></svg>, color: '#3b6d11', bg: '#eaf3de' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px', borderRadius: '10px', background: s.bg }}>
            <span style={{ fontSize: '18px' }}>{s.icon}</span>
            <p style={{ fontSize: '11px', color: '#5a5a5a', fontWeight: 500, marginTop: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Timeline info */}
      <div className="gsws-card" style={{ background: '#f0f5ff', border: '1px solid #b3c8f5' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', marginBottom: '10px' }}>📅 Renewal timeline</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { day: '30 days before', label: 'Reminder sent', desc: 'Email + notification sent', color: '#185fa5', bg: '#e8f0fe' },
            { day: '7 days before', label: 'Final reminder', desc: 'Urgent reminder sent', color: '#854f0b', bg: '#faeeda' },
            { day: 'Expiry date', label: 'Auto-renew', desc: 'Credit charged if auto-renew on', color: '#3b6d11', bg: '#eaf3de' },
            { day: '30 days after', label: 'Suspension', desc: 'Service suspended if unpaid', color: '#a32d2d', bg: '#fcebeb' },
          ].map(t => (
            <div key={t.day} style={{ padding: '12px', borderRadius: '8px', background: t.bg }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: t.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>{t.day}</p>
              <p style={{ fontSize: '12px', fontWeight: 700, color: '#0a0a0a' }}>{t.label}</p>
              <p style={{ fontSize: '11px', color: '#5a5a5a', marginTop: '2px', lineHeight: 1.4 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {[
          { value: 'all', label: 'All services' },
          { value: 'due', label: 'Due this month' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'warning', label: 'Due in 30 days' },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            style={{ height: '32px', padding: '0 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filter === f.value ? '#1a6ef5' : '#d4d4d4'}`, background: filter === f.value ? '#1a6ef5' : '#fff', color: filter === f.value ? '#fff' : '#5a5a5a' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Renewals list */}
      {loading ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px', color: '#9a9a9a', fontSize: '13px' }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '10px' }}>✅</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>All clear</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>No renewals in this category.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((r: any) => {
            const typeInfo = TYPE_INFO[r.resource_type] || { icon: <svg width='15' height='15' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5'><rect x='2' y='2' width='20' height='20' rx='2'/></svg>, label: 'Service', color: '#555', bg: '#f7f7f7' }
            const urgInfo = URGENCY_INFO[r.urgency] || URGENCY_INFO.ok
            const daysText = r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} days overdue` : r.daysLeft === 0 ? 'Expires today' : `${r.daysLeft} days left`
            return (
              <div key={r.id} className="gsws-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', border: r.urgency === 'overdue' ? '1.5px solid #ef4444' : r.urgency === 'critical' ? '1.5px solid #f59e0b' : '1px solid #ebebeb' }}>
                {/* Icon */}
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f7f7f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px' }}>
                  {typeInfo.icon}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <p style={{ fontSize: '13px', fontWeight: 700, color: '#0a0a0a', fontFamily: r.resource_type === 'domain' ? 'ui-monospace, monospace' : 'inherit' }}>{r.resource_name}</p>
                    <span style={{ padding: '2px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 600, background: urgInfo.bg, color: urgInfo.color }}>{urgInfo.label}</span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{typeInfo.label} · {r.plan_name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                    <p style={{ fontSize: '11px', color: r.daysLeft < 0 ? '#a32d2d' : r.daysLeft <= 7 ? '#854f0b' : '#5a5a5a', fontWeight: r.daysLeft <= 30 ? 600 : 400 }}>
                      {daysText} · {new Date(r.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Price */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#0a0a0a' }}>£{(r.renewal_price_inc_vat || 0).toFixed(2)}</p>
                  <p style={{ fontSize: '10px', color: '#9a9a9a' }}>inc VAT / year</p>
                </div>

                {/* Auto-renew toggle */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <button onClick={() => toggleAutoRenew(r.id, r.auto_renew)} disabled={toggling === r.id}
                    style={{ width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer', background: r.auto_renew ? '#1a6ef5' : '#d4d4d4', position: 'relative', transition: 'background 0.2s', opacity: toggling === r.id ? 0.5 : 1 }}>
                    <span style={{ position: 'absolute', top: '2px', left: r.auto_renew ? '22px' : '2px', width: '20px', height: '20px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                  <p style={{ fontSize: '9px', color: '#9a9a9a', fontWeight: 500 }}>{r.auto_renew ? 'AUTO' : 'MANUAL'}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding: '12px 16px', background: '#f7f7f7', borderRadius: '8px', fontSize: '12px', color: '#9a9a9a', lineHeight: 1.6 }}>
        ℹ️ <strong style={{ color: '#5a5a5a' }}>Auto-renew</strong> charges your credit balance on the renewal date. Ensure you have sufficient credit to avoid service interruption. Services suspended after 30 days of non-payment are permanently deleted after a further 30 days. For renewal assistance contact <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>
      </div>
    </div>
  )
}
