'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit() {
    if (!email) { setError('Email is required'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setSuccess(data.message)
    } catch { setError('Something went wrong') }
    finally { setLoading(false) }
  }

  return (
    <>
      <style>{`
        html, body { margin: 0; padding: 0; background: #050505; }
        .fp-root { height: 100vh; width: 100vw; display: flex; overflow: hidden; background: #050505; color: #fff; font-family: Inter, sans-serif; }
        .fp-left { width: 36%; height: 100vh; position: relative; display: flex; align-items: center; justify-content: center; background: #050505; border-right: 1px solid #252A30; box-sizing: border-box; overflow: hidden; flex-shrink: 0; }
        .fp-inner { width: 100%; padding: 0 48px; box-sizing: border-box; }
        .fp-right { width: 64%; height: 100vh; position: relative; display: flex; flex-direction: column; padding: 56px 64px; overflow: hidden; background: radial-gradient(circle at 70% 30%, #030E1E 0%, #050505 100%); box-sizing: border-box; }
        .fp-feat-card { background: rgba(17,17,17,0.8); border: 1px solid #252A30; border-radius: 8px; padding: 20px; display: flex; align-items: flex-start; gap: 16px; transition: border-color 0.2s; cursor: default; }
        .fp-feat-card:hover { border-color: rgba(0,200,255,0.3); }

        /* TABLET: 50/50, hide stepper + cards */
        @media (max-width: 1024px) {
          .fp-left { width: 50%; }
          .fp-right { width: 50%; padding: 40px; }
          .fp-stepper { display: none !important; }
          .fp-cards { display: none !important; }
          .fp-right-bottom { flex-direction: column; align-items: flex-start !important; }
          .fp-trust { display: none !important; }
        }

        /* MOBILE: full width, no right panel, minimal padding */
        @media (max-width: 767px) {
          .fp-root { height: auto; min-height: 100vh; overflow: auto; }
          .fp-left {
            width: 100%; height: auto; min-height: 100vh;
            border-right: none;
            align-items: flex-start;
            padding-top: 0;
          }
          .fp-inner { padding: 0 24px 80px; }
          .fp-logo { left: 24px !important; top: 28px !important; }
          .fp-footer { left: 24px !important; right: 24px !important; }
          .fp-right { display: none; }
          .fp-heading { margin-top: 88px; }
        }
      `}</style>

      <div className="fp-root">

        {/* LEFT */}
        <aside className="fp-left">
          <div className="fp-logo" style={{ position: 'absolute', top: '36px', left: '48px' }}>
            <Image src="https://geig.co.uk/_next/image?url=%2Fgeig-logo.png&w=256&q=75" alt="GeiG" width={110} height={36} style={{ objectFit: 'contain', objectPosition: 'left' }} unoptimized />
          </div>

          <div className="fp-inner">
            {success ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: '#0a2a0a', border: '1px solid #166534', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></svg>
                </div>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Check your email</h2>
                <p style={{ fontSize: '13px', color: '#A0A6AD', lineHeight: 1.6, marginBottom: '28px' }}>{success}</p>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#00C8FF', textDecoration: 'none' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <>
                <div className="fp-heading" style={{ marginBottom: '20px' }}>
                  <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.3em', marginBottom: '6px' }}>Account Recovery</p>
                  <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px', lineHeight: 1.2 }}>Forgot password?</h1>
                  <p style={{ fontSize: '13px', color: '#A0A6AD', lineHeight: 1.6, maxWidth: '300px' }}>
                    Enter your workspace email and we'll send you a secure reset link.
                  </p>
                </div>

                {error && <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>{error}</div>}

                <div style={{ background: '#111111', border: '1px solid #252A30', borderRadius: '12px', padding: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.8)', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                    <label style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#6F7782', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Workspace Email</label>
                    <div style={{ background: '#0B0B0B', border: '1px solid #252A30', borderRadius: '6px', overflow: 'hidden', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                      onFocusCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#00C8FF'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 0 0 1px rgba(0,200,255,0.15)' }}
                      onBlurCapture={e => { (e.currentTarget as HTMLDivElement).style.borderColor = '#252A30'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        placeholder="user@workspace.com"
                        style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#fff', padding: '10px 14px', fontSize: '13px', boxSizing: 'border-box' }} />
                    </div>
                  </div>

                  <button onClick={handleSubmit} disabled={loading}
                    style={{ width: '100%', height: '44px', background: loading ? '#1a1a1a' : 'linear-gradient(135deg, #e8e8e8 0%, #c0c0c0 50%, #a8a8a8 100%)', color: '#0a0a0a', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '9999px', fontSize: '14px', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.6 : 1, transition: 'filter 0.15s, transform 0.1s', boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.08)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.filter = 'none' }}
                    onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.98)' }}
                    onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}>
                    {loading ? 'Sending...' : (<>Send Reset Link <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></>)}
                  </button>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <Link href="/login" style={{ fontSize: '13px', color: '#00C8FF', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                    Back to Sign In
                  </Link>
                </div>

                <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#444', textAlign: 'center', marginTop: '16px', letterSpacing: '0.05em' }}>
                  Reset links expire automatically for your protection.
                </p>
              </>
            )}
          </div>

          <div className="fp-footer" style={{ position: 'absolute', bottom: '32px', left: '48px', right: '48px' }}>
            <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', color: '#6F7782', letterSpacing: '0.05em', marginBottom: '10px', textTransform: 'uppercase' }}>Secure Recovery · GeiG Infrastructure</p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <a href="/api-reference" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Documentation</a>
                <a href="/privacy" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Privacy</a>
                <a href="/legal/sla" target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#A0A6AD', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#A0A6AD')}>Status</a>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="fp-right">
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none', backgroundImage: 'radial-gradient(#1e293b 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
          <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '600px', height: '600px', background: 'rgba(0,200,255,0.05)', filter: 'blur(120px)', borderRadius: '9999px', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, flex: 1 }}>
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#00C8FF', textTransform: 'uppercase', letterSpacing: '0.4em', display: 'block', marginBottom: '16px' }}>Account Recovery</span>
            <h2 style={{ fontSize: '48px', fontWeight: 800, color: '#fff', marginBottom: '20px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>Secure access,<br/>restored simply.</h2>
            <p style={{ fontSize: '16px', color: '#A0A6AD', maxWidth: '560px', lineHeight: 1.7, marginBottom: '48px' }}>
              Recover your GeiG SWS workspace with a protected reset flow built for business-critical services. We prioritize infrastructure integrity at every step of your return journey.
            </p>

            <div className="fp-stepper" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px', marginBottom: '40px' }}>
              {[
                { n: '01', title: 'Verify.', desc: 'Confirm your workspace email.' },
                { n: '02', title: 'Reset.', desc: 'Use a protected reset link.' },
                { n: '03', title: 'Return.', desc: 'Get back to your services securely.' },
              ].map(({ n, title, desc }) => (
                <div key={n}>
                  <div style={{ fontSize: '40px', fontWeight: 800, color: 'rgba(255,255,255,0.08)', lineHeight: 1, marginBottom: '8px' }}>{n}</div>
                  <div style={{ height: '1px', background: '#252A30', marginBottom: '16px' }} />
                  <div style={{ fontSize: '20px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{title}</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#A0A6AD' }}>{desc}</div>
                </div>
              ))}
            </div>

            <div className="fp-cards" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { title: 'Protected Reset Link', desc: 'One-time use cryptographic link.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
                { title: 'Automatic Expiry', desc: 'Valid for 15 minutes of issuance.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
                { title: 'Workspace Verification', desc: 'Multi-tenant isolation checks.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L4 7v5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V7l-8-5z"/><polyline points="9 12 11 14 15 10"/></svg> },
                { title: 'Secure Account Access', desc: 'End-to-end encrypted sessions.', icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00C8FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
              ].map(({ title, desc, icon }) => (
                <div key={title} className="fp-feat-card">
                  <div style={{ flexShrink: 0, marginTop: '2px' }}>{icon}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>{title}</div>
                    <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#A0A6AD' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="fp-right-bottom" style={{ position: 'relative', zIndex: 10, flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '32px' }}>
            <div style={{ maxWidth: '420px', paddingBottom: '32px' }}>
              <p style={{ fontSize: '14px', color: '#A0A6AD', lineHeight: 1.7, marginBottom: '16px' }}>
                Need help accessing your workspace? Contact GeiG Support if you no longer have access to your registered email address.
              </p>
              <a href="/support" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px', color: '#00C8FF', border: '1px solid rgba(0,200,255,0.3)', padding: '8px 20px', borderRadius: '9999px', textDecoration: 'none', transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#00C8FF'; (e.currentTarget as HTMLAnchorElement).style.color = '#000' }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#00C8FF' }}>
                Contact Support
              </a>
            </div>

            <div className="fp-trust" style={{ display: 'flex', alignItems: 'center', gap: '24px', opacity: 0.6, paddingBottom: '32px', flexShrink: 0 }}>
              {[
                { label: 'Secure Recovery', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> },
                { label: 'Protected Links', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> },
                { label: 'UK Support', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20"/></svg> },
                { label: 'Business Grade', icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="8" rx="1"/><rect x="2" y="13" width="20" height="8" rx="1"/><path d="M6 7h.01M6 17h.01"/></svg> },
              ].map(({ label, icon }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6F7782' }}>
                  {icon}
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.2em' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}
