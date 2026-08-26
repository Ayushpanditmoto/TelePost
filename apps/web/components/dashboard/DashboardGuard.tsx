'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/useAuth'

// Client-side auth guard: bounces to /login when no session exists.
export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#708499' }}>
        Loading…
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}