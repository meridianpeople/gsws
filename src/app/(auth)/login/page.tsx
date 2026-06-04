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
    <div className="min-h-screen flex" style={{ background: '#050505', color: '#fff', fontFamily: 'Inter, sans-serif' }}>

      {/* ── LEFT PANEL (36%) ── */}
      <aside
        className="flex flex-col"
        style={{
          width: '36%',
          minHeight: '100vh',
          background: '#050505',
          borderRight: '1px solid #252A30',
          padding: '48px',
          overflowY: 'auto',
        }}
      >
        {/* Logo */}
        <header style={{ marginBottom: '64px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Image
              src="https://geig.co.uk/_next/image?url=%2Fgeig-logo.png&w=256&q=75"
              alt="GeiG"
              width={28}
              height={28}
              style={{ objectFit: 'contain' }}
              unoptimized
            />
            <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff' }}>
              GeiG <span style={{ color: '#00C8FF' }}>SWS</span>
            </span>
          </div>
        </header>

        {/* Heading */}
        <div style={{ flexGrow: 1 }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '8px' }}>
            SWS
          </p>
          <h2 style={{ fontSize: '28px', fontWeight: 700, color: '#fff', marginBottom: '16px', lineHeight: 1.2 }}>
            Simple Web Service
          </h2>
          <p style={{ fontSize: '14px', color: '#A0A6AD', lineHeight: 1.7, maxWidth: '320px', marginBottom: '40px' }}>
            Secure access to your websites, domains, email, hosting, and infrastructure workspace.
          </p>

          {/* Alerts */}
          {error && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>
              {error}
            </div>
          )}
          {verified && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#0a2a0a', color: '#4ade80', border: '1px solid #166534' }}>
              Email verified — you can now sign in.
            </div>
          )}
          {idleMessage && (
            <div style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', background: '#2a1f0a', color: '#fbbf24', border: '1px solid #3f2d0a' }}>
              You were logged out due to 15 minutes of inactivity.
            </div>
          )}

          {/* Login Card */}
          <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '32px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)' }}>

            {/* Social Auth */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              <button
                onClick={() => handleOAuth('google')}
                disabled={!!oauthLoading || loading}
                style={{
                  width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', background: '#111', border: '1px solid #252A30', borderRadius: '8px',
                  color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
                  opacity: oauthLoading && oauthLoading !== 'google' ? 0.4 : 1, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#181818')}
                onMouseLeave={e => (e.currentTarget.style.background = '#111')}
              >
                {oauthLoading === 'google' ? 'Connecting...' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              <button
                onClick={() => handleOAuth('github')}
                disabled={!!oauthLoading || loading}
                style={{
                  width: '100%', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '10px', background: '#111', border: '1px solid #252A30', borderRadius: '8px',
                  color: '#fff', fontSize: '13px', fontWeight: 500, cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
                  opacity: oauthLoading && oauthLoading !== 'github' ? 0.4 : 1, transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#181818')}
                onMouseLeave={e => (e.currentTarget.style.background = '#111')}
              >
                {oauthLoading === 'github' ? 'Connecting...' : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.011-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/>
                    </svg>
                    Continue with GitHub
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
              <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em', whiteSpace: 'nowrap' }}>
                or email access
              </span>
              <div style={{ flex: 1, height: '1px', background: '#252A30' }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Email Address
                </label>
                <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.2)'; }}
                  onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <input
                    type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="user@workspace.com"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '12px 16px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                  Password
                </label>
                <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '8px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.2)'; }}
                  onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
                >
                  <input
                    type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '12px 16px', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                    style={{ width: '16px', height: '16px', borderRadius: '2px', accentColor: '#00C8FF', background: '#0B0B0B', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '12px', color: '#A0A6AD' }}>Remember me</span>
                </label>
                <Link href="/forgot-password" style={{ fontSize: '12px', color: '#00C8FF', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading || !!oauthLoading}
                style={{
                  width: '100%', height: '48px', background: '#00C8FF', color: '#050505',
                  border: 'none', borderRadius: '9999px', fontSize: '14px', fontWeight: 700,
                  cursor: loading || oauthLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  opacity: loading || oauthLoading ? 0.8 : 1, marginTop: '8px',
                  transition: 'filter 0.15s, transform 0.1s',
                }}
                onMouseEnter={e => { if (!loading && !oauthLoading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
                onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
                onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
              >
                {loading ? 'Signing in...' : (
                  <>
                    Sign In
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </>
                )}
              </button>

              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <a href="/register" style={{ fontSize: '12px', color: '#6F7782', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#6F7782')}
                >
                  Access your workspace
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                  </svg>
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ marginTop: '48px' }}>
          <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', letterSpacing: '0.05em', marginBottom: '16px', textTransform: 'uppercase' }}>
            Secure Login Powered by GeiG Infrastructure
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            {['Terms', 'Privacy', 'Status'].map(l => (
              <a key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}
              >
                {l}
              </a>
            ))}
          </div>
        </footer>
      </aside>

      {/* ── RIGHT PANEL (64%) ── */}
      <main
        style={{
          width: '64%', minHeight: '100vh', position: 'relative', display: 'flex',
          flexDirection: 'column', padding: '64px', justifyContent: 'space-between', overflow: 'hidden',
          background: 'linear-gradient(135deg, #030E1E 0%, #050505 100%)',
        }}
      >
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(to right, #252A30 1px, transparent 1px), linear-gradient(to bottom, #252A30 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)',
          maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
        }} />
        {/* Cyan glow blob */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '500px', height: '500px',
          background: 'rgba(0,200,255,0.05)', filter: 'blur(120px)', borderRadius: '9999px', pointerEvents: 'none',
        }} />

        {/* Top content */}
        <div style={{ position: 'relative', zIndex: 10 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: '16px' }}>
            Simple Web Service
          </span>
          <h2 style={{ fontSize: '52px', fontWeight: 800, color: '#fff', marginBottom: '24px', maxWidth: '560px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            Everything your web stack needs.
          </h2>
          <p style={{ fontSize: '18px', color: '#A0A6AD', maxWidth: '640px', lineHeight: 1.7 }}>
            One secure platform for websites, domains, business email, CDN, databases, SSL, VPS, and GPU workloads.
          </p>

          {/* Editorial typography grid */}
          <div style={{ marginTop: '64px', display: 'flex', flexWrap: 'wrap', gap: '24px 48px', alignItems: 'baseline', maxWidth: '800px', opacity: 0.9 }}>
            {[
              { label: 'Website.', size: '72px', color: '#fff', weight: 800 },
              { label: 'Email.', size: '52px', color: '#00C8FF', weight: 700 },
              { label: 'Domain.', size: '40px', color: '#fff', weight: 600 },
              { label: 'CDN.', size: '40px', color: '#00C8FF', weight: 600 },
              { label: 'Database.', size: '52px', color: '#fff', weight: 700 },
              { label: 'SSL.', size: '32px', color: '#00C8FF', weight: 500 },
              { label: 'VPS.', size: '80px', color: '#fff', weight: 800 },
              { label: 'GPU.', size: '80px', color: '#fff', weight: 800 },
            ].map(({ label, size, color, weight }) => (
              <div key={label} style={{ fontSize: size, fontWeight: weight, color, letterSpacing: '-0.02em', lineHeight: 1, cursor: 'default', transition: 'color 0.3s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00C8FF')}
                onMouseLeave={e => (e.currentTarget.style.color = color)}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Service cards */}
          <div style={{ marginTop: '64px', display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {[
              { icon: '🌐', label: 'Website Hosting' },
              { icon: '✉️', label: 'Business Email' },
              { icon: '🔗', label: 'Domain Control' },
              { icon: '🔒', label: 'Managed SSL' },
              { icon: '⚡', label: 'VPS & GPU' },
            ].map(({ icon, label }) => (
              <div key={label}
                style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '8px', padding: '16px', minWidth: '150px', display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'default', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,200,255,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#252A30')}
              >
                <span style={{ fontSize: '20px' }}>{icon}</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 600 }}>{label}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.15em' }}>Product Spec</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom content */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '40px' }}>
          {/* Testimonial */}
          <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '24px', maxWidth: '720px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '32px', color: '#00C8FF', opacity: 0.3, lineHeight: 1 }}>"</span>
              <div>
                <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', fontWeight: 500, marginBottom: '20px', lineHeight: 1.7 }}>
                  GeiG SWS gave us one place to manage our website, domains, email and hosting without the usual complexity.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '9999px', background: '#252A30', border: '1px solid #252A30', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '11px', color: '#fff', fontWeight: 700 }}>Operations Lead</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.15em' }}>UK Technology Business</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trust bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #252A30', paddingTop: '32px' }}>
            {[
              { icon: '🔒', label: 'Secure Access' },
              { icon: '🌍', label: 'UK Support' },
              { icon: '📡', label: 'High Availability' },
              { icon: '🖥️', label: 'Business Grade' },
            ].map(({ icon, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
