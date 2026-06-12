'use client'
import { useState, useEffect } from 'react'

export default function MainContent({ children }: { children: React.ReactNode }) {
  const [isMember, setIsMember] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      setIsMember(d?.user?.isMember === true)
    }).catch(() => {})
  }, [])

  return (
    <main style={{
      paddingTop: isMember ? '78px' : '52px',
      marginLeft: '232px',
      minHeight: '100vh',
      background: '#0a0a0a',
      transition: 'padding-top 0.1s',
    }}>
      <div style={{ padding: '28px 32px', width: '100%' }}>
        {children}
      </div>
    </main>
  )
}
