'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/useAuth'

// Client-side guest guard: bounces authenticated users to /dashboard so
// someone who is already logged in never sees the login screen again.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: user, isLoading } = useMe()

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#708499' }}>
        Loading…
      </div>
    )
  }

  if (user) return null

  return <>{children}</>
}