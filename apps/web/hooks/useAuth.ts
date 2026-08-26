'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { SessionUser } from '@/lib/api'

interface MeResponse {
  user: SessionUser
}

// Current authenticated user (null when logged out).
export function useMe() {
  return useQuery<SessionUser | null>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        const data = await api<MeResponse>('/api/auth/me')
        return data.user
      } catch (err) {
        if (err instanceof Error && 'status' in err && (err as { status: number }).status === 401) {
          return null
        }
        throw err
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    queryClient.setQueryData(['me'], null)
    queryClient.clear()
  }
}