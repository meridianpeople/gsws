'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Task {
  Id: string
  Command: string
  Enabled: boolean
  MailTo: string
  TimeSpec: string
}

const COMMON_SCHEDULES = [
  { label: 'Every minute',    value: '* * * * *' },
  { label: 'Every 5 minutes', value: '*/5 * * * *' },
  { label: 'Every hour',      value: '0 * * * *' },
  { label: 'Every day 2am',   value: '0 2 * * *' },
  { label: 'Every week',      value: '0 2 * * 0' },
  { label: 'Every month',     value: '0 2 1 * *' },
  { label: 'Custom',          value: 'custom' },
]

export default function TasksPage() {
  const params = useParams()
  const id = params.id as string

  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    Command: '',
    TimeSpec: '0 * * * *',
    MailTo: '',
    Enabled: true,
    schedulePreset: '0 * * * *',
    customSchedule: '',
  })

  useEffect(() => { loadTasks() }, [id])

  async function loadTasks() {
    setLoading(true)
    try {
      const res = await fetch(`/api/packages/${id}/tasks`)
      const data = await res.json()
      setTasks(data.tasks || [])
    } catch { setError('Failed to load tasks') }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    setSaving(true); setError(''); setSuccess('')
    const timeSpec = form.schedulePreset === 'custom' ? form.customSchedule : form.schedulePreset
    try {
      const res = await fetch(`/api/packages/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new: { task: [{ Command: form.Command, TimeSpec: timeSpec, MailTo: form.MailTo, Enabled: form.Enabled }] } }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess('Scheduled task created')
      setShowAdd(false)
      setForm({ Command: '', TimeSpec: '0 * * * *', MailTo: '', Enabled: true, schedulePreset: '0 * * * *', customSchedule: '' })
      loadTasks()
    } catch { setError('Failed to create task') }
    finally { setSaving(false) }
  }

  async function handleDelete(taskId: string) {
    if (!confirm('Delete this scheduled task?')) return
    try {
      const res = await fetch(`/api/packages/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delete: { task: { id: [taskId] } } }),
      })
      if (!res.ok) { setError('Failed to delete task'); return }
      setSuccess('Task deleted')
      loadTasks()
    } catch { setError('Failed to delete task') }
  }

  async function handleToggle(task: Task) {
    try {
      await fetch(`/api/packages/${id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ update: { task: [{ id: task.Id, Command: task.Command, TimeSpec: task.TimeSpec, MailTo: task.MailTo, Enabled: !task.Enabled }] } }),
      })
      loadTasks()
    } catch { setError('Failed to update task') }
  }

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>Loading...</div>

  return (
    <div style={{ maxWidth: '760px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#111', margin: 0 }}>Scheduled Tasks</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>Manage cron jobs for your PHP scripts and commands</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)}
          style={{ height: '36px', padding: '0 16px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
          + Add task
        </button>
      </div>

      {error && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}
      {success && <div style={{ padding: '12px 16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', fontSize: '13px', marginBottom: '16px' }}>{success}</div>}

      {showAdd && (
        <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 16px' }}>New scheduled task</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Command</label>
              <input value={form.Command} onChange={e => setForm(f => ({ ...f, Command: e.target.value }))}
                placeholder="php /home/customer/public_html/cron.php"
                style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Schedule</label>
              <select value={form.schedulePreset} onChange={e => setForm(f => ({ ...f, schedulePreset: e.target.value, TimeSpec: e.target.value !== 'custom' ? e.target.value : f.customSchedule }))}
                style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', marginBottom: '8px', boxSizing: 'border-box' }}>
                {COMMON_SCHEDULES.map(s => <option key={s.value} value={s.value}>{s.label} {s.value !== 'custom' ? `(${s.value})` : ''}</option>)}
              </select>
              {form.schedulePreset === 'custom' && (
                <input value={form.customSchedule} onChange={e => setForm(f => ({ ...f, customSchedule: e.target.value, TimeSpec: e.target.value }))}
                  placeholder="*/15 * * * *"
                  style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }} />
              )}
            </div>
            <div>
              <label style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>Email output to (optional)</label>
              <input value={form.MailTo} onChange={e => setForm(f => ({ ...f, MailTo: e.target.value }))}
                placeholder="you@example.com"
                style={{ width: '100%', height: '36px', padding: '0 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleCreate} disabled={saving || !form.Command}
                style={{ height: '36px', padding: '0 20px', background: saving ? '#ccc' : '#1a6ef5', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Creating...' : 'Create task'}
              </button>
              <button onClick={() => setShowAdd(false)}
                style={{ height: '36px', padding: '0 16px', background: 'var(--page-bg)', color: '#444', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {tasks.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center', background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>No scheduled tasks yet</p>
          <p style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Add a cron job to run PHP scripts automatically</p>
        </div>
      ) : (
        <div style={{ background: 'var(--card-bg)', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Command', 'Schedule', 'Email', 'Status', ''].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, i) => (
                <tr key={task.Id} style={{ borderBottom: i < tasks.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: '#111', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.Command}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{task.TimeSpec}</td>
                  <td style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{task.MailTo || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleToggle(task)}
                      style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: 'none', cursor: 'pointer', background: task.Enabled ? '#dcfce7' : '#f3f4f6', color: task.Enabled ? '#166534' : '#666' }}>
                      {task.Enabled ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => handleDelete(task.Id)}
                      style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '12px', background: 'none', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer' }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '16px', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>
          <strong>Tip:</strong> Use the full path to PHP — e.g. <code style={{ fontFamily: 'monospace', background: '#e5e7eb', padding: '1px 4px', borderRadius: '3px' }}>php /home/customer/public_html/cron.php</code>
        </p>
      </div>
    </div>
  )
}
