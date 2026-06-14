'use client'
import { useState } from 'react'
import { ROUTES } from '@/lib/api-routes'

const GROUPS = [...new Set(ROUTES.map(r => r.group))]

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: '#dbeafe', text: '#1d4ed8' },
  POST:   { bg: '#dcfce7', text: '#166534' },
  PUT:    { bg: '#fef9c3', text: '#92400e' },
  PATCH:  { bg: '#fef3c7', text: '#b45309' },
  DELETE: { bg: '#fee2e2', text: '#991b1b' },
  HEAD:   { bg: 'var(--card-border)', text: 'var(--text-secondary)' },
}

export default function APIReferencePage() {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('All')
  const [expanded, setExpanded] = useState<string | null>(null)

  const filtered = ROUTES.filter(r => {
    const matchGroup = activeGroup === 'All' || r.group === activeGroup
    const matchSearch = !search || r.path.toLowerCase().includes(search.toLowerCase()) || r.desc.toLowerCase().includes(search.toLowerCase())
    return matchGroup && matchSearch
  })

  const grouped = GROUPS.reduce((acc, g) => {
    const routes = filtered.filter(r => r.group === g)
    if (routes.length) acc[g] = routes
    return acc
  }, {} as Record<string, typeof ROUTES>)

  return (
    <div style={{ maxWidth: '960px' }}>
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>API Reference</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {ROUTES.length} endpoints · All routes require session cookie unless marked public · Base URL: <code style={{ background: 'var(--card-bg-elevated)', padding: '1px 5px', borderRadius: '3px', fontSize: '12px' }}>https://sws.geig.co.uk</code>
          </p>
        </div>
        <a href="/api/docs/postman-collection" download
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}>
          ⬇ Download Postman Collection
        </a>
      </div>

      {/* Search + filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search endpoints..."
          style={{ flex: 1, minWidth: '200px', padding: '9px 14px', border: '1px solid var(--card-border)', borderRadius: '8px', fontSize: '13px' }} />
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {['All', ...GROUPS].map(g => (
            <button key={g} onClick={() => setActiveGroup(g)}
              style={{ padding: '8px 12px', background: activeGroup === g ? '#1a6ef5' : 'var(--card-border)', color: activeGroup === g ? '#fff' : 'var(--text-secondary)', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Routes */}
      {Object.entries(grouped).map(([group, routes]) => (
        <div key={group} style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 10px', paddingBottom: '8px', borderBottom: '2px solid var(--card-border)' }}>
            {group} <span style={{ fontWeight: 400, color: 'var(--text-secondary)', fontSize: '12px' }}>({routes.length})</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {routes.map((r, i) => {
              const key = r.method + r.path
              const isOpen = expanded === key
              const mc = METHOD_COLORS[r.method] || METHOD_COLORS.GET
              return (
                <div key={i} style={{ border: '1px solid var(--card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                  <button onClick={() => setExpanded(isOpen ? null : key)}
                    style={{ width: '100%', padding: '10px 14px', background: isOpen ? '#f8faff' : '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 7px', borderRadius: '4px', background: mc.bg, color: mc.text, minWidth: '52px', textAlign: 'center', flexShrink: 0 }}>
                      {r.method}
                    </span>
                    <code style={{ fontSize: '12px', color: '#1a1a1a', fontFamily: 'monospace', flex: 1 }}>{r.path}</code>
                    {!r.auth && <span style={{ fontSize: '10px', background: '#fef9c3', color: '#92400e', padding: '1px 5px', borderRadius: '3px', fontWeight: 600, flexShrink: 0 }}>PUBLIC</span>}
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', flex: 2 }}>{r.desc}</span>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{isOpen ? '▲' : '▼'}</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: '14px 16px', background: 'var(--card-bg-elevated)', borderTop: '1px solid var(--card-border)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: r.body ? '1fr 1fr' : '1fr', gap: '12px' }}>
                        {r.params && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Query Params</div>
                            <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.params}</pre>
                          </div>
                        )}
                        {r.body && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Request Body</div>
                            <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.body}</pre>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px', textTransform: 'uppercase' }}>Response</div>
                          <pre style={{ margin: 0, fontSize: '11px', background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '6px', padding: '8px 10px', overflow: 'auto' }}>{r.response}</pre>
                        </div>
                      </div>
                      <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        🔐 Auth: {r.auth ? 'Session cookie required' : 'Public — no auth required'}
                        {!r.auth && r.group === 'Cron' && ' (x-cron-secret header required)'}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
