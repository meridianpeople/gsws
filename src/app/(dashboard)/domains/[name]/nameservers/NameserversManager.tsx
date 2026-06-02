'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_NS = ['ns1.stackdns.com', 'ns2.stackdns.com', 'ns3.stackdns.com', 'ns4.stackdns.com']

export default function NameserversManager({ domainName, paramName }: { domainName: string; paramName: string }) {
  const [nameservers, setNameservers] = useState<string[]>([])
  const [custom, setCustom] = useState<string[]>(['', ''])
  const [mode, setMode] = useState<'geig' | 'custom'>('geig')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch(`/api/domains/${encodeURIComponent(domainName)}/nameservers`)
      .then(r => r.json())
      .then(d => {
        const ns = d.nameservers || DEFAULT_NS
        setNameservers(ns)
        const isCustom = !ns.some((n: string) => n.includes('stackdns'))
        if (isCustom) {
          setMode('custom')
          setCustom(ns.length >= 2 ? ns : [...ns, ...Array(4 - ns.length).fill('')])
        }
      })
      .catch(() => setNameservers(DEFAULT_NS))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setError('')
    const ns = mode === 'geig' ? DEFAULT_NS : custom.filter(n => n.trim())
    if (mode === 'custom' && ns.length < 2) {
      setError('Please enter at least 2 nameservers')
      setSaving(false)
      return
    }
    try {
      const res = await fetch(`/api/domains/${encodeURIComponent(domainName)}/nameservers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nameservers: ns }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update nameservers')
      setSuccess('Nameservers updated successfully. Changes may take up to 48 hours to propagate.')
      setNameservers(ns)
      setTimeout(() => setSuccess(''), 6000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '700px' }}>
      <div>
        <div style={{ fontSize: '12px', color: '#9a9a9a', marginBottom: '4px' }}>
          <Link href="/domains" style={{ color: '#1a6ef5' }}>Domains</Link> ›{' '}
          <Link href={`/domains/${paramName}`} style={{ color: '#1a6ef5' }}>{domainName}</Link> › Nameservers
        </div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: '#0a0a0a' }}>Nameservers</h1>
        <p style={{ fontSize: '13px', color: '#9a9a9a', marginTop: '3px' }}>
          Control where DNS for <strong>{domainName}</strong> is managed.
        </p>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Mode selector */}
      <div className="gsws-card">
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '16px' }}>Nameserver configuration</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          <div onClick={() => setMode('geig')}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${mode === 'geig' ? '#1a6ef5' : '#ebebeb'}`, background: mode === 'geig' ? '#e8f0fe' : '#fff' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${mode === 'geig' ? '#1a6ef5' : '#d4d4d4'}`, background: mode === 'geig' ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {mode === 'geig' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>GeiG SWS nameservers (recommended)</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Use GeiG's default nameservers. DNS records are managed in this control panel.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
                {DEFAULT_NS.map((ns, i) => (
                  <span key={i} style={{ fontSize: '12px', fontFamily: 'ui-monospace, monospace', color: '#5a5a5a' }}>
                    NS{i + 1}: {ns}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div onClick={() => setMode('custom')}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 16px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${mode === 'custom' ? '#1a6ef5' : '#ebebeb'}`, background: mode === 'custom' ? '#e8f0fe' : '#fff' }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: `2px solid ${mode === 'custom' ? '#1a6ef5' : '#d4d4d4'}`, background: mode === 'custom' ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              {mode === 'custom' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a' }}>Custom nameservers</p>
              <p style={{ fontSize: '12px', color: '#9a9a9a', marginTop: '2px' }}>Use your own nameservers (e.g. Cloudflare, Route53). DNS records will be managed externally.</p>
              {mode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '12px' }}>
                  {custom.map((ns, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', color: '#9a9a9a', width: '28px', flexShrink: 0 }}>NS{i + 1}</span>
                      <input
                        value={ns}
                        onChange={e => {
                          const updated = [...custom]
                          updated[i] = e.target.value
                          setCustom(updated)
                        }}
                        placeholder={`ns${i + 1}.example.com`}
                        style={{ flex: 1, height: '34px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '13px', fontFamily: 'ui-monospace, monospace', padding: '0 10px', background: '#fff', color: '#0a0a0a' }}
                      />
                      {custom.length > 2 && (
                        <button onClick={() => setCustom(c => c.filter((_, j) => j !== i))}
                          style={{ width: '28px', height: '28px', border: '1px solid #f5c1c1', borderRadius: '4px', background: '#fff', color: '#a32d2d', cursor: 'pointer', fontSize: '14px', flexShrink: 0 }}>
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  {custom.length < 6 && (
                    <button onClick={() => setCustom(c => [...c, ''])}
                      style={{ alignSelf: 'flex-start', height: '28px', padding: '0 12px', border: '1px solid #d4d4d4', borderRadius: '6px', fontSize: '12px', color: '#1a6ef5', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
                      + Add nameserver
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {mode === 'custom' && (
          <div style={{ padding: '10px 14px', background: '#faeeda', borderRadius: '6px', fontSize: '12px', color: '#854f0b', marginBottom: '16px' }}>
            ⚠️ Using custom nameservers means DNS records in this control panel will not be active. Changes take up to 48 hours to propagate.
          </div>
        )}

        <button onClick={handleSave} disabled={saving || loading}
          style={{ height: '38px', padding: '0 24px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}>
          {saving ? 'Updating nameservers…' : 'Update nameservers'}
        </button>
      </div>

      {/* Current */}
      <div className="gsws-card">
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#0a0a0a', marginBottom: '12px' }}>Current nameservers</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {loading ? (
            <p style={{ fontSize: '12px', color: '#9a9a9a' }}>Loading…</p>
          ) : nameservers.map((ns, i) => (
            <div key={i} style={{ padding: '8px 12px', background: '#f7f7f7', borderRadius: '6px', fontFamily: 'ui-monospace, monospace', fontSize: '12px', color: '#0a0a0a' }}>
              NS{i + 1}: {ns}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
