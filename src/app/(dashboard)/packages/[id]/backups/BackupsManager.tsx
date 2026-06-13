'use client'
import { useState } from 'react'

export default function BackupsManager({ packageId, backupData, webJobs, domainName }: {
  packageId: string
  backupData: any
  webJobs: any[]
  domainName: string
}) {
  const [creating, setCreating] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [backupType, setBackupType] = useState<'files' | 'databases' | 'both'>('files')

  const canBackup = backupData?.canBackUp !== false
  const databases = backupData?.database ? Object.values(backupData.database) as any[] : []
  const webSnapshots = backupData?.web?.snapshotTimes || []
  const webJobHistory = (backupData?.web?.jobs || []).filter((j: any) => j.QueueStatus === 'success')
  const lastSnapshot = webSnapshots[webSnapshots.length - 1]

  async function handleCreateBackup(type: string, databaseId?: string | number) {
    setCreating(true)
    setError('')
    try {
      const res = await fetch(`/api/packages/${packageId}/backups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, databaseId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create backup')
      setSuccess('Backup job queued successfully. This may take a few minutes.')
      setTimeout(() => { setSuccess(''); window.location.reload() }, 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#fcebeb', color: '#a32d2d', border: '1px solid #f5c1c1' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#eaf3de', color: '#3b6d11', border: '1px solid #c0dd97' }}>✓ {success}</div>}

      {/* Create backup */}
      <div className="gsws-card">
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>Create backup</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Take an on-demand snapshot outside the normal backup schedule.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
          {[
            { value: 'files', label: 'Files', desc: 'Snapshot of all website files' },
            { value: 'databases', label: 'Databases', desc: 'Snapshot of all MySQL databases' },
            { value: 'both', label: 'Files & Databases', desc: 'Full backup of files and databases' },
          ].map(opt => (
            <div key={opt.value} onClick={() => setBackupType(opt.value as any)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', border: `1.5px solid ${backupType === opt.value ? '#1a6ef5' : 'var(--card-border)'}`, background: backupType === opt.value ? '#e8f0fe' : 'var(--card-bg)' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: `2px solid ${backupType === opt.value ? '#1a6ef5' : 'var(--card-border-hover)'}`, background: backupType === opt.value ? '#1a6ef5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {backupType === opt.value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--card-bg)' }} />}
              </div>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: backupType === opt.value ? '#0a0a0a' : 'var(--text-primary)' }}>{opt.label}</p>
                <p style={{ fontSize: '11px', color: backupType === opt.value ? '#5a5a5a' : 'var(--text-secondary)' }}>{opt.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <button onClick={() => {
          if (backupType === 'both') {
            handleCreateBackup('web')
            databases.forEach((d: any) => handleCreateBackup('database', d.id))
          } else if (backupType === 'databases') {
            databases.forEach((d: any) => handleCreateBackup('database', d.id))
          } else {
            handleCreateBackup('web')
          }
        }} disabled={creating || !canBackup}
          style={{ height: '36px', padding: '0 20px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: creating || !canBackup ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: creating || !canBackup ? 0.7 : 1 }}>
          {creating ? 'Creating backup…' : 'Create backup'}
        </button>
      </div>

      {/* Timeline - Webspace */}
      <div className="gsws-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>🌐</span>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Webspace</h3>
          </div>
          {lastSnapshot && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Last snapshot: {new Date(lastSnapshot).toLocaleString('en-GB')}</span>}
        </div>

        {webSnapshots.length === 0 && webJobHistory.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', border: '1px dashed var(--card-border-hover)', borderRadius: '8px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>No snapshots yet. Click "Create backup" to take one now.</p>
          </div>
        ) : (
          <table className="gsws-table">
            <thead><tr><th>Snapshot time</th><th>Type</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {webSnapshots.slice().reverse().slice(0, 10).map((snap: any, i: number) => (
                <tr key={'snap-' + i}>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>{new Date(snap).toLocaleString('en-GB')}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Automatic</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>Available</span></td>
                  <td>
                    <button onClick={() => { if(confirm('Restore website to this snapshot?')) alert('Contact support to restore: support@geig.co.uk') }}
                      style={{ padding: '0 10px', height: '24px', border: '1px solid var(--card-border-hover)', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', background: 'var(--card-bg)', fontFamily: 'inherit' }}>
                      Restore
                    </button>
                  </td>
                </tr>
              ))}
              {webJobHistory.map((job: any, i: number) => (
                <tr key={'job-' + i}>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>{new Date(job.UpdatedAt || job.CreatedAt).toLocaleString('en-GB')}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>On-demand</td>
                  <td><span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, background: '#eaf3de', color: '#3b6d11' }}>✅ Completed</span></td>
                  <td>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Snapshot #{job.SnapshotId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Active jobs - only show in-progress */}
        {webJobs.filter((j: any) => j.QueueStatus !== 'success' && j.QueueStatus !== 'failed').length > 0 && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '6px' }}>In progress</p>
            {webJobs.filter((j: any) => j.QueueStatus !== 'success' && j.QueueStatus !== 'failed').map((job: any, i: number) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#faeeda', borderRadius: '4px', marginBottom: '4px', fontSize: '12px' }}>
                <span style={{ color: '#854f0b', fontWeight: 500 }}>🔄 {job.Action || 'snapshot'} — {job.QueueStatus || 'queued'}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{job.CreatedAt ? new Date(job.CreatedAt).toLocaleString('en-GB') : ''}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Databases */}
      {databases.length > 0 && (
        <div className="gsws-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '16px' }}>🗄️</span>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Databases</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
          <table className="gsws-table" style={{ minWidth: '500px' }}>
            <thead><tr><th>Database</th><th>Last snapshot</th><th>Snapshots</th><th></th></tr></thead>
            <tbody>
              {databases.map((d: any) => {
                const lastSnap = d.lastSnapshotTime?.[0] || d.snapshotTimes?.[d.snapshotTimes?.length - 1]
                return (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', fontWeight: 600 }}>{d.name}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {lastSnap ? new Date(lastSnap).toLocaleString('en-GB') : 'No backups'}
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.snapshotTimes?.length || 0}</td>
                    <td>
                      <button onClick={() => handleCreateBackup('database', d.id)} disabled={creating}
                        style={{ padding: '0 10px', height: '24px', border: '1px solid #1a6ef5', borderRadius: '4px', fontSize: '11px', color: '#1a6ef5', background: 'var(--card-bg)', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                        Backup now
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 16px', background: 'var(--card-bg-elevated)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '8px' }}>
        <span>ℹ️</span>
        <span>Timeline backups run automatically every day with 30-day retention. On-demand snapshots are available anytime. For backup assistance contact <a href="mailto:support@geig.co.uk" style={{ color: '#1a6ef5' }}>support@geig.co.uk</a>.</span>
      </div>
    </div>
  )
}
