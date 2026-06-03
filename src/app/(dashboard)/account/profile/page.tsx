'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [topups, setTopups] = useState<any[]>([])
  const [stats, setStats] = useState({ packageCount: 0, domainCount: 0 })
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({ name: '', first_name: '', last_name: '' })

  useEffect(() => {
    fetch('/api/account/profile')
      .then(r => r.json())
      .then(d => {
        setUser(d.user)
        setTopups(d.topups || [])
        setStats({ packageCount: d.packageCount, domainCount: d.domainCount })
        setForm({ name: d.user.name || '', first_name: d.user.first_name || '', last_name: d.user.last_name || '' })
        setLoading(false)
      })
  }, [])

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      setUser((u: any) => ({ ...u, ...form }))
      setSuccess('Profile updated')
      setEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    }
    setSaving(false)
  }

  if (loading) return (
    <div style={{ padding: '48px', textAlign: 'center', color: '#9a9a9a', fontSize: '13px' }}>Loading…</div>
  )

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
          <Link href="/dashboard" style={{ color: '#1a6ef5' }}>Dashboard</Link> › Account
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Account & profile</h1>
        <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Manage your GeiG SWS account details.</p>
      </div>

      {success && (
        <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>
          ✓ {success}
        </div>
      )}

      {/* Profile card */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#1a6ef5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#0a0a0a' }}>{user?.name}</p>
              <p style={{ fontSize: '13px', color: '#9a9a9a' }}>{user?.email}</p>
              <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '2px' }}>
                Member since {new Date(user?.created_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            style={{ height: '32px', padding: '0 16px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: '#fff', fontFamily: 'inherit', color: '#0a0a0a' }}>
            {editing ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>First name</label>
                <input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 500, color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Last name</label>
                <input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Display name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ width: '100%', height: '36px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleSave} disabled={saving}
                style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            {[
              ['Email', user?.email],
              ['Display name', user?.name],
              ['First name', user?.first_name || '—'],
              ['Last name', user?.last_name || '—'],
              ['Account role', user?.role],
              ['WP user ID', `#${user?.wp_user_id}`],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid #ebebeb', display: 'flex', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#9a9a9a', width: '120px', flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#0a0a0a' }}>{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          { label: 'Account credit', value: `£${Number(user?.credit_balance || 0).toFixed(2)}`, sub: 'Available balance', href: '/account/topup', cta: 'Top up' },
          { label: 'Domains', value: stats.domainCount, sub: 'Registered domains', href: '/domains', cta: 'Manage' },
          { label: 'Packages', value: stats.packageCount, sub: 'Hosting packages', href: '/packages', cta: 'Manage' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '16px 20px' }}>
            <p style={{ fontSize: '11px', color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{s.label}</p>
            <p style={{ fontSize: '24px', fontWeight: 700, color: '#0a0a0a', letterSpacing: '-0.5px', lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: '11px', color: '#9a9a9a', marginTop: '4px', marginBottom: '12px' }}>{s.sub}</p>
            <Link href={s.href} style={{ fontSize: '12px', color: '#1a6ef5', fontWeight: 500, textDecoration: 'none' }}>{s.cta} →</Link>
          </div>
        ))}
      </div>

      {/* Credit history */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Credit history</h2>
          <Link href="/account/topup"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '30px', padding: '0 14px', background: '#1a6ef5', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
            + Top up credit
          </Link>
        </div>
        {topups.length === 0 ? (
          <p style={{ fontSize: '13px', color: '#9a9a9a', textAlign: 'center', padding: '24px 0' }}>No credit history yet.</p>
        ) : (
          <table className="gsws-table">
            <thead>
              <tr><th>Amount</th><th>Reference</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {topups.map((t: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontWeight: 700, color: '#3b6d11', fontSize: '14px' }}>+£{Number(t.amount).toFixed(2)}</td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#9a9a9a' }}>{t.reference}</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: t.status === 'completed' ? '#eaf3de' : '#faeeda', color: t.status === 'completed' ? '#3b6d11' : '#854f0b' }}>{t.status}</span></td>
                  <td style={{ fontSize: '12px', color: '#9a9a9a' }}>{new Date(t.created_at).toLocaleDateString('en-GB')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        {[
          { label: 'Statement', desc: 'Full transaction history and balance', href: '/account/statement', icon: '📄' },
          { label: 'Renewals', desc: 'Manage service renewals and auto-renew', href: '/renewals', icon: '🔄' },
          { label: 'Team members', desc: 'Invite and manage sub-users', href: '/account/members', icon: '👥' },
          { label: 'Activity log', desc: 'View all account actions and sessions', href: '/account/activity', icon: '📋' },
          { label: 'Top up credit', desc: 'Add credit to your account', href: '/account/topup', icon: '💳' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', background: '#fff', border: '1px solid #ebebeb', borderRadius: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '20px' }}>{l.icon}</span>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>{l.label}</p>
              <p style={{ fontSize: '11px', color: '#9a9a9a' }}>{l.desc}</p>
            </div>
          </Link>
        ))}
      </div>

    </div>
  )
}
