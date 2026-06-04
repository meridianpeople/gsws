'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CloudServersRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/compute/vps') }, [])
  return null
}
