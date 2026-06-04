'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SessionUser {
  id: number
  email: string
  name: string
  role: string
  creditBalance: number
}

interface Notification {
  id: number
  type: string
  title: string
  message: string
  link?: string
  read: number
  created_at: string
}

const NOTIF_TYPE_INFO: Record<string, { icon: string; color: string }> = {
  renewal:      { icon: '🔄', color: '#854f0b' },
  low_credit:   { icon: '💳', color: '#a32d2d' },
  domain_expiry:{ icon: '🌐', color: '#854f0b' },
  package:      { icon: '📦', color: '#185fa5' },
  system:       { icon: 'ℹ️', color: '#185fa5' },
  transfer:     { icon: '↗️', color: '#534ab7' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Topbar() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [open, setOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); else window.location.href = '/login' })
      .catch(() => {})
    loadNotifications()
    // Poll every 60s
    const interval = setInterval(loadNotifications, 60000)
    return () => clearInterval(interval)
  }, [])

  function loadNotifications() {
    fetch('/api/notifications')
      .then(r => r.json())
      .then(d => { setNotifications(d.notifications || []); setUnreadCount(d.unreadCount || 0) })
      .catch(() => {})
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false)
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  async function markAllRead() {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ readAll: true }) })
    setNotifications(n => n.map(x => ({ ...x, read: 1 })))
    setUnreadCount(0)
  }

  async function markRead(id: number) {
    await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: 1 } : x))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  async function deleteNotif(id: number, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch('/api/notifications', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setNotifications(n => n.filter(x => x.id !== id))
    setUnreadCount(c => Math.max(0, c - 1))
  }

  function handleNotifClick(n: Notification) {
    if (!n.read) markRead(n.id)
    setBellOpen(false)
    if (n.link) router.push(n.link)
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isMember = (user as any)?.isMember
  const memberRole = (user as any)?.memberRole
  const ownerEmail = (user as any)?.ownerEmail

  return (
    <div>
    {isMember && (
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, height: '26px', background: '#0a1628', borderBottom: '1px solid #1a3060', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <span style={{ fontSize: '11px', color: '#aaa' }}>
          👥 Viewing <strong style={{ color: '#fff' }}>{ownerEmail}</strong> as
          <span style={{ marginLeft: '5px', padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: memberRole === 'admin' ? '#1a6ef5' : memberRole === 'billing' ? '#854f0b' : '#3a3a3a', color: '#fff' }}>{memberRole}</span>
        </span>
      </div>
    )}
    <header style={{ position: 'fixed', top: isMember ? '26px' : 0, left: 0, right: 0, zIndex: 50, height: '52px',
      display: 'flex', alignItems: 'center',
      background: 'var(--g-topbar-bg)', borderBottom: '1px solid var(--g-topbar-border)',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px', width: '232px', height: '100%', flexShrink: 0, borderRight: '1px solid var(--g-topbar-border)' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: '13px', fontWeight: 900, color: '#000', lineHeight: 1 }}>G</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff', letterSpacing: '0.5px' }}>GeiG</span>
          <span style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '1.5px', marginTop: '2px' }}>Simple Web Service</span>
        </div>
      </div>

      {/* Search */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '32px', padding: '0 12px', borderRadius: '6px', background: '#1a1a1a', border: '1px solid #2a2a2a', maxWidth: '320px', width: '100%' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input type="text" placeholder="Search packages, domains…"
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '12px', color: '#aaa', width: '100%', fontFamily: 'inherit' }} />
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px' }}>
        {/* Credit balance */}
        {user && (
          <Link href="/account/topup" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', height: '28px', borderRadius: '6px', background: '#0a1628', border: '1px solid #1a3060', color: '#5599ff', textDecoration: 'none', fontSize: '12px', fontWeight: 500 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            £{Number(user.creditBalance).toFixed(2)}
          </Link>
        )}

        <span style={{ fontSize: '11px', color: '#555' }}>sws.geig.co.uk</span>

        {/* Bell */}
        <div ref={bellRef} style={{ position: 'relative' }}>
          <button onClick={() => setBellOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: unreadCount > 0 ? '#f59e0b' : '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRadius: '6px' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: '0px', right: '0px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', color: '#fff', fontSize: '9px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div style={{ position: 'absolute', right: '-8px', top: '38px', width: '340px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', zIndex: 100 }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>Notifications</p>
                  {unreadCount > 0 && (
                    <span style={{ padding: '1px 7px', borderRadius: '20px', fontSize: '10px', fontWeight: 700, background: '#ef4444', color: '#fff' }}>{unreadCount}</span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: '11px', color: '#5599ff', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px', textAlign: 'center' }}>
                    <p style={{ fontSize: '24px', marginBottom: '8px' }}>🔔</p>
                    <p style={{ fontSize: '12px', color: '#666' }}>No notifications</p>
                  </div>
                ) : (
                  notifications.map((n, i) => {
                    const info = NOTIF_TYPE_INFO[n.type] || { icon: '📢', color: '#5a5a5a' }
                    return (
                      <div key={n.id} onClick={() => handleNotifClick(n)}
                        style={{ padding: '12px 16px', borderBottom: i < notifications.length - 1 ? '1px solid #1e1e1e' : 'none', cursor: n.link ? 'pointer' : 'default', background: n.read ? 'transparent' : 'rgba(26,110,245,0.06)', display: 'flex', gap: '10px', alignItems: 'flex-start', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#222')}
                        onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(26,110,245,0.06)')}>
                        <span style={{ fontSize: '16px', flexShrink: 0, marginTop: '1px' }}>{info.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                            <p style={{ fontSize: '12px', fontWeight: n.read ? 400 : 600, color: n.read ? '#aaa' : '#fff', lineHeight: 1.3 }}>{n.title}</p>
                            {!n.read && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1a6ef5', flexShrink: 0, marginTop: '3px' }} />}
                          </div>
                          <p style={{ fontSize: '11px', color: '#666', marginTop: '3px', lineHeight: 1.4 }}>{n.message}</p>
                          <p style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{timeAgo(n.created_at)}</p>
                        </div>
                        <button onClick={e => deleteNotif(n.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#444', fontSize: '14px', padding: '0', flexShrink: 0, lineHeight: 1 }}
                          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                          onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                          ×
                        </button>
                      </div>
                    )
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #2a2a2a', display: 'flex', justifyContent: 'center' }}>
                  <Link href="/account/activity" onClick={() => setBellOpen(false)}
                    style={{ fontSize: '11px', color: '#5599ff', textDecoration: 'none' }}>
                    View full activity log →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div onClick={() => setOpen(o => !o)}
            style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#1a6ef5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer', userSelect: 'none', border: open ? '2px solid #5599ff' : '2px solid transparent', transition: 'border-color 0.15s' }}>
            {initials}
          </div>

          {open && (
            <div style={{ position: 'absolute', right: 0, top: '38px', width: '210px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100 }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a2a' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || '—'}</p>
                <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || ''}</p>
              </div>
              {[
                { label: 'Account & profile', href: '/account/profile', icon: '👤' },
                { label: 'Statement', href: '/account/statement', icon: '📄' },
                { label: 'Renewals', href: '/renewals', icon: '🔄' },
                { label: 'Team members', href: '/account/members', icon: '👥' },
                { label: `Credit · £${Number(user?.creditBalance || 0).toFixed(2)}`, href: '/account/topup', icon: '💳', highlight: true },
              ].map(item => (
                <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', fontSize: '12px', textDecoration: 'none', color: item.highlight ? '#5599ff' : '#aaa', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontSize: '13px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <div style={{ borderTop: '1px solid #2a2a2a' }}>
                <button onClick={handleLogout}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', fontSize: '12px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontSize: '13px' }}>🚪</span>
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
    </div>
  )
}
