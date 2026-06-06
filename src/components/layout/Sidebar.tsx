'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

function Icon({ d, d2 }: { d: string; d2?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />{d2 && <path d={d2} />}
    </svg>
  )
}

const nav = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', href: '/dashboard', icon: <Icon d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" d2="M9 22V12h6v10" /> },
      { label: 'Activity', href: '/account/activity', icon: <Icon d="M22 12h-4l-3 9L9 3l-3 9H2" /> },
    ],
  },
  {
    label: 'Domains & DNS',
    items: [
      { label: 'Domains', href: '/domains', icon: <Icon d="M12 2a10 10 0 100 20A10 10 0 0012 2zM2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" /> },
      { label: 'Register Domain', href: '/domains/search', icon: <Icon d="M12 5v14M5 12h14" /> },
      { label: 'DNS', href: '/dns', icon: <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /> },
    ],
  },
  {
    label: 'Websites & Hosting',
    items: [
      { label: 'Hosting Packages', href: '/packages', icon: <Icon d="M22 12H2M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" /> },
      { label: 'WordPress', href: '/wordpress', icon: <Icon d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" d2="M12 6v6l4 2" /> },
      { label: 'Windows Hosting', href: '/windows', icon: <Icon d="M3 5h8v8H3zM13 5h8v8h-8zM3 15h8v6H3zM13 15h8v6h-8z" /> },
      { label: 'Linux Hosting', href: '/linux', icon: <Icon d="M20 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1z" d2="M8 10h8M8 14h4" /> },
    ],
  },
  {
    label: 'Email',
    items: [
      { label: 'Email', href: '/email', icon: <Icon d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" d2="M22 6l-10 7L2 6" /> },
    ],
  },
  {
    label: 'Security',
    items: [
      { label: 'Security', href: '/security', icon: <Icon d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" d2="M9 12l2 2 4-4" /> },
    ],
  },
  {
    label: 'Performance',
    items: [
      { label: 'CDN', href: '/cdn', icon: <Icon d="M12 2a10 10 0 100 20A10 10 0 0012 2z" d2="M12 8v8M8 12h8" /> },
      { label: 'Analytics', href: '/analytics', icon: <Icon d="M18 20V10M12 20V4M6 20v-6" /> },
    ],
  },
  {
    label: 'Databases',
    items: [
      { label: 'Databases', href: '/databases', icon: <Icon d="M12 2C8.13 2 5 3.34 5 5v14c0 1.66 3.13 3 7 3s7-1.34 7-3V5c0-1.66-3.13-3-7-3z" d2="M5 5c0 1.66 3.13 3 7 3s7-1.34 7-3M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" /> },
    ],
  },
  {
    label: 'Compute',
    items: [
      { label: 'VPS', href: '/compute/vps', icon: <Icon d="M20 3H4a1 1 0 00-1 1v4a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1zM20 13H4a1 1 0 00-1 1v4a1 1 0 001 1h16a1 1 0 001-1v-4a1 1 0 00-1-1z" d2="M7 7h.01M7 17h.01" /> },
      { label: 'GPU Compute', href: '/compute/gpu', icon: <Icon d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" /> },
    ],
  },
  {
    label: 'Backup & Recovery',
    items: [
      { label: 'Backups', href: '/backups', icon: <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" d2="M7 10l5 5 5-5M12 15V3" /> },
      { label: 'Restore Points', href: '/backups/restore', icon: <Icon d="M1 4v6h6M23 20v-6h-6" d2="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" /> },
    ],
  },
  {
    label: 'Tools',
    items: [
      { label: 'Web CLI', href: '/cli', icon: <Icon d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
      { label: 'API Reference', href: '/api-reference', icon: <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /> },
      { label: 'API Credentials', href: '/account/api', icon: <Icon d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /> },
    ],
  },
]

export default function Sidebar() {
  const [isMember, setIsMember] = useState(false)
  const [pkgCount, setPkgCount] = useState(0)
  const [domainCount, setDomainCount] = useState(0)
  const [packages, setPackages] = useState<{id:string,name:string,label:string,href:string,group:string}[]>([])
  const [selectedPkg, setSelectedPkg] = useState<string>('all')
  const [dropOpen, setDropOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setIsMember(d?.user?.isMember === true)
      setPkgCount(d?.user?.packageCount || 0)
      setDomainCount(d?.user?.domainCount || 0)
    }).catch(() => {})
    Promise.all([
      fetch('/api/packages/list').then(r => r.json()),
      fetch('/api/compute/vps').then(r => r.json()),
      fetch('/api/compute/gpu').then(r => r.json()),
    ]).then(([pkgs, vps, gpu]) => {
      const hosting = (pkgs.packages || []).map((p: any) => ({ id: `pkg_${p.id}`, name: p.name, label: p.label, href: `/packages/${p.id}`, group: 'Hosting' }))
      const vpsList = (vps.orders || []).map((v: any) => ({ id: `vps_${v.id}`, name: v.display_name || v.service_key, label: `VPS · ${v.status}`, href: `/compute/vps/${v.id}`, group: 'VPS' }))
      const gpuList = (gpu.orders || []).map((g: any) => ({ id: `gpu_${g.id}`, name: g.service_key, label: `GPU · ${g.tier} · ${g.billing_period}`, href: `/compute/gpu/${g.id}`, group: 'GPU' }))
      setPackages([...hosting, ...vpsList, ...gpuList])
    }).catch(() => {})
  }, [])

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const selectedLabel = selectedPkg === 'all'
    ? 'All packages'
    : packages.find(p => p.id === selectedPkg)?.name || 'All packages'

  const groups = ['Hosting', 'VPS', 'GPU']

  const filtered = packages.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.label.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside
      className="fixed left-0 bottom-0 flex flex-col overflow-y-auto sidebar-scroll"
      style={{
        top: isMember ? '78px' : '52px',
        width: '232px',
        background: 'var(--g-sidebar-bg)',
        borderRight: '1px solid var(--g-sidebar-border)',
      }}
    >
      {/* Package selector */}
      <div style={{ margin: '10px 10px 6px', position: 'relative' }}>
        <p style={{ fontFamily: 'monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px', color: '#444', marginBottom: '5px', paddingLeft: '2px' }}>Active Package</p>
        <div
          onClick={() => setDropOpen(o => !o)}
          style={{ padding: '8px 10px', background: '#161616', border: '1px solid #252525', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}
        >
          <span style={{ fontSize: '12px', fontWeight: 500, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedLabel}</span>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" style={{ flexShrink: 0, transform: dropOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        {dropOpen && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px', background: '#161616', border: '1px solid #252525', borderRadius: '8px', overflow: 'hidden', zIndex: 200, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
            {/* Search */}
            <div style={{ padding: '8px', borderBottom: '1px solid #1e1e1e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#0e0e0e', border: '1px solid #252525', borderRadius: '5px', padding: '5px 8px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                <input
                  autoFocus
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search packages..."
                  style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '11px', color: '#ccc', width: '100%', fontFamily: 'inherit' }}
                />
              </div>
            </div>
            {/* Options */}
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <div
                onClick={() => { setSelectedPkg('all'); setDropOpen(false); setSearch(''); router.push('/dashboard') }}
                style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', color: selectedPkg === 'all' ? '#fff' : '#aaa', background: selectedPkg === 'all' ? '#1a1a1a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                onMouseEnter={e => { if (selectedPkg !== 'all') (e.currentTarget as HTMLDivElement).style.background = '#111' }}
                onMouseLeave={e => { if (selectedPkg !== 'all') (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
              >
                <span>All packages</span>
                {selectedPkg === 'all' && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              {filtered.length === 0 && search && (
                <div style={{ padding: '12px', fontSize: '11px', color: '#444', textAlign: 'center' }}>No results found</div>
              )}
              {groups.map(group => {
                const items = filtered.filter(p => p.group === group)
                if (items.length === 0) return null
                return (
                  <div key={group}>
                    <div style={{ padding: '6px 12px 3px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#333' }}>{group}</div>
                    {items.map(p => (
                      <div
                        key={p.id}
                        onClick={() => { setSelectedPkg(p.id); setDropOpen(false); setSearch(''); router.push(p.href) }}
                        style={{ padding: '7px 12px', fontSize: '12px', cursor: 'pointer', color: selectedPkg === p.id ? '#fff' : '#aaa', background: selectedPkg === p.id ? '#1a1a1a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
                        onMouseEnter={e => { if (selectedPkg !== p.id) (e.currentTarget as HTMLDivElement).style.background = '#111' }}
                        onMouseLeave={e => { if (selectedPkg !== p.id) (e.currentTarget as HTMLDivElement).style.background = 'transparent' }}
                      >
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                          <div style={{ fontSize: '10px', color: '#555', marginTop: '1px' }}>{p.label}</div>
                        </div>
                        {selectedPkg === p.id && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#1a6ef5" strokeWidth="2.5" style={{ flexShrink: 0 }}><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 0 8px' }}>
        {nav.map((group, gi) => (
          <div key={gi} style={{ marginBottom: '2px' }}>
            {group.label && (
              <p style={{ padding: '10px 16px 4px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#3a3a3a' }}>
                {group.label}
              </p>
            )}
            {group.items.map(item => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '9px',
                    padding: '6px 16px', fontSize: '12.5px', textDecoration: 'none',
                    color: active ? '#fff' : '#5a5a5a',
                    background: active ? '#1a1a1a' : 'transparent',
                    position: 'relative', transition: 'color 0.1s, background 0.1s',
                  }}
                  onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.color = '#ccc' } }}
                  onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLAnchorElement).style.color = '#5a5a5a' } }}
                >
                  {active && (
                    <span style={{ position: 'absolute', left: 0, top: '4px', bottom: '4px', width: '2px', borderRadius: '0 2px 2px 0', background: '#1a6ef5' }} />
                  )}
                  <span style={{ color: active ? '#1a6ef5' : 'inherit', display: 'flex' }}>{item.icon}</span>
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 12px 14px', borderTop: '1px solid #1a1a1a' }}>
        <p style={{ fontSize: '11px', color: '#3a3a3a', marginBottom: '8px' }}>
          {domainCount} domain{domainCount !== 1 ? 's' : ''} · {pkgCount} package{pkgCount !== 1 ? 's' : ''}
        </p>
        <Link href="/domains/search" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 10px', borderRadius: '6px', color: '#1a6ef5', background: '#0a1628', border: '1px solid #1a3060', textDecoration: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add domain
        </Link>
      </div>
    </aside>
  )
}
