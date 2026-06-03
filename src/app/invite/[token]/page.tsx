'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

const ROLE_INFO: Record<string, { desc: string; color: string; bg: string }> = {
  admin:   { desc: 'Full access to all packages, billing and team management', color: '#a32d2d', bg: '#fcebeb' },
  billing: { desc: 'View statements, transaction history and top up credit', color: '#854f0b', bg: '#faeeda' },
  viewer:  { desc: 'Read-only access to hosting packages and domains', color: '#185fa5', bg: '#e8f0fe' },
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState<'invite' | 'password' | 'done'>('invite')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    fetch(`/api/invite/${token}`)
      .then(r => r.json())
      .then(d => { setInvite(d.invite || null); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  async function handleAccept() {
    if (!password || password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setSubmitting(true); setError('')
    try {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to accept invite')
      setStep('done')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch (err: any) { setError(err.message); setSubmitting(false) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', justifyContent: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '18px', fontWeight: 900, color: '#000' }}>G</span>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' }}>GeiG</p>
            <p style={{ margin: 0, fontSize: '10px', color: '#555', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Simple Web Service</p>
          </div>
        </div>

        <div style={{ background: '#141414', borderRadius: '16px', padding: '36px', border: '1px solid #222' }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>Loading invitation…</p>

          ) : step === 'done' ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>✅</p>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Welcome aboard!</p>
              <p style={{ fontSize: '13px', color: '#666' }}>Taking you to your dashboard…</p>
            </div>

          ) : !invite ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '48px', marginBottom: '12px' }}>❌</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Invalid invitation</p>
              <p style={{ fontSize: '13px', color: '#666' }}>This link is invalid or has expired. Contact the account owner for a new invite.</p>
            </div>

          ) : step === 'invite' ? (
            <>
              <p style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '6px', textAlign: 'center' }}>You have been invited</p>
              <p style={{ fontSize: '14px', color: '#666', textAlign: 'center', marginBottom: '28px' }}>
                <strong style={{ color: '#aaa' }}>{invite.inviterName}</strong> invited you to join their GeiG SWS account
              </p>

              {/* Invited as */}
              <div style={{ padding: '14px 16px', borderRadius: '8px', background: '#1a1a1a', border: '1px solid #2a2a2a', marginBottom: '16px' }}>
                <p style={{ fontSize: '11px', color: '#666', marginBottom: '2px' }}>Invited as</p>
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{invite.email}</p>
              </div>

              {/* Role */}
              {(() => {
                const info = ROLE_INFO[invite.role] || ROLE_INFO.viewer
                return (
                  <div style={{ padding: '14px 16px', borderRadius: '8px', background: info.bg, marginBottom: '24px' }}>
                    <p style={{ fontSize: '11px', fontWeight: 600, color: info.color, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Your role</p>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: '#0a0a0a', marginBottom: '2px' }}>{invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}</p>
                    <p style={{ fontSize: '12px', color: '#5a5a5a' }}>{info.desc}</p>
                  </div>
                )
              })()}

              <button onClick={() => setStep('password')}
                style={{ width: '100%', height: '48px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Accept invitation →
              </button>
            </>

          ) : (
            <>
              <button onClick={() => setStep('invite')} style={{ background: 'none', border: 'none', color: '#666', fontSize: '13px', cursor: 'pointer', marginBottom: '20px', padding: 0, fontFamily: 'inherit' }}>
                ← Back
              </button>
              <p style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Create your password</p>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '24px' }}>
                Set a password for <strong style={{ color: '#aaa' }}>{invite.email}</strong> to access GeiG SWS.
              </p>

              {error && <div style={{ padding: '10px 14px', borderRadius: '8px', background: '#2a1010', border: '1px solid #5a2020', color: '#f87171', fontSize: '12px', marginBottom: '16px' }}>{error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', display: 'block', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      style={{ width: '100%', height: '40px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '0 40px 0 14px', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#1a6ef5'}
                      onBlur={e => e.target.style.borderColor = '#2a2a2a'} />
                    <button onClick={() => setShowPass(s => !s)} type="button"
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: '12px' }}>
                      {showPass ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#aaa', display: 'block', marginBottom: '6px' }}>Confirm password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    style={{ width: '100%', height: '40px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '14px', padding: '0 14px', boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' }}
                    onFocus={e => e.target.style.borderColor = '#1a6ef5'}
                    onBlur={e => e.target.style.borderColor = '#2a2a2a'}
                    onKeyDown={e => e.key === 'Enter' && handleAccept()} />
                </div>
              </div>

              {/* Password strength */}
              {password.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: password.length >= i * 3 ? (password.length >= 12 ? '#3b6d11' : password.length >= 8 ? '#854f0b' : '#a32d2d') : '#2a2a2a' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: '11px', color: password.length >= 12 ? '#3b6d11' : password.length >= 8 ? '#854f0b' : '#a32d2d' }}>
                    {password.length >= 12 ? 'Strong password' : password.length >= 8 ? 'Good password' : 'Too short'}
                  </p>
                </div>
              )}

              <button onClick={handleAccept} disabled={submitting || !password || !confirmPassword}
                style={{ width: '100%', height: '48px', background: '#1a6ef5', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: 700, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: (!password || !confirmPassword) ? 0.5 : 1 }}>
                {submitting ? 'Setting up your account…' : 'Create account & join →'}
              </button>

              <p style={{ fontSize: '11px', color: '#555', textAlign: 'center', marginTop: '14px' }}>
                By joining you agree to the <a href="/terms" style={{ color: '#1a6ef5' }}>Terms of Service</a>
              </p>
            </>
          )}
        </div>
        <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', marginTop: '20px' }}>© 2026 GeiG · sws.geig.co.uk</p>
      </div>
    </div>
  )
}
