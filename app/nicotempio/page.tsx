'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminUnlock() {
  const router = useRouter()

  useEffect(() => {
    localStorage.setItem('admin_unlocked', 'true')
    router.replace('/')
  }, [router])

  return null
}
