'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ROLE_INFO: Record<string, { label: string; desc: string; color: string; bg: string }> = {
  admin:   { label: 'Admin',   desc: 'Full access to all packages and billing', color: '#a32d2d', bg: '#fcebeb' },
  billing: { label: 'Billing', desc: 'Can view statements and top up credit',   color: '#854f0b', bg: '#faeeda' },
  viewer:  { label: 'Viewer',  desc: 'Read-only access to packages',            color: '#185fa5', bg: '#e8f0fe' },
}

export default function MembersPage() {
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState('viewer')
  const [inviting, setInviting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { loadMembers() }, [])

  function loadMembers() {
    fetch('/api/account/members').then(r => r.json()).then(d => { setMembers(d.members || []); setLoading(false) })
  }

  async function handleInvite() {
    if (!inviteEmail) return
    setInviting(true); setError('')
    try {
      const res = await fetch('/api/account/members', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, name: inviteName, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSuccess(`Invitation sent to ${inviteEmail}`)
      setShowInvite(false); setInviteEmail(''); setInviteName(''); setInviteRole('viewer')
      loadMembers()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) { setError(err.message) }
    setInviting(false)
  }

  async function handleRemove(memberId: number, email: string) {
    if (!confirm(`Remove ${email} from your team?`)) return
    await fetch('/api/account/members', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId }) })
    loadMembers()
  }

  async function handleRoleChange(memberId: number, role: string) {
    await fetch('/api/account/members', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, role }) })
    loadMembers()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <Link href="/account/profile" style={{ color: '#1a6ef5' }}>Account</Link> › Team members
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Team members</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Invite team members to access your hosting account.</p>
        </div>
        <button onClick={() => setShowInvite(s => !s)}
          style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          + Invite member
        </button>
      </div>

      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97', fontSize: '13px' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1', fontSize: '12px' }}>{error}</div>}

      {/* Invite form */}
      {showInvite && (
        <div className="gsws-card" style={{ border: '1.5px solid #1a6ef5' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>Invite a team member</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
            <div className="gsws-grid-2col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Email address *</label>
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} type="email" placeholder="colleague@example.com"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#5a5a5a', display: 'block', marginBottom: '4px' }}>Full name</label>
                <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="John Smith"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: '#5a5a5a', display: 'block', marginBottom: '8px' }}>Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {Object.entries(ROLE_INFO).map(([role, info]) => (
                  <div key={role} onClick={() => setInviteRole(role)}
                    style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', border: `2px solid ${inviteRole === role ? info.color : '#ebebeb'}`, background: inviteRole === role ? info.bg : '#fff' }}>
                    <p style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{info.label}</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{info.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleInvite} disabled={inviting || !inviteEmail}
              style={{ height: '34px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !inviteEmail ? 0.5 : 1 }}>
              {inviting ? 'Sending…' : 'Send invitation'}
            </button>
            <button onClick={() => setShowInvite(false)}
              style={{ height: '34px', padding: '0 14px', background: 'var(--card-bg)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Role legend */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {Object.entries(ROLE_INFO).map(([role, info]) => (
          <div key={role} style={{ padding: '12px 14px', borderRadius: '8px', background: info.bg, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.6)', color: info.color, flexShrink: 0 }}>{info.label}</span>
            <p style={{ fontSize: '11px', color: '#5a5a5a', lineHeight: 1.5 }}>{info.desc}</p>
          </div>
        ))}
      </div>

      {/* Members list */}
      {loading ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading…</div>
      ) : members.length === 0 ? (
        <div className="gsws-card" style={{ textAlign: 'center', padding: '48px' }}>
          <p style={{ fontSize: '32px', marginBottom: '10px' }}>👥</p>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>No team members yet</p>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Invite colleagues to collaborate on your account.</p>
        </div>
      ) : (
        <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="gsws-table">
            <thead>
              <tr><th>Member</th><th>Role</th><th>Status</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              {members.map((m: any) => {
                const info = ROLE_INFO[m.role] || ROLE_INFO.viewer
                return (
                  <tr key={m.id}>
                    <td>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{m.name || m.user_name || 'Invited user'}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{m.email}</p>
                    </td>
                    <td>
                      <select value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)}
                        style={{ height: '28px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', padding: '0 6px', fontFamily: 'inherit', background: info.bg, color: info.color, fontWeight: 600 }}>
                        {Object.entries(ROLE_INFO).map(([r, ri]) => <option key={r} value={r}>{ri.label}</option>)}
                      </select>
                    </td>
                    <td>
                      <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: m.status === 'active' ? '#eaf3de' : m.status === 'pending' ? '#faeeda' : '#fcebeb', color: m.status === 'active' ? '#3b6d11' : m.status === 'pending' ? '#854f0b' : '#a32d2d' }}>
                        {m.status === 'pending' ? '⏳ Pending' : m.status === 'active' ? '✓ Active' : '✗ Suspended'}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {m.accepted_at ? new Date(m.accepted_at).toLocaleDateString('en-GB') : `Invited ${new Date(m.invited_at).toLocaleDateString('en-GB')}`}
                    </td>
                    <td>
                      <button onClick={() => handleRemove(m.id, m.email)}
                        style={{ padding: '0 10px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--card-bg-elevated)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
        ℹ️ Invited members will receive an email with a link to join your account. Members with Admin role can manage packages and invite others. Billing role can view statements and top up credit.
      </div>
    </div>
  )
}
