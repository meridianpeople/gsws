'use client'
import { useState } from 'react'

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'SRV', 'CAA']

const TYPE_COLOR: Record<string, { bg: string; color: string }> = {
  A:     { bg: '#e6f1fb', color: '#185fa5' },
  AAAA:  { bg: '#eeedfe', color: '#534ab7' },
  CNAME: { bg: '#eaf3de', color: '#3b6d11' },
  MX:    { bg: '#faeeda', color: '#854f0b' },
  TXT:   { bg: '#f1efe8', color: '#5a5a5a' },
  NS:    { bg: '#fcebeb', color: '#a32d2d' },
  SOA:   { bg: '#ebebeb', color: '#5a5a5a' },
}

const GEIG_NS = ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']

export default function PackageDNSManager({
  packageId, initialRecords, domainName, currentNameservers,
}: {
  packageId: string
  initialRecords: any[]
  domainName: string
  currentNameservers: string[]
}) {
  const [records, setRecords] = useState(initialRecords)
  const [showAdd, setShowAdd] = useState(false)
  const [editingRecord, setEditingRecord] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [newRecord, setNewRecord] = useState({ type: 'A', host: '', data: '', ttl: 3600, priority: '' })

  // Nameservers state
  const isCustomNS = currentNameservers.length > 0 && !currentNameservers[0]?.includes('stackdns')
  const [nsMode, setNsMode] = useState<'geig' | 'custom'>(isCustomNS ? 'custom' : 'geig')
  const [customNS, setCustomNS] = useState<string[]>(
    isCustomNS ? [...currentNameservers, ...Array(Math.max(0, 4 - currentNameservers.length)).fill('')] : ['', '', '', '']
  )
  const [savingNS, setSavingNS] = useState(false)
  const [nsSuccess, setNsSuccess] = useState('')
  const [nsError, setNsError] = useState('')

  async function handleSaveNameservers() {
    setSavingNS(true)
    setNsError('')
    const ns = nsMode === 'geig' ? GEIG_NS : customNS.filter(n => n.trim())
    if (nsMode === 'custom' && ns.length < 2) {
      setNsError('Enter at least 2 nameservers')
      setSavingNS(false)
      return
    }
    try {
      const res = await fetch(`/api/packages/${packageId}/nameservers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameservers: ns }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update nameservers')
      setNsSuccess('Nameservers updated. Changes may take up to 48 hours to propagate.')
      setTimeout(() => setNsSuccess(''), 6000)
    } catch (err: any) {
      setNsError(err.message)
    } finally {
      setSavingNS(false)
    }
  }

  function handleEdit(record: any) {
    setNewRecord({
      type: record.type,
      host: record.host === domainName ? '@' : record.host.replace(`.${domainName}`, ''),
      data: record.data,
      ttl: record.ttl || 3600,
      priority: record.priority || '',
    })
    setEditingRecord(record)
    setShowAdd(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleAdd() {
    if (!newRecord.host || !newRecord.data) return
    setSaving(true)
    setError('')
    try {
      if (editingRecord?.ref) {
        await fetch(`/api/packages/${packageId}/dns`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingRecord.ref }),
        })
      }
      const res = await fetch(`/api/packages/${packageId}/dns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecord),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save record')
      setSuccess(editingRecord ? 'DNS record updated' : 'DNS record added')
      setShowAdd(false)
      setEditingRecord(null)
      setNewRecord({ type: 'A', host: '', data: '', ttl: 3600, priority: '' })
      const refreshRes = await fetch(`/api/packages/${packageId}/dns`)
      const refreshData = await refreshRes.json()
      if (refreshData.records) setRecords(refreshData.records)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(record: any) {
    if (!record.ref) return
    setDeleting(record.ref)
    try {
      const res = await fetch(`/api/packages/${packageId}/dns`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: record.ref }),
      })
      if (!res.ok) throw new Error('Failed to delete')
      setRecords(r => r.filter(rec => rec.ref !== record.ref))
      setSuccess('Record deleted')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── NAMESERVERS SECTION ── */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>🌐 Nameservers</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Controls where DNS for {domainName} is managed
            </p>
          </div>
          <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: nsMode === 'geig' ? '#eaf3de' : '#faeeda', color: nsMode === 'geig' ? '#3b6d11' : '#854f0b' }}>
            {nsMode === 'geig' ? 'GeiG SWS nameservers' : 'Custom nameservers'}
          </span>
        </div>

        {nsSuccess && <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97', marginBottom: '12px' }}>✓ {nsSuccess}</div>}
        {nsError && <div style={{ padding: '10px 14px', borderRadius: '6px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1', marginBottom: '12px' }}>{nsError}</div>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {/* GeiG option */}
          <div onClick={() => setNsMode('geig')}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${nsMode === 'geig' ? '#1a6ef5' : '#ebebeb'}`, background: nsMode === 'geig' ? '#e8f0fe' : '#fff' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${nsMode === 'geig' ? '#1a6ef5' : '#d4d4d4'}`, background: nsMode === 'geig' ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {nsMode === 'geig' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--card-bg)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>GeiG SWS nameservers <span style={{ fontSize: '11px', fontWeight: 400, color: '#3b6d11' }}>(recommended)</span></p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>DNS records managed here in GSWS control panel</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '8px' }}>
                {GEIG_NS.map((ns, i) => (
                  <span key={ns} style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: '#5a5a5a' }}>NS{i + 1}: {ns}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Custom option */}
          <div onClick={() => setNsMode('custom')}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${nsMode === 'custom' ? '#1a6ef5' : '#ebebeb'}`, background: nsMode === 'custom' ? '#e8f0fe' : '#fff' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${nsMode === 'custom' ? '#1a6ef5' : '#d4d4d4'}`, background: nsMode === 'custom' ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {nsMode === 'custom' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--card-bg)' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Custom nameservers</p>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Use Cloudflare, Route53 or your own DNS provider</p>
              {nsMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                  {customNS.map((ns, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '28px', flexShrink: 0 }}>NS{i + 1}</span>
                      <input value={ns}
                        onChange={e => { const u = [...customNS]; u[i] = e.target.value; setCustomNS(u) }}
                        placeholder={`ns${i + 1}.example.com`}
                        style={{ flex: 1, height: '32px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }}
                      />
                      {customNS.length > 2 && (
                        <button onClick={() => setCustomNS(c => c.filter((_, j) => j !== i))}
                          style={{ width: '26px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', background: 'var(--card-bg)', color: '#a32d2d', cursor: 'pointer', fontSize: '14px' }}>×</button>
                      )}
                    </div>
                  ))}
                  {customNS.length < 6 && (
                    <button onClick={() => setCustomNS(c => [...c, ''])}
                      style={{ alignSelf: 'flex-start', height: '26px', padding: '0 10px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '11px', color: '#1a6ef5', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add nameserver
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {nsMode === 'custom' && (
          <div style={{ padding: '10px 14px', background: '#faeeda', borderRadius: '6px', fontSize: '12px', color: '#854f0b', marginBottom: '14px' }}>
            ⚠️ Using custom nameservers means DNS records in this panel won't be active. Changes take up to 48 hours.
          </div>
        )}

        <button onClick={handleSaveNameservers} disabled={savingNS}
          style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: savingNS ? 'wait' : 'pointer', opacity: savingNS ? 0.7 : 1, fontFamily: 'inherit' }}>
          {savingNS ? 'Updating nameservers…' : 'Save nameservers'}
        </button>
      </div>

      {/* ── DNS RECORDS SECTION ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>📋 DNS records</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {nsMode === 'custom' ? 'DNS records are managed externally via your custom nameservers' : `${records.length} records for ${domainName}`}
            </p>
          </div>
          <button onClick={() => { setShowAdd(s => !s); setEditingRecord(null); setNewRecord({ type: 'A', host: '', data: '', ttl: 3600, priority: '' }) }}
            style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            + Add record
          </button>
        </div>

        {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
        {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

        {showAdd && (
          <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '14px' }}>
              {editingRecord ? '✏️ Edit record' : '+ New DNS record'}
            </h3>
            {editingRecord && (
              <div style={{ padding: '8px 12px', background: '#faeeda', borderRadius: '6px', marginBottom: '12px', fontSize: '12px', color: '#854f0b' }}>
                ℹ️ Editing will delete the existing record and create a new one.
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px', gap: '10px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Type</label>
                <select value={newRecord.type} onChange={e => setNewRecord(r => ({ ...r, type: e.target.value }))}
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px' }}>
                  {RECORD_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Host</label>
                <input value={newRecord.host} onChange={e => setNewRecord(r => ({ ...r, host: e.target.value }))}
                  placeholder="@ or subdomain"
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  {newRecord.type === 'A' ? 'IP address' : newRecord.type === 'MX' ? 'Mail server' : newRecord.type === 'TXT' ? 'Text value' : 'Value'}
                </label>
                <input value={newRecord.data} onChange={e => setNewRecord(r => ({ ...r, data: e.target.value }))}
                  placeholder={newRecord.type === 'A' ? '1.2.3.4' : ''}
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>TTL</label>
                <select value={newRecord.ttl} onChange={e => setNewRecord(r => ({ ...r, ttl: Number(e.target.value) }))}
                  style={{ width: '100%', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', fontFamily: 'inherit', padding: '0 8px' }}>
                  <option value={300}>5 min</option>
                  <option value={3600}>1 hour</option>
                  <option value={86400}>1 day</option>
                </select>
              </div>
            </div>
            {newRecord.type === 'MX' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Priority</label>
                <input type="number" value={newRecord.priority} onChange={e => setNewRecord(r => ({ ...r, priority: e.target.value }))}
                  placeholder="10"
                  style={{ width: '100px', height: '34px', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit' }} />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleAdd} disabled={saving || !newRecord.host || !newRecord.data}
                style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newRecord.host || !newRecord.data ? 0.5 : 1 }}>
                {saving ? 'Saving…' : editingRecord ? 'Update record' : 'Add record'}
              </button>
              <button onClick={() => { setShowAdd(false); setEditingRecord(null); setNewRecord({ type: 'A', host: '', data: '', ttl: 3600, priority: '' }) }}
                style={{ height: '32px', padding: '0 14px', background: 'var(--card-bg)', color: 'var(--text-primary)', border: '1px solid var(--card-border-hover)', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '10px', overflow: 'hidden' }}>
          {records.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>No DNS records found.</div>
          ) : (
            <table className="gsws-table">
              <thead>
                <tr><th>Type</th><th>Host</th><th>Value</th><th>TTL</th><th>Priority</th><th></th></tr>
              </thead>
              <tbody>
                {records.map((r: any, i: number) => {
                  const tc = TYPE_COLOR[r.type] || { bg: '#ebebeb', color: '#5a5a5a' }
                  return (
                    <tr key={r.ref || i}>
                      <td><span style={{ padding: '2px 7px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, fontFamily: 'ui-monospace, monospace', background: tc.bg, color: tc.color }}>{r.type}</span></td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: 'var(--text-primary)' }}>{r.host}</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#5a5a5a', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.data}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.ttl}s</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{r.priority || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {r.ref && <>
                            <button onClick={() => handleEdit(r)}
                              style={{ padding: '0 10px', height: '24px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '11px', color: 'var(--text-primary)', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                              Edit
                            </button>
                            <button onClick={() => handleDelete(r)} disabled={deleting === r.ref}
                              style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit' }}>
                              {deleting === r.ref ? '…' : 'Delete'}
                            </button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
