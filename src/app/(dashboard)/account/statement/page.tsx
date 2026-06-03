'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TYPE_INFO: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  topup:           { label: 'Top-up',          icon: '💳', color: '#3b6d11', bg: '#eaf3de' },
  domain_register: { label: 'Domain register', icon: '🌐', color: '#185fa5', bg: '#e8f0fe' },
  domain_transfer: { label: 'Domain transfer', icon: '↗️', color: '#185fa5', bg: '#e8f0fe' },
  domain_renew:    { label: 'Domain renewal',  icon: '🔄', color: '#854f0b', bg: '#faeeda' },
  hosting:         { label: 'Hosting',         icon: '🖥️', color: '#534ab7', bg: '#eeedfe' },
  refund:          { label: 'Refund',          icon: '↩️', color: '#3b6d11', bg: '#eaf3de' },
  credit_grant:    { label: 'Credit added',    icon: '🎁', color: '#3b6d11', bg: '#eaf3de' },
  ssl:             { label: 'SSL certificate', icon: '🔒', color: '#854f0b', bg: '#faeeda' },
}

const FILTERS = [
  { value: '', label: 'All transactions' },
  { value: 'topup', label: 'Top-ups' },
  { value: 'domain_register', label: 'Domains' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'refund', label: 'Refunds' },
]

export default function StatementPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/account/statement?page=${page}&type=${filter}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [page, filter])

  function handleFilter(f: string) { setFilter(f); setPage(1) }

  const balance = data?.balance || 0
  const stats = data?.stats || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '860px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
            <Link href="/account/profile" style={{ color: '#1a6ef5' }}>Account</Link> › Statement
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Account statement</h1>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>Full transaction history for your account.</p>
        </div>
        <Link href="/account/topup"
          style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          💳 Top up credit
        </Link>
      </div>

      {/* Balance + stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[
          { label: 'Current balance', value: `£${balance.toFixed(2)}`, color: balance > 10 ? '#3b6d11' : '#a32d2d', bg: balance > 10 ? '#eaf3de' : '#fcebeb', icon: '💳' },
          { label: 'Total credited', value: `£${(stats.total_credited || 0).toFixed(2)}`, color: '#3b6d11', bg: '#eaf3de', icon: '⬆️' },
          { label: 'Total spent', value: `£${(stats.total_spent || 0).toFixed(2)}`, color: '#a32d2d', bg: '#fcebeb', icon: '⬇️' },
          { label: 'Transactions', value: data?.total || 0, color: '#185fa5', bg: '#e8f0fe', icon: '📋' },
        ].map(s => (
          <div key={s.label} style={{ padding: '16px', borderRadius: '10px', background: s.bg, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '18px' }}>{s.icon}</span>
            <p style={{ fontSize: '11px', color: '#5a5a5a', fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: s.color, letterSpacing: '-0.5px' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => handleFilter(f.value)}
            style={{ height: '32px', padding: '0 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: `1px solid ${filter === f.value ? '#1a6ef5' : '#d4d4d4'}`, background: filter === f.value ? '#1a6ef5' : '#fff', color: filter === f.value ? '#fff' : '#5a5a5a' }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Transactions table */}
      <div className="gsws-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9a9a9a', fontSize: '13px' }}>Loading…</div>
        ) : !data?.transactions?.length ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '32px', marginBottom: '10px' }}>📋</p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>No transactions yet</p>
            <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>Transactions will appear here when you top up or purchase services.</p>
          </div>
        ) : (
          <>
            <table className="gsws-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ textAlign: 'right' }}>Balance after</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx: any) => {
                  const info = TYPE_INFO[tx.type] || { label: tx.type, icon: '📄', color: '#5a5a5a', bg: '#f7f7f7' }
                  const isCredit = tx.amount > 0
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '12px', color: '#9a9a9a', whiteSpace: 'nowrap' }}>
                        {new Date(tx.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <span style={{ fontSize: '11px' }}>{new Date(tx.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td>
                        <p style={{ fontSize: '12px', color: '#0a0a0a', fontWeight: 500 }}>{tx.description}</p>
                        {tx.reference && <p style={{ fontSize: '11px', color: '#9a9a9a', fontFamily: 'ui-monospace, monospace', marginTop: '2px' }}>{tx.reference}</p>}
                      </td>
                      <td>
                        <span style={{ padding: '3px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: info.bg, color: info.color, whiteSpace: 'nowrap' }}>
                          {info.icon} {info.label}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: '13px', fontWeight: 700, color: isCredit ? '#3b6d11' : '#a32d2d', whiteSpace: 'nowrap' }}>
                        {isCredit ? '+' : ''}£{Math.abs(tx.amount).toFixed(2)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#5a5a5a', whiteSpace: 'nowrap' }}>
                        £{tx.balance_after.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Pagination */}
            {data.pages > 1 && (
              <div style={{ padding: '14px 20px', borderTop: '1px solid #ebebeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontSize: '12px', color: '#9a9a9a' }}>Page {page} of {data.pages} · {data.total} transactions</p>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ height: '30px', padding: '0 12px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: '#fff', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                  <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
                    style={{ height: '30px', padding: '0 12px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', background: '#fff', opacity: page === data.pages ? 0.4 : 1 }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <p style={{ fontSize: '11px', color: '#9a9a9a', textAlign: 'center' }}>
        All amounts shown include VAT where applicable. For billing queries contact <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>
      </p>
    </div>
  )
}
