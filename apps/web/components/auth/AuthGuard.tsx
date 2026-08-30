'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/useAuth'
import LoadingScreen from '@/components/common/LoadingScreen'

// Client-side guest guard: bounces authenticated users to /dashboard so
// someone who is already logged in never sees the login screen again.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: me, isLoading } = useMe()
  const user = me?.user ?? null

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/dashboard')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return <LoadingScreen label="Checking your session" />
  }

  if (user) return null

  return <>{children}</>
}