'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab { label: string; href: string }

export default function PackageTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <div className="gsws-package-tabs" style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--card-border)', overflowX: 'auto' }}>
      {tabs.map(tab => {
        const active = pathname === tab.href
        return (
          <Link key={tab.href} href={tab.href}
            style={{
              padding: '8px 14px', fontSize: '12.5px', fontWeight: active ? 600 : 400,
              color: active ? '#1a6ef5' : '#9a9a9a', textDecoration: 'none',
              borderBottom: `2px solid ${active ? '#1a6ef5' : 'transparent'}`,
              marginBottom: '-1px', whiteSpace: 'nowrap', transition: 'color 0.15s',
            }}>
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
