'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/hooks/useAuth'
import LoadingScreen from '@/components/common/LoadingScreen'

// Client-side auth guard: bounces to /login when no session exists.
export default function DashboardGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { data: me, isLoading } = useMe()
  const user = me?.user ?? null

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [isLoading, user, router])

  if (isLoading) {
    return <LoadingScreen label="Loading your workspace" />
  }

  if (!user) return null

  return <>{children}</>
}