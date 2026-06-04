'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const inp: React.CSSProperties = {
    background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
    height: '38px', padding: '0 12px', borderRadius: '6px',
    fontSize: '13px', width: '100%', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div className="w-full max-w-sm px-6">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-9 h-9 rounded-md bg-white flex items-center justify-center">
          <span className="text-[16px] font-black text-black">G</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold text-white tracking-wide">GeiG</span>
          <span className="text-[9px] text-[#555] uppercase tracking-[1.5px] mt-0.5">Simple Web Service</span>
        </div>
      </div>

      <h1 className="text-[22px] font-semibold text-white mb-1">Sign in</h1>
      <p className="text-[13px] text-[#666] mb-8">Use your GeiG account credentials to continue.</p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px]"
          style={{ background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>
          {error}
        </div>
      )}
      {verified && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px]"
          style={{ background: '#0a2a0a', color: '#4ade80', border: '1px solid #166534' }}>
          Email verified — you can now sign in.
        </div>
      )}
      {idleMessage && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px]"
          style={{ background: '#2a1f0a', color: '#fbbf24', border: '1px solid #3f2d0a' }}>
          You were logged out due to 15 minutes of inactivity.
        </div>
      )}

      <div className="flex flex-col gap-2 mb-5">
        <button onClick={() => handleOAuth('google')} disabled={!!oauthLoading || loading}
          style={{ height: '40px', width: '100%', border: '1px solid #2a2a2a', background: '#111',
            color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: oauthLoading && oauthLoading !== 'google' ? 0.4 : 1 }}>
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

        <button onClick={() => handleOAuth('github')} disabled={!!oauthLoading || loading}
          style={{ height: '40px', width: '100%', border: '1px solid #2a2a2a', background: '#111',
            color: '#fff', borderRadius: '6px', fontSize: '13px', fontWeight: 500,
            cursor: oauthLoading || loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
            opacity: oauthLoading && oauthLoading !== 'github' ? 0.4 : 1 }}>
          {oauthLoading === 'github' ? 'Connecting...' : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              Continue with GitHub
            </>
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
        <span className="text-[11px] text-[#444]">or sign in with email</span>
        <div style={{ flex: 1, height: '1px', background: '#2a2a2a' }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#888]">Email address</label>
          <input type="email" required value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@geig.co.uk" style={inp} />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-[#888]">Password</label>
            <Link href="/forgot-password" className="text-[11px]" style={{ color: '#1a6ef5' }}>
              Forgot password?
            </Link>
          </div>
          <input type="password" required value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" style={inp} />
        </div>
        <button type="submit" disabled={loading || !!oauthLoading}
          style={{ height: '40px', background: loading ? '#1558c0' : '#1a6ef5',
            color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px',
            fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px', opacity: loading || oauthLoading ? 0.8 : 1 }}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-[12px] text-[#555]">
        No account?{' '}
        <a href="/register" style={{ color: '#1a6ef5' }}>Create one</a>
      </p>
      <p className="mt-12 text-center text-[11px] text-[#333]">
        © {new Date().getFullYear()} GeiG · sws.geig.co.uk
      </p>
    </div>
  )
}
