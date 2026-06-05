'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', couponCode: '' })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [couponInfo, setCouponInfo] = useState<{ code: string; amount: number } | null>(null)
  const [agreed, setAgreed] = useState(false)

  async function handleRegister() {
    setError(''); setSuccess('')
    if (!form.name || !form.email || !form.password) { setError('All fields are required'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    if (!agreed) { setError('Please agree to the Terms and Privacy Policy'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, couponCode: form.couponCode }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      if (data.couponApplied) setCouponInfo(data.couponApplied)
      setSuccess(data.message)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  async function handleOAuth(provider: 'github' | 'google') {
    setOauthLoading(provider); setError('')
    try {
      const res = await fetch(`/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, callbackURL: '/dashboard' }),
      })
      const data = await res.json()
      if (data?.url) { window.location.href = data.url }
      else { setError('Could not get OAuth URL. Please try again.'); setOauthLoading(null) }
    } catch { setError('Failed to connect with ' + provider + '. Please try again.'); setOauthLoading(null) }
  }

  const inputWrap = (focused: boolean) => ({
    background: '#0B0B0B', border: `1px solid ${focused ? '#00C8FF' : '#252A30'}`,
    borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s',
  })

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #050505; }
        .rg-root { min-height: 100vh; width: 100vw; display: flex; overflow-x: hidden; background: #050505; color: #fff; font-family: Inter, sans-serif; }
        .rg-left { width: 40%; min-height: 100vh; position: relative; display: flex; flex-direction: column; justify-content: space-between; background: #050505; border-right: 1px solid #252A30; box-sizing: border-box; padding: 40px 48px 32px; flex-shrink: 0; overflow-y: auto; }
        .rg-right { width: 60%; position: relative; display: flex; flex-direction: column; padding: 56px 64px; overflow: hidden; background: linear-gradient(135deg, #030E1E 0%, #050505 100%); box-sizing: border-box; }
        .rg-input { width: 100%; background: transparent; border: none; outline: none; color: #fff; padding: 10px 14px; font-size: 13px; box-sizing: border-box; }
        .rg-input::placeholder { color: #444; }
        .rg-svc { background: rgba(26,31,38,0.4); border: 1px solid #252A30; border-radius: 6px; padding: 14px; display: flex; align-items: center; gap: 10px; transition: border-color 0.2s, transform 0.2s; cursor: default; }
        .rg-svc:hover { border-color: rgba(0,200,255,0.3); transform: translateY(-2px); }
        @media (max-width: 1024px) {
          .rg-left { width: 50%; padding: 36px 36px 28px; }
          .rg-right { width: 50%; padding: 40px 36px; }
          .rg-stepper { display: none !important; }
          .rg-trust { display: none !important; }
        }
        @media (max-width: 767px) {
          .rg-root { flex-direction: column; }
          .rg-left { width: 100%; border-right: none; padding: 28px 24px 80px; min-height: 100vh; }
          .rg-right { display: none; }
          .rg-logo { margin-bottom: 24px; }
        }
      `}</style>

      <div className="rg-root">

        {/* LEFT */}
        <section className="rg-left">
          <div>
            {/* Logo */}
            <div className="rg-logo" style={{ marginBottom: '32px' }}>
              <Image src="https://geig.co.uk/_next/image?url=%2Fgeig-logo.png&w=256&q=75" alt="GeiG" width={110} height={36} style={{ objectFit: 'contain', objectPosition: 'left' }} unoptimized />
            </div>

            {success ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: '48px', height: '48px', background: '#0a2a0a', border: '1px solid #166534', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Check your email</h2>
                <p style={{ fontSize: '13px', color: '#A0A6AD', lineHeight: 1.6, marginBottom: '16px' }}>{success}</p>
                {couponInfo && (
                  <div style={{ padding: '12px 16px', background: '#0a2a0a', border: '1px solid #166534', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#4ade80' }}>
                    🎁 Coupon <strong>{couponInfo.code}</strong> applied — <strong>£{couponInfo.amount.toFixed(2)}</strong> credit added!
                  </div>
                )}
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#00C8FF', textDecoration: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Go to Sign In
                </Link>
              </div>
            ) : (
              /* Card */
              <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '28px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>Create your workspace</h2>
                <p style={{ fontSize: '13px', color: '#A0A6AD', lineHeight: 1.6, marginBottom: '24px' }}>
                  Start managing your websites, domains, email, hosting, and infrastructure from one secure GeiG platform.
                </p>

                {error && <div style={{ marginBottom: '16px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>{error}</div>}

                {/* Social — 2 col */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                  <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading || loading}
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1A1F26', border: '1px solid #252A30', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer', opacity: oauthLoading && oauthLoading !== 'google' ? 0.4 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!oauthLoading && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#252A30' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1A1F26' }}>
                    {oauthLoading === 'google' ? '...' : (<><svg width="15" height="15" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Google</>)}
                  </button>
                  <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading || loading}
                    style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#1A1F26', border: '1px solid #252A30', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer', opacity: oauthLoading && oauthLoading !== 'github' ? 0.4 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!oauthLoading && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#252A30' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#1A1F26' }}>
                    {oauthLoading === 'github' ? '...' : (<><svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.011-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>GitHub</>)}
                  </button>
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>or create with email</span>
                  <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
                </div>

                {/* Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Smith' },
                    { key: 'email', label: 'Work Email', type: 'email', placeholder: 'user@company.com' },
                  ].map(f => (
                    <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{f.label}</label>
                      <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                        onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                        onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                        <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder={f.placeholder} className="rg-input" />
                      </div>
                    </div>
                  ))}

                  {/* Password row — 2 col */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'password', label: 'Password', placeholder: '••••••••' },
                      { key: 'confirmPassword', label: 'Confirm', placeholder: '••••••••' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{f.label}</label>
                        <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                          onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                          onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                          <input type="password" value={(form as any)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} onKeyDown={e => e.key === 'Enter' && handleRegister()} placeholder={f.placeholder} className="rg-input" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Coupon */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                      Coupon <span style={{ color: '#444', textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                    </label>
                    <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                      onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                      <input type="text" value={form.couponCode} onChange={e => setForm(p => ({ ...p, couponCode: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME20" className="rg-input" style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '1px' }} />
                    </div>
                  </div>

                  {/* Terms */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', marginTop: '4px' }}>
                    <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: '14px', height: '14px', marginTop: '2px', accentColor: '#00C8FF', flexShrink: 0, cursor: 'pointer' }} />
                    <span style={{ fontSize: '12px', color: '#A0A6AD', lineHeight: 1.5 }}>
                      I agree to the <Link href="/terms" style={{ color: '#00C8FF', textDecoration: 'none' }}>Terms</Link> and <Link href="/privacy" style={{ color: '#00C8FF', textDecoration: 'none' }}>Privacy Policy</Link>
                    </span>
                  </label>

                  {/* Submit — silver */}
                  <button onClick={handleRegister} disabled={loading || !!oauthLoading}
                    style={{ width: '100%', height: '44px', background: loading || oauthLoading ? '#1a1a1a' : 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)', color: '#0a0a0a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px', fontSize: '13px', fontWeight: 700, cursor: loading || oauthLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading || oauthLoading ? 0.6 : 1, transition: 'filter 0.15s, transform 0.1s', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                    onMouseEnter={e => { if (!loading && !oauthLoading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
                    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
                    onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}>
                    {loading ? 'Creating workspace...' : 'Create Workspace'}
                  </button>

                  <p style={{ textAlign: 'center', fontSize: '12px', color: '#6F7782', margin: 0 }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: '#00C8FF', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer style={{ marginTop: '24px' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>Secure Registration · GeiG Infrastructure</p>
            <div style={{ display: 'flex', gap: '16px' }}>
              {['Terms', 'Privacy', 'Status'].map(l => (
                <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>{l}</a>
              ))}
            </div>
          </footer>
        </section>

        {/* RIGHT */}
        <section className="rg-right">
          <div style={{ position: 'absolute', inset: 0, opacity: 0.3, pointerEvents: 'none', backgroundImage: 'linear-gradient(to right, rgba(30,41,59,0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(30,41,59,0.2) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '500px', height: '500px', background: 'rgba(0,200,255,0.05)', filter: 'blur(120px)', borderRadius: '9999px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: '16px' }}>Simple Web Service</span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '560px' }}>Launch your web stack from one workspace.</h2>
            <p style={{ fontSize: '16px', color: '#A0A6AD', maxWidth: '560px', lineHeight: 1.7, marginBottom: '48px' }}>
              Create a GeiG SWS account to manage websites, domains, business email, SSL, CDN, databases, VPS, and GPU workloads from a secure platform.
            </p>

            {/* Stepper */}
            <div className="rg-stepper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', marginBottom: '48px' }}>
              {[
                { title: 'Create.', desc: 'Instantiate new projects, servers, or email clusters in seconds.' },
                { title: 'Connect.', desc: 'Bridge your domains and data across global network nodes.' },
                { title: 'Control.', desc: 'Monitor and scale infrastructure via a unified dashboard.' },
              ].map(({ title, desc }) => (
                <div key={title}>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>{title}</div>
                  <div style={{ height: '1px', background: 'rgba(58,73,75,0.3)', marginBottom: '12px' }} />
                  <div style={{ fontSize: '12px', color: '#6F7782', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Service cards — 3 col grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              {[
                { label: 'Website Hosting', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
                { label: 'Business Email', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg> },
                { label: 'Domain Control', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg> },
                { label: 'Managed SSL', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7l-8-5z"/></svg> },
                { label: 'VPS & GPU', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01M10 7h4M10 17h4"/></svg> },
                { label: 'Database Ready', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} className="rg-svc">
                  {icon}
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: 'rgba(0,200,255,0.6)', marginTop: '2px' }}>Workspace ready</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom */}
          <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, marginTop: '40px' }}>
            {/* Quote card */}
            <div style={{ background: '#051424', borderLeft: '4px solid #00C8FF', padding: '20px 24px', maxWidth: '560px', marginBottom: '32px' }}>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.9)', fontStyle: 'italic', lineHeight: 1.7, marginBottom: '14px' }}>
                "GeiG SWS gives teams one secure place to start, manage, and scale their digital infrastructure."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#00C8FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 700, color: '#000', flexShrink: 0 }}>GI</div>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#6F7782' }}>— GeiG Infrastructure Team</span>
              </div>
            </div>

            {/* Trust bar */}
            <div className="rg-trust" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(58,73,75,0.2)', paddingTop: '20px', paddingBottom: '8px', opacity: 0.6 }}>
              {[
                { label: 'Secure Registration', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7l-8-5z"/></svg> },
                { label: 'Workspace Verified', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> },
                { label: 'UK-Based Support', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20"/></svg> },
                { label: 'Business Grade', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {icon}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em', color: '#6F7782' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
