'use client'
import { useState, useEffect } from 'react'

type EmailTab = 'mailboxes' | 'forwarders' | 'catchall' | 'autoresponders' | 'dkim' | 'dmarc' | 'spam' | 'settings'

export default function EmailManager({
  packageId, domainName, emailDomains, initialMailboxes, initialForwarders,
}: {
  packageId: string
  domainName: string
  emailDomains: string[]
  initialMailboxes: any[]
  initialForwarders: any[]
}) {
  const [tab, setTab] = useState<EmailTab>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as EmailTab
      const valid: EmailTab[] = ['mailboxes','forwarders','catchall','autoresponders','dkim','dmarc','spam','settings']
      if (valid.includes(hash)) return hash
    }
    return 'mailboxes'
  })
  const [mailboxes, setMailboxes] = useState(initialMailboxes)
  const [forwarders, setForwarders] = useState<any[]>([])
  const [catchAlls, setCatchAlls] = useState<any[]>([])
  const [wildcards, setWildcards] = useState<any[]>([])
  const [newWildcard, setNewWildcard] = useState({ domain: '' })
  const [autoresponders, setAutoresponders] = useState<any[]>([])
  const [dkim, setDkim] = useState<any[]>([])
  const [dmarc, setDmarc] = useState<any[]>([])
  const [spamBlacklist, setSpamBlacklist] = useState<any[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [changingPwd, setChangingPwd] = useState<string | null>(null)
  const [newEmailPwd, setNewEmailPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState(false)
  const [newMailbox, setNewMailbox] = useState({ local: '', password: '', quotaMB: 1000 })
  const [newForwarder, setNewForwarder] = useState({ local: '', remote: '' })
  const [newCatchAll, setNewCatchAll] = useState({ forward: '' })
  const [newAutoresponder, setNewAutoresponder] = useState({ local: '', subject: '', message: '' })
  const [newSpam, setNewSpam] = useState({ email: '' })

  function switchTab(newTab: EmailTab) {
    setTab(newTab)
    if (typeof window !== 'undefined') {
      history.replaceState(null, '', window.location.pathname + '#' + newTab)
    }
  }

  const domain = emailDomains[0] || domainName
  const [selectedDomain, setSelectedDomain] = useState(domain)

  useEffect(() => {
    loadEmailData()
  }, [selectedDomain])

  async function loadEmailData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/email/all?domain=${encodeURIComponent(selectedDomain)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `Request failed with status code ${res.status}`)
      setMailboxes(data.mailboxes || [])
      setForwarders(data.forwards || [])
      setCatchAlls(data.catchalls || [])
      setWildcards(data.wildcards || [])
      setAutoresponders(data.autoresponders || [])
      setDkim(data.dkim || [])
      setDmarc(data.dmarc || [])
      setSpamBlacklist(data.spamBlacklist || [])
    } catch (err: any) {
      // Silently ignore load errors - user will see empty state
    }
    setLoading(false)
  }

  function showSuccess(msg: string) { setSuccess(msg); setTimeout(() => setSuccess(''), 4000) }
  function showError(msg: string) {
    if (!msg) return
    const friendly = msg.includes('500') || msg.includes('Resource not found')
      ? 'This feature is not available for this package type'
      : msg
    setError(friendly)
    setTimeout(() => setError(''), 6000)
  }

  async function apiPost(path: string, body: any) {
    const res = await fetch(`/api/packages/${packageId}/email/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: selectedDomain, ...body }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }

  async function apiDelete(path: string, body: any) {
    const res = await fetch(`/api/packages/${packageId}/email/${path}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: selectedDomain, ...body }),
    })
    if (!res.ok) throw new Error('Delete failed')
  }

  function handleWebmail(local: string) {
    window.open(`https://webmail.${selectedDomain}`, '_blank')
  }
  function handleWebmailDirect() {
    window.open(`https://webmail.${selectedDomain}`, '_blank')
  }

  async function handleChangeEmailPassword(local: string) {
    if (!newEmailPwd || newEmailPwd.length < 8) {
      showError('Password must be at least 8 characters')
      return
    }
    setSavingPwd(true)
    try {
      const res = await fetch(`/api/packages/${packageId}/email/mailbox/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: selectedDomain, local, password: newEmailPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update password')
      showSuccess(`Password updated for ${local}@${selectedDomain}`)
      setChangingPwd(null)
      setNewEmailPwd('')
    } catch (err: any) {
      showError(err.message)
    } finally {
      setSavingPwd(false)
    }
  }

  async function handleAddMailbox() {
    if (!newMailbox.local || !newMailbox.password) return
    setSaving(true)
    try {
      await apiPost('mailbox', newMailbox)
      showSuccess(`${newMailbox.local}@${selectedDomain} created`)
      setNewMailbox({ local: '', password: '', quotaMB: 1000 })
      setShowAdd(false)
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  async function handleAddForwarder() {
    if (!newForwarder.local || !newForwarder.remote) return
    setSaving(true)
    try {
      await apiPost('forwarder', { domain: selectedDomain, local: newForwarder.local, remote: newForwarder.remote })
      showSuccess(`Forwarder created`)
      setNewForwarder({ local: '', remote: '' })
      setShowAdd(false)
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  async function handleAddCatchAll() {
    if (!newCatchAll.forward) return
    setSaving(true)
    try {
      await apiPost('catchall', newCatchAll)
      showSuccess('Catch-all forwarder set')
      setNewCatchAll({ forward: '' })
      setShowAdd(false)
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  async function handleAddAutoresponder() {
    if (!newAutoresponder.local || !newAutoresponder.message) return
    setSaving(true)
    try {
      await apiPost('autoresponder', newAutoresponder)
      showSuccess('Autoresponder created')
      setNewAutoresponder({ local: '', subject: '', message: '' })
      setShowAdd(false)
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  async function handleEnableDKIM() {
    setSaving(true)
    try {
      await apiPost('dkim', {})
      showSuccess('DKIM enabled')
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  async function handleAddSpamBlock() {
    if (!newSpam.email) return
    setSaving(true)
    try {
      await apiPost('spam', { email: newSpam.email })
      showSuccess(`${newSpam.email} blocked`)
      setNewSpam({ email: '' })
      await loadEmailData()
    } catch (err: any) { showError(err.message) }
    setSaving(false)
  }

  const TABS = [
    { key: 'mailboxes', label: '📧 Accounts', count: mailboxes.length },
    { key: 'forwarders', label: '↪️ Forwarders', count: forwarders.length },
    { key: 'catchall', label: '🌐 Catch-all', count: catchAlls.length },
    { key: 'autoresponders', label: '🤖 Auto-reply', count: autoresponders.length },
    { key: 'dkim', label: '🔑 DKIM', count: null },
    { key: 'dmarc', label: '🛡️ DMARC', count: null },
    { key: 'spam', label: '🚫 Spam', count: spamBlacklist.length },
    { key: 'settings', label: '⚙️ Settings', count: null },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Domain selector */}
      {emailDomains.length > 1 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {emailDomains.map(d => (
            <button key={d} onClick={() => setSelectedDomain(d)}
              style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 500, background: d === selectedDomain ? '#e8f0fe' : '#f7f7f7', border: `1px solid ${d === selectedDomain ? '#1a6ef5' : '#ebebeb'}`, color: d === selectedDomain ? '#1a6ef5' : '#5a5a5a', fontFamily: 'ui-monospace, monospace', cursor: 'pointer' }}>
              {d}
            </button>
          ))}
        </div>
      )}

      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid #ebebeb', overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => { switchTab(t.key as EmailTab); setShowAdd(false) }}
            style={{ padding: '8px 12px', fontSize: '12px', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#1a6ef5' : '#9a9a9a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', borderBottom: `2px solid ${tab === t.key ? '#1a6ef5' : 'transparent'}`, marginBottom: '-1px', whiteSpace: 'nowrap' }}>
            {t.label}{t.count !== null ? ` (${t.count})` : ''}
          </button>
        ))}
      </div>

      {loading && <div style={{ padding: '24px', textAlign: 'center', color: '#9a9a9a', fontSize: '13px' }}>Loading…</div>}

      {/* MAILBOXES */}
      {!loading && tab === 'mailboxes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>{mailboxes.length} account{mailboxes.length !== 1 ? 's' : ''} for @{selectedDomain}</p>
            <button onClick={() => setShowAdd(s => !s)}
              style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              + Create account
            </button>
          </div>
          {showAdd && (
            <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Create email account</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Username</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input value={newMailbox.local} onChange={e => setNewMailbox(m => ({ ...m, local: e.target.value }))}
                      placeholder="info"
                      style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
                    <span style={{ fontSize: '12px', color: '#9a9a9a', whiteSpace: 'nowrap' }}>@{selectedDomain}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Password</label>
                  <input type="password" value={newMailbox.password} onChange={e => setNewMailbox(m => ({ ...m, password: e.target.value }))}
                    placeholder="Strong password"
                    style={{ width: '100%', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Quota (MB) — 0 = unlimited</label>
                <input type="number" value={newMailbox.quotaMB} onChange={e => setNewMailbox(m => ({ ...m, quotaMB: Number(e.target.value) }))}
                  style={{ width: '150px', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddMailbox} disabled={saving || !newMailbox.local || !newMailbox.password}
                  style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newMailbox.local || !newMailbox.password ? 0.5 : 1 }}>
                  {saving ? 'Creating…' : 'Create account'}
                </button>
                <button onClick={() => setShowAdd(false)} style={{ height: '32px', padding: '0 14px', background: '#fff', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
            {mailboxes.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <p style={{ fontSize: '32px', marginBottom: '8px' }}>📭</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>No email accounts</p>
                <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>Create your first account for @{selectedDomain}</p>
              </div>
            ) : (
              <table className="gsws-table">
                <thead><tr><th>Email address</th><th>Quota</th><th>Usage</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {mailboxes.map((mb: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{mb.local}@{selectedDomain}</td>
                      <td style={{ fontSize: '12px', color: '#9a9a9a' }}>{mb.quotaMB ? `${mb.quotaMB} MB` : 'Unlimited'}</td>
                      <td style={{ fontSize: '12px', color: '#9a9a9a' }}>{mb.usageMB ? `${Number(mb.usageMB).toFixed(1)} MB` : '—'}</td>
                      <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: mb.enabled !== false ? '#eaf3de' : '#f7f7f7', color: mb.enabled !== false ? '#3b6d11' : '#9a9a9a' }}>{mb.enabled !== false ? 'Active' : 'Disabled'}</span></td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => handleWebmail(mb.local)} style={{ padding: '0 10px', height: '24px', border: '1px solid #1a6ef5', borderRadius: '4px', fontSize: '11px', color: '#1a6ef5', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Webmail ↗</button>
                            <button onClick={() => { setChangingPwd(changingPwd === mb.local ? null : mb.local); setNewEmailPwd('') }} style={{ padding: '0 10px', height: '24px', border: '1px solid #854f0b', borderRadius: '4px', fontSize: '11px', color: '#854f0b', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Change password</button>
                            <button onClick={() => { if(confirm(`Delete ${mb.local}@${selectedDomain}?`)) apiDelete('mailbox', { local: mb.local }).then(() => { showSuccess('Deleted'); loadEmailData() }).catch(e => showError(e.message)) }} style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
                          </div>
                          {changingPwd === mb.local && (
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="password"
                                value={newEmailPwd}
                                onChange={e => setNewEmailPwd(e.target.value)}
                                placeholder="New password (min 8 chars)"
                                style={{ flex: 1, height: '28px', border: '1px solid #d4d4d4', borderRadius: '4px', fontSize: '12px', padding: '0 8px', fontFamily: 'inherit' }}
                              />
                              <button onClick={() => handleChangeEmailPassword(mb.local)} disabled={savingPwd}
                                style={{ height: '28px', padding: '0 12px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
                                {savingPwd ? '…' : 'Save'}
                              </button>
                              <button onClick={() => { setChangingPwd(null); setNewEmailPwd('') }}
                                style={{ height: '28px', padding: '0 8px', background: '#fff', border: '1px solid #d4d4d4', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}>
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* FORWARDERS */}
      {!loading && tab === 'forwarders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>{forwarders.length} forwarder{forwarders.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAdd(s => !s)} style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add forwarder</button>
          </div>
          {showAdd && (
            <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Add forwarder</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '8px', alignItems: 'end', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>From</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input value={newForwarder.local} onChange={e => setNewForwarder(f => ({ ...f, local: e.target.value }))} placeholder="info"
                      style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
                    <span style={{ fontSize: '12px', color: '#9a9a9a', whiteSpace: 'nowrap' }}>@{selectedDomain}</span>
                  </div>
                </div>
                <div style={{ fontSize: '18px', color: '#9a9a9a', paddingBottom: '4px' }}>→</div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>To</label>
                  <input value={newForwarder.remote} onChange={e => setNewForwarder(f => ({ ...f, remote: e.target.value }))} placeholder="destination@example.com"
                    style={{ width: '100%', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddForwarder} disabled={saving || !newForwarder.local || !newForwarder.remote} style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newForwarder.local || !newForwarder.remote ? 0.5 : 1 }}>{saving ? 'Adding…' : 'Add forwarder'}</button>
                <button onClick={() => setShowAdd(false)} style={{ height: '32px', padding: '0 14px', background: '#fff', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
            {forwarders.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ fontSize: '32px', marginBottom: '8px' }}>↪️</p><p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>No forwarders</p><p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>Forward emails from @{selectedDomain} to any address</p></div>
            ) : (
              <table className="gsws-table">
                <thead><tr><th>From</th><th></th><th>To</th><th></th></tr></thead>
                <tbody>
                  {forwarders.map((f: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{f.local}@{selectedDomain}</td>
                      <td style={{ color: '#9a9a9a' }}>→</td>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#5a5a5a' }}>{f.remote || f.forward}</td>
                      <td><button onClick={() => apiDelete('forwarder', { local: f.local }).then(() => { showSuccess('Deleted'); loadEmailData() }).catch(e => showError(e.message))} style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* CATCH-ALL */}
      {!loading && tab === 'catchall' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Catch-all forwarders */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>Catch-All Forwarder</h3>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '14px' }}>Forward any email sent to a non-existent address at @{selectedDomain} to a specific email address.</p>
            {catchAlls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {catchAlls.map((ca: any, i: number) => (
                  <div key={ca.id || i} style={{ padding: '10px 14px', background: '#eaf3de', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>anything@{selectedDomain} →</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#3b6d11', fontFamily: 'ui-monospace, monospace' }}>{ca.remote || ca.forward || String(ca)}</p>
                    </div>
                    <button onClick={() => { apiDelete('catchall', { catchallId: ca.id }).then(() => { showSuccess('Catch-all removed'); loadEmailData() }).catch((e: any) => showError(e.message)) }}
                      style={{ padding: '0 10px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Destination email address</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input value={newCatchAll.forward} onChange={e => setNewCatchAll({ forward: e.target.value })} placeholder="user@example.com"
                  style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
                <button onClick={handleAddCatchAll} disabled={saving || !newCatchAll.forward}
                  style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, opacity: !newCatchAll.forward ? 0.5 : 1 }}>
                  {saving ? 'Saving…' : 'Add Catch-All'}
                </button>
              </div>
            </div>
          </div>

          {/* Wildcard forwarders */}
          <div className="gsws-card">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0a0a0a', marginBottom: '4px' }}>Wildcard Forwarder</h3>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '14px' }}>
              Forward any email at @{selectedDomain} to the same username at a different domain. For example, sales@{selectedDomain} → sales@example.com.
            </p>
            {wildcards.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                {wildcards.map((w: any, i: number) => (
                  <div key={w.id || i} style={{ padding: '10px 14px', background: '#e8f0fe', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '11px', color: '#9a9a9a', marginBottom: '2px' }}>*@{selectedDomain} →</p>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#185fa5', fontFamily: 'ui-monospace, monospace' }}>*@{w.remote || w.forward || String(w)}</p>
                    </div>
                    <button onClick={() => { apiDelete('wildcard', { wildcardId: w.id }).then(() => { showSuccess('Wildcard removed'); loadEmailData() }).catch((e: any) => showError(e.message)) }}
                      style={{ padding: '0 10px', height: '26px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
            <div>
              <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Destination domain</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#9a9a9a', flexShrink: 0 }}>*@{selectedDomain} →</span>
                <span style={{ fontSize: '13px', color: '#9a9a9a', flexShrink: 0 }}>*@</span>
                <input value={newWildcard.domain} onChange={e => setNewWildcard({ domain: e.target.value })} placeholder="example.com"
                  style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
                <button onClick={async () => {
                    if (!newWildcard.domain) return
                    setSaving(true)
                    try {
                      await apiPost('wildcard', { forward: newWildcard.domain })
                      showSuccess('Wildcard forwarder added')
                      setNewWildcard({ domain: '' })
                      await loadEmailData()
                    } catch (err: any) { showError(err.message) }
                    setSaving(false)
                  }} disabled={saving || !newWildcard.domain}
                  style={{ height: '34px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, opacity: !newWildcard.domain ? 0.5 : 1 }}>
                  {saving ? 'Saving…' : 'Add Forwarder'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* AUTORESPONDERS */}
      {!loading && tab === 'autoresponders' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: '13px', color: '#9a9a9a' }}>{autoresponders.length} autoresponder{autoresponders.length !== 1 ? 's' : ''}</p>
            <button onClick={() => setShowAdd(s => !s)} style={{ height: '32px', padding: '0 14px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>+ Add autoresponder</button>
          </div>
          {showAdd && (
            <div className="gsws-card" style={{ border: '2px solid #1a6ef5' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Add autoresponder</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Email address</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input value={newAutoresponder.local} onChange={e => setNewAutoresponder(a => ({ ...a, local: e.target.value }))} placeholder="info"
                      style={{ width: '180px', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
                    <span style={{ fontSize: '12px', color: '#9a9a9a' }}>@{selectedDomain}</span>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Subject</label>
                  <input value={newAutoresponder.subject} onChange={e => setNewAutoresponder(a => ({ ...a, subject: e.target.value }))} placeholder="Thank you for your email"
                    style={{ width: '100%', height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '0 10px', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#9a9a9a', display: 'block', marginBottom: '4px' }}>Message</label>
                  <textarea value={newAutoresponder.message} onChange={e => setNewAutoresponder(a => ({ ...a, message: e.target.value }))} placeholder="Thank you for contacting us..."
                    rows={4} style={{ width: '100%', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', padding: '8px 10px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleAddAutoresponder} disabled={saving || !newAutoresponder.local || !newAutoresponder.message} style={{ height: '32px', padding: '0 18px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newAutoresponder.local || !newAutoresponder.message ? 0.5 : 1 }}>{saving ? 'Saving…' : 'Save autoresponder'}</button>
                <button onClick={() => setShowAdd(false)} style={{ height: '32px', padding: '0 14px', background: '#fff', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ background: '#fff', border: '1px solid #ebebeb', borderRadius: '10px', overflow: 'hidden' }}>
            {autoresponders.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center' }}><p style={{ fontSize: '32px', marginBottom: '8px' }}>🤖</p><p style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a' }}>No autoresponders</p><p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '4px' }}>Send automatic replies to incoming emails</p></div>
            ) : (
              <table className="gsws-table">
                <thead><tr><th>Email</th><th>Subject</th><th></th></tr></thead>
                <tbody>
                  {autoresponders.map((a: any, i: number) => (
                    <tr key={i}>
                      <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{a.local}@{selectedDomain}</td>
                      <td style={{ fontSize: '12px', color: '#5a5a5a' }}>{a.subject || '—'}</td>
                      <td><button style={{ padding: '0 10px', height: '24px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* DKIM */}
      {!loading && tab === 'dkim' && (
        <div className="gsws-card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>🔑 DKIM (DomainKeys)</h3>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '16px' }}>DKIM adds a digital signature to outgoing emails, improving deliverability and preventing spoofing.</p>
          {dkim.length > 0 ? (
            <div>
              {dkim.map((d: any, i: number) => (
                <div key={i} style={{ padding: '12px 16px', background: '#eaf3de', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: '#3b6d11', color: '#fff' }}>Active</span>
                    <span style={{ fontSize: '12px', color: '#3b6d11', fontWeight: 500 }}>DKIM enabled for {d.domain || selectedDomain}</span>
                  </div>
                  {d.publicKey && <p style={{ fontSize: '11px', fontFamily: 'ui-monospace, monospace', color: '#5a5a5a', wordBreak: 'break-all' }}>{d.publicKey.substring(0, 80)}…</p>}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ padding: '16px', background: '#faeeda', borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: '#854f0b' }}>
                ⚠️ DKIM is not enabled. Without DKIM, emails may be marked as spam.
              </div>
              <button onClick={handleEnableDKIM} disabled={saving} style={{ height: '34px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                {saving ? 'Enabling…' : 'Enable DKIM'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* DMARC */}
      {!loading && tab === 'dmarc' && (
        <div className="gsws-card">
          <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>🛡️ DMARC Policy</h3>
          <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '16px' }}>DMARC tells receiving mail servers what to do with emails that fail SPF or DKIM checks.</p>
          {dmarc.length > 0 ? (
            dmarc.map((d: any, i: number) => (
              <div key={i} style={{ padding: '12px 16px', background: '#eaf3de', borderRadius: '8px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#3b6d11' }}>DMARC configured</p>
                <p style={{ fontSize: '12px', color: '#5a5a5a', marginTop: '4px', fontFamily: 'ui-monospace, monospace' }}>{JSON.stringify(d)}</p>
              </div>
            ))
          ) : (
            <div style={{ padding: '16px', background: '#faeeda', borderRadius: '8px', fontSize: '12px', color: '#854f0b' }}>
              ⚠️ No DMARC policy set. Contact support or use the DNS records tab to add a DMARC TXT record.
            </div>
          )}
        </div>
      )}

      {/* SPAM */}
      {!loading && tab === 'spam' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '8px' }}>Block email addresses</h3>
            <p style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '12px' }}>Emails from blocked addresses will be rejected automatically.</p>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input value={newSpam.email} onChange={e => setNewSpam({ email: e.target.value })} placeholder="spam@example.com"
                style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px' }} />
              <button onClick={handleAddSpamBlock} disabled={saving || !newSpam.email} style={{ height: '34px', padding: '0 16px', background: '#a32d2d', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', opacity: !newSpam.email ? 0.5 : 1 }}>Block</button>
            </div>
            {spamBlacklist.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#9a9a9a' }}>No blocked addresses.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {spamBlacklist.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: '#fcebeb', borderRadius: '6px' }}>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#a32d2d' }}>{s.email || s}</span>
                    <button style={{ padding: '0 8px', height: '22px', border: '1px solid #f5c1c1', borderRadius: '4px', fontSize: '11px', color: '#a32d2d', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SETTINGS */}
      {!loading && tab === 'settings' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="gsws-card">
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '14px' }}>Mail server settings</h3>
            {[
              ['IMAP server', 'imap.geig.co.uk', 'Port 993 (SSL) · 143 (non-SSL)'],
              ['POP3 server', 'pop3.geig.co.uk', 'Port 995 (SSL) · 110 (non-SSL)'],
              ['SMTP server', 'smtp.geig.co.uk', 'Port 465 (SSL) · 587 (TLS) · 25'],
              ['Webmail', `https://webmail.${selectedDomain}`, 'Browser-based email'],
              ['Username', `your-address@${selectedDomain}`, 'Full email address'],
              ['Authentication', 'Required', 'IMAP, POP3 and SMTP'],
            ].map(([label, value, note]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #ebebeb', fontSize: '12px' }}>
                <span style={{ color: '#9a9a9a', width: '140px' }}>{label}</span>
                <span style={{ fontFamily: 'ui-monospace, monospace', fontWeight: 500, color: '#0a0a0a' }}>{value}</span>
                <span style={{ fontSize: '11px', color: '#9a9a9a' }}>{note}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
