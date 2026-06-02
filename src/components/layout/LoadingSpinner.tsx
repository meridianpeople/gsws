'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function LoadingSpinner() {
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!loading) return null

  return (
    <>
      {/* Top progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: '2px',
        background: 'linear-gradient(90deg, #1a6ef5, #5599ff, #1a6ef5)',
        backgroundSize: '200% 100%',
        zIndex: 9999,
        animation: 'gsws-progress 0.8s ease-in-out infinite',
      }} />
      {/* Overlay spinner */}
      <div style={{
        position: 'fixed', top: '52px', left: '232px', right: 0, bottom: 0,
        background: 'rgba(245,245,245,0.6)',
        zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(1px)',
      }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '50%',
          border: '3px solid #ebebeb',
          borderTop: '3px solid #1a6ef5',
          animation: 'gsws-spin 0.7s linear infinite',
        }} />
      </div>
      <style>{`
        @keyframes gsws-spin { to { transform: rotate(360deg); } }
        @keyframes gsws-progress {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
