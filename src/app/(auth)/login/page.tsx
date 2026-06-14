'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const [idleMessage, setIdleMessage] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('verified') === '1') setVerified(true)
    if (window.location.search.includes('reason=idle')) setIdleMessage(true)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/gsws-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      window.location.href = data.redirectTo || '/dashboard'
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  async function handleOAuth(provider: 'github' | 'google') {
    setOauthLoading(provider)
    setError('')
    try {
      const res = await fetch(`/api/auth/sign-in/social`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, callbackURL: '/dashboard' }),
      })
      const data = await res.json()
      if (data?.url) {
        window.location.href = data.url
      } else {
        setError('Could not get OAuth URL. Please try again.')
        setOauthLoading(null)
      }
    } catch {
      setError('Failed to connect with ' + provider + '. Please try again.')
      setOauthLoading(null)
    }
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #050505; }

        .login-root {
          height: 100vh; width: 100vw; display: flex;
          overflow: hidden; background: #050505;
          color: #fff; font-family: Inter, sans-serif;
        }

        /* LEFT PANEL */
        .left-panel {
          width: 36%; height: 100vh; position: relative;
          display: flex; align-items: center; justify-content: center;
          background: #050505; border-right: 1px solid #252A30;
          box-sizing: border-box; overflow: hidden; flex-shrink: 0;
        }
        .left-inner {
          width: 100%; padding: 0 48px; box-sizing: border-box;
        }

        /* RIGHT PANEL */
        .right-panel {
          width: 64%; height: 100vh; position: relative;
          display: flex; flex-direction: column;
          padding: 56px 64px;
          overflow: hidden;
          background: linear-gradient(135deg, #030E1E 0%, #050505 100%);
          box-sizing: border-box;
        }

        /* TABLET: right panel shrinks, left expands */
        @media (max-width: 1024px) {
          .left-panel { width: 50%; }
          .right-panel { width: 50%; padding: 40px 40px; }
          .right-editorial { display: none; }
          .right-cards { display: none; }
        }

        /* MOBILE: hide right panel entirely, left goes full width */
        @media (max-width: 767px) {
          .login-root { height: auto; min-height: 100vh; overflow: auto; }
          .left-panel {
            width: 100%; height: auto; min-height: 100vh;
            border-right: none; align-items: flex-start;
            padding-top: 100px; padding-bottom: 80px;
          }
          .left-inner { padding: 0 24px; }
          .left-logo { left: 24px !important; }
          .left-footer { left: 24px !important; right: 24px !important; }
          .right-panel { display: none; }
        }
      `}</style>

      <div className="login-root">

        {/* LEFT PANEL */}
        <aside className="left-panel">
          {/* Logo pinned top */}
          <div className="left-logo" style={{ position: 'absolute', top: '36px', left: '48px' }}>
            <Image
              src="https://geig.co.uk/_next/image?url=%2Fgeig-logo.png&w=256&q=75"
              alt="GeiG" width={110} height={36}
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              unoptimized
            />
          </div>

          {/* Centred content */}
          <div className="left-inner">
            <div style={{ marginBottom: '20px' }}>
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '6px' }}>SWS</p>
              <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>Simple Web Service</h2>
              <p style={{ fontSize: '13px', color: '#A0A6AD', lineHeight: 1.6, maxWidth: '300px' }}>
                Secure access to your websites, domains, email, hosting, and infrastructure workspace.
              </p>
            </div>

            {error && <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>{error}</div>}
            {verified && <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#0a2a0a', color: '#4ade80', border: '1px solid #166534' }}>Email verified — you can now sign in.</div>}
            {idleMessage && <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#2a1f0a', color: '#fbbf24', border: '1px solid #3f2d0a' }}>You were logged out due to 15 minutes of inactivity.</div>}

            {/* Card */}
            <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>

              {/* Social */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading || loading}
                  style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#111', border: '1px solid #252A30', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer', opacity: oauthLoading && oauthLoading !== 'google' ? 0.4 : 1, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!oauthLoading && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#181818' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#111' }}>
                  {oauthLoading === 'google' ? 'Connecting...' : (<>
                    <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                    Continue with Google
                  </>)}
                </button>
                <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading || loading}
                  style={{ width: '100%', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#111', border: '1px solid #252A30', borderRadius: '8px', color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer', opacity: oauthLoading && oauthLoading !== 'github' ? 0.4 : 1, transition: 'background 0.15s' }}
                  onMouseEnter={e => { if (!oauthLoading && !loading) (e.currentTarget as HTMLButtonElement).style.background = '#181818' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#111' }}>
                  {oauthLoading === 'github' ? 'Connecting...' : (<>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.011-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>
                    Continue with GitHub
                  </>)}
                </button>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>or email access</span>
                <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Email Address</label>
                  <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                    onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="user@workspace.com"
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '10px 14px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Password</label>
                  <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                    onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                    onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                    <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '10px 14px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                      style={{ width: '14px', height: '14px', accentColor: '#00C8FF', cursor: 'pointer' }} />
                    <span style={{ fontSize: '12px', color: '#A0A6AD' }}>Remember me</span>
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '12px', color: '#00C8FF', textDecoration: 'none' }}>Forgot password?</Link>
                </div>
                <button type="submit" disabled={loading || !!oauthLoading}
                  style={{ width: '100%', height: '44px', background: loading || oauthLoading ? '#1a1a1a' : 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)', color: '#0a0a0a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px', fontSize: '14px', fontWeight: 700, cursor: loading || oauthLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading || oauthLoading ? 0.6 : 1, transition: 'filter 0.15s, transform 0.1s', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)', marginTop: '4px' }}
                  onMouseEnter={e => { if (!loading && !oauthLoading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
                  onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
                  onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}>
                  {loading ? 'Signing in...' : (<>Sign In <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>)}
                </button>
                <div style={{ textAlign: 'center' }}>
                  <a href="/register" style={{ fontSize: '12px', color: '#6F7782', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#6F7782')}>
                    Access your workspace
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  </a>
                </div>
              </form>
            </div>
          </div>

          {/* Footer pinned bottom */}
          <div className="left-footer" style={{ position: 'absolute', bottom: '32px', left: '48px', right: '48px' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>Secure Login · GeiG Infrastructure</p>
            <div style={{ display: 'flex', gap: '16px' }}>
                              <a href="/terms" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Terms</a>
                <a href="/privacy" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Privacy</a>
                <a href="/legal/sla" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Status</a>
            </div>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <main className="right-panel">
          {/* Grid bg */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'linear-gradient(to right, #252A30 1px, transparent 1px), linear-gradient(to bottom, #252A30 1px, transparent 1px)', backgroundSize: '60px 60px', WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)', maskImage: 'radial-gradient(circle at center, black, transparent 80%)' }} />
          <div style={{ position: 'absolute', top: 0, right: 0, width: '500px', height: '500px', background: 'rgba(0,200,255,0.05)', filter: 'blur(120px)', borderRadius: '9999px', pointerEvents: 'none' }} />

          {/* Top content */}
          <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: '14px' }}>Simple Web Service</span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '20px', maxWidth: '560px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Everything your web stack needs.</h2>
            <p style={{ fontSize: '16px', color: '#A0A6AD', maxWidth: '600px', lineHeight: 1.7 }}>One secure platform for websites, domains, business email, CDN, databases, SSL, VPS, and GPU workloads.</p>

            {/* Editorial type — hidden on tablet */}
            <div className="right-editorial" style={{ marginTop: '36px', display: 'flex', flexWrap: 'wrap', gap: '12px 36px', alignItems: 'baseline', maxWidth: '800px' }}>
              {[
                { label: 'Website.', size: '60px', color: '#fff', weight: 800 },
                { label: 'Email.', size: '44px', color: '#00C8FF', weight: 700 },
                { label: 'Domain.', size: '34px', color: '#fff', weight: 600 },
                { label: 'CDN.', size: '34px', color: '#00C8FF', weight: 600 },
                { label: 'Database.', size: '44px', color: '#fff', weight: 700 },
                { label: 'SSL.', size: '26px', color: '#00C8FF', weight: 500 },
                { label: 'VPS.', size: '68px', color: '#fff', weight: 800 },
                { label: 'GPU.', size: '68px', color: '#fff', weight: 800 },
              ].map(({ label, size, color, weight }) => (
                <div key={label} style={{ fontSize: size, fontWeight: weight, color, letterSpacing: '-0.02em', lineHeight: 1, cursor: 'default', transition: 'color 0.3s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#00C8FF')}
                  onMouseLeave={e => (e.currentTarget.style.color = color)}>{label}</div>
              ))}
            </div>

            {/* Service cards — hidden on tablet */}
            <div className="right-cards" style={{ marginTop: '32px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {[
                { label: 'Website Hosting', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg> },
                { label: 'Business Email', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg> },
                { label: 'Domain Control', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/></svg> },
                { label: 'Managed SSL', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7l-8-5z"/></svg> },
                { label: 'VPS & GPU', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01M10 7h4M10 17h4"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '8px', padding: '14px 16px', minWidth: '140px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'default', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,200,255,0.3)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#252A30')}>
                  {icon}
                  <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Product Spec</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom pinned */}
          <div style={{ position: 'relative', zIndex: 10, flexShrink: 0 }}>
            <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '20px 24px', maxWidth: '720px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <span style={{ fontSize: '28px', color: '#00C8FF', opacity: 0.3, lineHeight: 1, flexShrink: 0 }}>"</span>
                <div>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.85)', fontWeight: 500, marginBottom: '14px', lineHeight: 1.6 }}>
                    GeiG SWS gave us one place to manage our website, domains, email and hosting without the usual complexity.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '9999px', background: '#252A30', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>Operations Lead</div>
                      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.1em' }}>UK Technology Business</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #252A30', paddingTop: '20px', paddingBottom: '32px' }}>
              {[
                { label: 'Secure Access', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6F7782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
                { label: 'UK Support', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6F7782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20"/></svg> },
                { label: 'High Availability', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6F7782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
                { label: 'Business Grade', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#6F7782" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  {icon}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>

      </div>
    </>
  )
}
