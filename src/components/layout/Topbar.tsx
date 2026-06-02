'use client'
import Link from 'next/link'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SessionUser {
  id: number
  email: string
  name: string
  role: string
  credit_balance: number
}

export default function Topbar() {
  const router = useRouter()
  const [user, setUser] = useState<SessionUser | null>(null)
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => { if (d.user) setUser(d.user); else window.location.href = '/login' })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleLogout() {
    setOpen(false)
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  return (
    <header style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: '52px',
      display: 'flex', alignItems: 'center',
      background: 'var(--g-topbar-bg)', borderBottom: '1px solid var(--g-topbar-border)',
    }}>

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '0 20px',
        width: '232px', height: '100%', flexShrink: 0,
        borderRight: '1px solid var(--g-topbar-border)',
      }}>
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
          <Link href="/account/topup" style={{
            display: 'flex', alignItems: 'center', gap: '6px', padding: '0 10px', height: '28px',
            borderRadius: '6px', background: '#0a1628', border: '1px solid #1a3060',
            color: '#5599ff', textDecoration: 'none', fontSize: '12px', fontWeight: 500,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="1" x2="12" y2="23"/>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
            £{Number(user.credit_balance).toFixed(2)}
          </Link>
        )}

        {/* Site label */}
        <span style={{ fontSize: '11px', color: '#555' }}>sws.geig.co.uk</span>

        {/* Bell */}
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#666', display: 'flex' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Avatar + dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div onClick={() => setOpen(o => !o)}
            style={{
              width: '30px', height: '30px', borderRadius: '50%', background: '#1a6ef5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, color: '#fff', cursor: 'pointer',
              userSelect: 'none', border: open ? '2px solid #5599ff' : '2px solid transparent',
              transition: 'border-color 0.15s',
            }}>
            {initials}
          </div>

          {open && (
            <div style={{
              position: 'absolute', right: 0, top: '38px', width: '210px',
              background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '10px',
              overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100,
            }}>
              {/* User info */}
              <div style={{ padding: '12px 14px', borderBottom: '1px solid #2a2a2a' }}>
                <p style={{ fontSize: '12px', fontWeight: 600, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || '—'}
                </p>
                <p style={{ fontSize: '11px', color: '#666', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email || ''}
                </p>
              </div>

              {/* Menu items */}
              {[
                { label: 'Account & profile', href: '/account/profile', icon: '👤' },
                { label: 'Activity log', href: '/account/activity', icon: '📋' },
                { label: `Credit · £${Number(user?.credit_balance || 0).toFixed(2)}`, href: '/account/topup', icon: '💳', highlight: true },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px', fontSize: '12px', textDecoration: 'none',
                    color: item.highlight ? '#5599ff' : '#aaa',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#252525')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <span style={{ fontSize: '13px' }}>{item.icon}</span>
                  {item.label}
                </Link>
              ))}

              <div style={{ borderTop: '1px solid #2a2a2a' }}>
                <button onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '9px 14px', fontSize: '12px', color: '#f87171',
                    background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
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
  )
}
