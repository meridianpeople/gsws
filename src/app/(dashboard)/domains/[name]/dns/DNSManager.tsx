'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'CAA']

interface DNSRecord {
  id?: string
  type: string
  host: string
  data: string
  ttl: number
  priority?: number
}

export default function DNSManager({ domainName, paramName }: { domainName: string; paramName: string }) {
  const [records, setRecords] = useState<DNSRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [success, setSuccess] = useState('')

  const [newRecord, setNewRecord] = useState<DNSRecord>({
    type: 'A', host: '', data: '', ttl: 3600,
  })

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/dns`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setRecords(data.records || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!newRecord.host || !newRecord.data) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/dns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add record')
      setSuccess('DNS record added successfully')
      setShowAdd(false)
      setNewRecord({ type: 'A', host: '', data: '', ttl: 3600 })
      await loadRecords()
      setTimeout(() => setSuccess(''), 4000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: DNSRecord) {
    if (!record.id) return
    setDeleteId(record.id)
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/dns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setSuccess('Record deleted')
      await loadRecords()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleteId(null)
    }
  }

  const typeColor: Record<string, { bg: string; color: string }> = {
    A: { bg: '#e6f1fb', color: '#185fa5' },
    AAAA: { bg: '#eeedfe', color: '#534ab7' },
    CNAME: { bg: '#eaf3de', color: '#3b6d11' },
    MX: { bg: '#faeeda', color: '#854f0b' },
    TXT: { bg: '#f1efe8', color: '#5a5a5a' },
    NS: { bg: '#fcebeb', color: '#a32d2d' },
    SRV: { bg: '#e8f0fe', color: '#185fa5' },
    CAA: { bg: '#ebebeb', color: '#5a5a5a' },
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '960px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link> ›{' '}
            <Link href={`/domains/${paramName}`} style={{ color: '#1a6ef5' }}>{domainName}</Link> › DNS records
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>DNS records</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>Manage DNS records for <strong>{domainName}</strong></p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ height: '38px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
          + Add record
        </button>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Add record form */}
      {showAdd && (
        <div className="gsws-card">
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>Add DNS record</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 100px', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Type</label>
              <select value={newRecord.type} onChange={e => setNewRecord(r => ({ ...r, type: e.target.value }))}
                style={{ width: '100%', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px', background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Host {newRecord.type === 'MX' ? '(e.g. @)' : '(e.g. @ or subdomain)'}
              </label>
              <input value={newRecord.host} onChange={e => setNewRecord(r => ({ ...r, host: e.target.value }))}
                placeholder={newRecord.type === 'MX' ? '@' : newRecord.type === 'CNAME' ? 'www' : '@'}
                style={{ width: '100%', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', background: 'var(--card-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Value {newRecord.type === 'A' ? '(IP address)' : newRecord.type === 'MX' ? '(mail server)' : newRecord.type === 'TXT' ? '(text content)' : ''}
              </label>
              <input value={newRecord.data} onChange={e => setNewRecord(r => ({ ...r, data: e.target.value }))}
                placeholder={newRecord.type === 'A' ? '1.2.3.4' : newRecord.type === 'MX' ? 'mail.example.com' : newRecord.type === 'TXT' ? 'v=spf1 include:...' : ''}
                style={{ width: '100%', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', background: 'var(--card-bg)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TTL</label>
              <select value={newRecord.ttl} onChange={e => setNewRecord(r => ({ ...r, ttl: Number(e.target.value) }))}
                style={{ width: '100%', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px', background: 'var(--card-bg)', color: 'var(--text-primary)' }}>
                <option value={300}>5 min</option>
                <option value={3600}>1 hour</option>
                <option value={86400}>1 day</option>
              </select>
            </div>
          </div>
          {newRecord.type === 'MX' && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Priority</label>
              <input type="number" value={newRecord.priority || 10} onChange={e => setNewRecord(r => ({ ...r, priority: Number(e.target.value) }))}
                style={{ width: '100px', height: '36px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', background: 'var(--card-bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleAdd} disabled={saving || !newRecord.host || !newRecord.data}
              style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: !newRecord.host || !newRecord.data ? 0.5 : 1, fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save record'}
            </button>
            <button onClick={() => setShowAdd(false)}
              style={{ height: '34px', padding: '0 16px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Records table */}
      <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--card-border)', background: 'var(--card-bg-elevated)' }}>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {loading ? 'Loading records…' : `${records.length} DNS record${records.length !== 1 ? 's' : ''}`}
          </h2>
        </div>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Loading DNS records…</div>
        ) : records.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
            No DNS records found. Add your first record above.
          </div>
        ) : (
          <table className="gsws-table">
            <thead>
              <tr><th>Type</th><th>Host</th><th>Value</th><th>TTL</th><th>Priority</th><th></th></tr>
            </thead>
            <tbody>
              {records.map((r: any, i: number) => (
                <tr key={r.id || i}>
                  <td>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, fontFamily: 'ui-monospace, monospace', ...(typeColor[r.type] || { bg: '#ebebeb', color: '#5a5a5a' }), background: (typeColor[r.type] || { bg: '#ebebeb' }).bg }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-primary)' }}>{r.host || '@'}</td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#5a5a5a' }}>{r.data || r.value}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.ttl}s</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.priority || '—'}</td>
                  <td>
                    <button onClick={() => handleDelete(r)} disabled={deleteId === r.id}
                      style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      {deleteId === r.id ? '…' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
