'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  login:          { label: 'Login',           color: '#3b6d11', bg: '#eaf3de', icon: '🔐' },
  logout:         { label: 'Logout',          color: '#854f0b', bg: '#faeeda', icon: '🚪' },
  login_failed:   { label: 'Failed login',    color: '#a32d2d', bg: '#fcebeb', icon: '⚠️' },
  domain_register:{ label: 'Domain registered', color: '#185fa5', bg: '#e6f1fb', icon: '🌐' },
  package_create: { label: 'Package created', color: '#534ab7', bg: '#eeedfe', icon: '📦' },
  dns_add:        { label: 'DNS record added', color: '#185fa5', bg: '#e6f1fb', icon: '📋' },
  dns_delete:     { label: 'DNS record deleted', color: '#a32d2d', bg: '#fcebeb', icon: '🗑️' },
  credit_grant:   { label: 'Credit granted',  color: '#3b6d11', bg: '#eaf3de', icon: '💰' },
  nameserver_update: { label: 'Nameservers updated', color: '#534ab7', bg: '#eeedfe', icon: '🔧' },
}

function getBrowser(ua: string): string {
  if (!ua || ua === 'unknown') return 'Unknown'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  if (ua.includes('curl')) return 'API/curl'
  return 'Unknown'
}

function getOS(ua: string): string {
  if (!ua || ua === 'unknown') return ''
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  return ''
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/account/activity?page=${page}`)
      .then(r => r.json())
      .then(d => {
        setLogs(d.logs || [])
        setSessions(d.sessions || [])
        setTotal(d.total || 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [page])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action.startsWith(filter))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>

      {/* Header */}
      <div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
          <Link href="/dashboard" style={{ color: '#1a6ef5' }}>Dashboard</Link> › Activity log
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>Activity log</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
          All account actions, sessions and security events.
        </p>
      </div>

      {/* Active sessions */}
      <div className="gsws-card">
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Active sessions ({sessions.length})
        </h2>
        {sessions.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>No active sessions.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sessions.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--card-bg-elevated)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '16px' }}>💻</span>
                  <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Session {i + 1} {i === 0 ? '(current)' : ''}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'ui-monospace, monospace' }}>
                      Token: {s.token.substring(0, 16)}…
                    </p>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Created: {new Date(s.created_at).toLocaleString('en-GB')}
                  </p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Expires: {new Date(s.expires_at).toLocaleString('en-GB')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', borderBottom: '1px solid var(--card-border)', paddingBottom: '0' }}>
        {[
          { key: 'all', label: 'All activity' },
          { key: 'login', label: 'Auth events' },
          { key: 'domain', label: 'Domains' },
          { key: 'package', label: 'Packages' },
          { key: 'dns', label: 'DNS' },
          { key: 'credit', label: 'Credits' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            style={{ padding: '8px 14px', fontSize: '12px', fontWeight: filter === f.key ? 600 : 400, color: filter === f.key ? '#1a6ef5' : '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${filter === f.key ? '#1a6ef5' : 'transparent'}`, marginBottom: '-1px' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg-elevated)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {loading ? 'Loading…' : `${total} events total`}
          </h2>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Page {page} of {Math.ceil(total / 20)}</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading activity…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No activity recorded yet.</div>
        ) : (
          <table className="gsws-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Resource</th>
                <th>Detail</th>
                <th>Session</th>
                <th>IP address</th>
                <th>Browser</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: any) => {
                const meta = ACTION_LABELS[log.action] || { label: log.action, color: '#5a5a5a', bg: '#f1efe8', icon: '📝' }
                return (
                  <tr key={log.id}>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: meta.bg, color: meta.color }}>
                        {meta.icon} {meta.label}
                      </span>
                    </td>
                    <td style={{ fontSize: '12px', color: '#5a5a5a' }}>
                      <span style={{ fontWeight: 500 }}>{log.resource_type}</span>
                      {log.resource_name && log.resource_name !== log.resource_type && (
                        <span style={{ color: 'var(--text-secondary)' }}> / {log.resource_name}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {log.detail || '—'}
                    </td>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {log.session_token || '—'}
                    </td>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-primary)' }}>
                      {log.ip_address || '—'}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      {getBrowser(log.user_agent)}
                      {getOS(log.user_agent) && <span style={{ color: '#d4d4d4' }}> · {getOS(log.user_agent)}</span>}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(log.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > 20 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '12px', cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1, background: 'var(--card-bg)', fontFamily: 'inherit' }}>
              ← Prev
            </button>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / 20)}
              style={{ height: '28px', padding: '0 12px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '12px', cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(total / 20) ? 0.5 : 1, background: 'var(--card-bg)', fontFamily: 'inherit' }}>
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
