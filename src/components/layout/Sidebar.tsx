'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface NavGroup {
  label?: string
  items: NavItem[]
}

function Icon({ d }: { d: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

const nav: NavGroup[] = [
  {
    items: [
      { label: 'Overview', href: '/dashboard', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
      { label: 'Domains', href: '/domains', icon: <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /> },
    ],
  },
  {
    label: 'Hosting',
    items: [
      { label: 'Packages', href: '/packages', icon: <Icon d="M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /> },
      { label: 'WordPress', href: '/wordpress', icon: <Icon d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /> },
      { label: 'Drupal', href: '/drupal', icon: <Icon d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" /> },
      { label: 'Windows', href: '/windows', icon: <Icon d="M3 5h8v8H3zM13 5h8v8h-8zM3 15h8v6H3zM13 15h8v6h-8z" /> },
    ],
  },
  {
    label: 'Services',
    items: [
      { label: 'Email', href: '/email', icon: <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6" /> },
      { label: 'DNS', href: '/dns', icon: <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
      { label: 'SSL / TLS', href: '/ssl', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
      { label: 'CDN', href: '/cdn', icon: <Icon d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z M12 8v8M8 12h8" /> },
      { label: 'Databases', href: '/databases', icon: <Icon d="M12 2C8.13 2 5 3.34 5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5c0-1.66-3.13-3-7-3z M5 5c0 1.66 3.13 3 7 3s7-1.34 7-3 M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" /> },
      { label: 'Security', href: '/security', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
      { label: 'Backups', href: '/backups', icon: <Icon d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" /> },
      { label: 'Renewals', href: '/renewals', icon: <Icon d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" /> },
    ],
  },
  {
    label: 'Compute',
    items: [
      { label: 'GPU Compute', href: '/compute/gpu', icon: <Icon d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 0-2-2V9m0 0h18" /> },
      { label: 'VPS', href: '/compute/vps', icon: <Icon d="M20 3H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z M20 11H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Web CLI', href: '/cli', icon: <Icon d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" /> },
      { label: 'API Reference', href: '/api-reference', icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
      { label: 'API Credentials', href: '/account/api', icon: <Icon d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /> },
    ],
  },
      { label: 'Managed VPS', href: '/managed-vps', icon: <Icon d="M20 3H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z M20 11H4a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1z" /> },
      { label: 'Cloud Servers', href: '/cloud-servers', icon: <Icon d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" /> },
    ],
  },
]

export default function Sidebar() {
  const [isMember, setIsMember] = useState(false)
  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setIsMember(d?.user?.isMember === true)
    }).catch(() => {})
  }, [])
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <aside className="fixed left-0 bottom-0 w-[232px] flex flex-col overflow-y-auto sidebar-scroll" style={{ top: isMember ? '78px' : '52px', background: 'var(--g-sidebar-bg)', borderRight: '1px solid var(--g-sidebar-border)' }}>

      {/* Domain selector */}
      <div className="mx-3 mt-3 mb-2 rounded-lg px-3 py-2.5 cursor-pointer"
        style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
        <p className="text-[10px] uppercase tracking-[1px] mb-1" style={{ color: '#555' }}>Active package</p>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-medium" style={{ color: '#e0e0e0' }}>All packages</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 py-1">
        {nav.map((group, gi) => (
          <div key={gi} className="mb-1">
            {group.label && (
              <p className="px-4 py-2 text-[9px] font-semibold uppercase tracking-[1.2px]"
                style={{ color: '#444' }}>
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href)
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-2.5 px-4 py-[7px] relative text-[12.5px] transition-all duration-150"
                  style={{ color: active ? '#fff' : 'var(--g-sidebar-item)',
                    background: active ? '#1e1e1e' : 'transparent' }}>
                  {active && (
                    <span className="absolute left-0 top-1 bottom-1 w-0.5 rounded-r"
                      style={{ background: 'var(--g-accent)' }} />
                  )}
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid #1e1e1e' }}>
        <p className="text-[11px] mb-2" style={{ color: '#444' }}>3 domains · 3 packages</p>
        <Link href="/domains/search"
          className="flex items-center gap-2 text-[12px] px-2.5 py-1.5 rounded-md transition-all"
          style={{ color: 'var(--g-accent)', background: '#0a1628', border: '1px solid #1a3060' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add domain
        </Link>
      </div>
    </aside>
  )
}
