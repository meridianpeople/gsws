'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
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
      <p className="text-[13px] text-[#666] mb-8">
        Use your GeiG account credentials to continue.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg text-[12px]"
          style={{ background: '#2a0a0a', color: '#f87171', border: '1px solid #3f1515' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#888]">Email address</label>
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@geig.co.uk"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
              height: '38px', padding: '0 12px', borderRadius: '6px', fontSize: '13px',
              width: '100%', outline: 'none' }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[12px] font-medium text-[#888]">Password</label>
            <Link href="/forgot-password" className="text-[11px]" style={{ color: '#1a6ef5' }}>
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff',
              height: '38px', padding: '0 12px', borderRadius: '6px', fontSize: '13px',
              width: '100%', outline: 'none' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            height: '40px', background: loading ? '#1558c0' : '#1a6ef5',
            color: '#fff', border: 'none', borderRadius: '6px', fontSize: '13px',
            fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer',
            marginTop: '8px', opacity: loading ? 0.8 : 1,
          }}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-[12px] text-[#555]">
        No account?{' '}
        <a href="https://geig.co.uk/register" style={{ color: '#1a6ef5' }}>
          Create one at geig.co.uk
        </a>
      </p>

      <p className="mt-12 text-center text-[11px] text-[#333]">
        © {new Date().getFullYear()} GeiG · sws.geig.co.uk
      </p>
    </div>
  )
}
