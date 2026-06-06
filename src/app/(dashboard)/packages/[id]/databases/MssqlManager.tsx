'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function MssqlManager({ packageId, initialDatabases, creditBalance }: {
  packageId: string
  initialDatabases: any[]
  creditBalance: number
}) {
  const [databases, setDatabases] = useState(initialDatabases)
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [balance, setBalance] = useState(creditBalance)
  const PRICE = 14.95

  async function handleOrder() {
    setOrdering(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch(`/api/packages/${packageId}/mssql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to order MSSQL')
      setSuccess(`MSSQL database provisioned successfully. £${PRICE.toFixed(2)} charged.`)
      setBalance(data.newBalance)
      // Refresh list
      const listRes = await fetch(`/api/packages/${packageId}/mssql`)
      if (listRes.ok) {
        const listData = await listRes.json()
        setDatabases(listData.mssqlDatabases || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setOrdering(false)
    }
  }

  const hasSlot = databases.length > 0
  const canAfford = balance >= PRICE

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#0a0a0a' }}>MSSQL database</h2>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '3px' }}>
            {hasSlot ? `${databases.length} database assigned` : 'No MSSQL database provisioned'} · Windows Hosting
          </p>
        </div>
        {!hasSlot && (
          <button
            onClick={handleOrder}
            disabled={ordering || !canAfford}
            style={{ height: '36px', padding: '0 18px', background: ordering || !canAfford ? '#ccc' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: ordering || !canAfford ? 'not-allowed' : 'pointer' }}
          >
            {ordering ? 'Ordering...' : `+ Add MSSQL · £${PRICE.toFixed(2)}/yr`}
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '8px', fontSize: '13px', color: '#991b1b' }}>
          {error}
          {!canAfford && (
            <> · <Link href="/account/topup" style={{ color: '#1a6ef5', fontWeight: 600 }}>Top up credit →</Link></>
          )}
        </div>
      )}

      {success && (
        <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '13px', color: '#166534' }}>
          {success}
        </div>
      )}

      {!canAfford && !hasSlot && (
        <div style={{ padding: '14px 18px', background: '#fefce8', border: '1px solid #fde047', borderRadius: '8px', fontSize: '13px', color: '#854d0e', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Insufficient credit. MSSQL costs £{PRICE.toFixed(2)}/year. Your balance: £{balance.toFixed(2)}</span>
          <Link href="/account/topup" style={{ color: '#1a6ef5', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', marginLeft: '12px' }}>Top up →</Link>
        </div>
      )}

      {hasSlot ? (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #ebebeb', background: '#f7f7f7' }}>
                {['MSSQL ID', 'Package', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#9a9a9a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {databases.map((m: any) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, color: '#0a0a0a', fontFamily: 'monospace' }}>{m.id}</td>
                  <td style={{ padding: '12px 16px', color: '#666' }}>{m.packageName || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Active</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', padding: '48px', textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', background: '#f0f0f0', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9a9a9a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '6px' }}>No MSSQL database</p>
          <p style={{ fontSize: '13px', color: '#9a9a9a', marginBottom: '4px' }}>Windows hosting packages require a separate MSSQL database add-on.</p>
          <p style={{ fontSize: '12px', color: '#9a9a9a' }}>£{PRICE.toFixed(2)}/year (inc. VAT) · Your balance: £{balance.toFixed(2)}</p>
        </div>
      )}

      <div style={{ padding: '12px 16px', background: '#f7f7f7', borderRadius: '8px', fontSize: '12px', color: '#666' }}>
        <strong>Note:</strong> MSSQL databases are billed annually at £{PRICE.toFixed(2)} inc. VAT. MySQL is not available on Windows hosting — use MSSQL for all database needs on this package.
      </div>
    </div>
  )
}
