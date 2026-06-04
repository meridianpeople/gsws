'use client'
import { useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const IDLE_TIMEOUT_MS = 15 * 60 * 1000  // 15 minutes
const WARNING_MS = 60 * 1000             // warn 1 minute before

const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click', 'focus']

export default function IdleTimeout() {
  const router = useRouter()
  const idleTimer = useRef<NodeJS.Timeout | null>(null)
  const warningTimer = useRef<NodeJS.Timeout | null>(null)
  const warningShown = useRef(false)

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {}
    router.push('/login?reason=idle')
  }, [router])

  const showWarning = useCallback(() => {
    if (warningShown.current) return
    warningShown.current = true
    // Use a non-blocking toast-style warning
    const div = document.createElement('div')
    div.id = 'gsws-idle-warning'
    div.style.cssText = `
      position:fixed;bottom:24px;right:24px;z-index:9999;
      background:#1a1a1a;border:1px solid #f59e0b;border-radius:10px;
      padding:16px 20px;max-width:320px;box-shadow:0 8px 32px rgba(0,0,0,0.4);
      font-family:-apple-system,sans-serif;
    `
    div.innerHTML = `
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#f59e0b;">⚠️ Session expiring</p>
      <p style="margin:0 0 12px;font-size:12px;color:#aaa;">You will be logged out in 1 minute due to inactivity.</p>
      <button onclick="document.getElementById('gsws-idle-warning').remove()" 
        style="height:32px;padding:0 16px;background:#1a6ef5;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;">
        Stay logged in
      </button>
    `
    document.body.appendChild(div)
  }, [])

  const resetTimer = useCallback(() => {
    // Clear existing timers
    if (idleTimer.current) clearTimeout(idleTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)

    // Remove warning if shown
    const warning = document.getElementById('gsws-idle-warning')
    if (warning) {
      warning.remove()
      warningShown.current = false
    }

    // Set warning timer (14 min)
    warningTimer.current = setTimeout(showWarning, IDLE_TIMEOUT_MS - WARNING_MS)

    // Set logout timer (15 min)
    idleTimer.current = setTimeout(logout, IDLE_TIMEOUT_MS)
  }, [logout, showWarning])

  useEffect(() => {
    // Start timers
    resetTimer()

    // Listen for activity
    ACTIVITY_EVENTS.forEach(event => {
      window.addEventListener(event, resetTimer, { passive: true })
    })

    // Also reset on visibility change (tab focus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) resetTimer()
    })

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
      ACTIVITY_EVENTS.forEach(event => {
        window.removeEventListener(event, resetTimer)
      })
    }
  }, [resetTimer])

  return null // no UI — warning injected into DOM dynamically
}
