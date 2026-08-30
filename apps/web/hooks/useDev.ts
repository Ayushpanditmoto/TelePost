'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface SeedResult {
  channels: number
  posts: number
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['channels'] })
  queryClient.invalidateQueries({ queryKey: ['posts'] })
}

// Dev-only (the worker 404s these routes in production): fill the account with
// demo channels and random messages so the dashboard chat has content to show.
export function useSeedDemoData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<SeedResult>('/api/dev/seed', { method: 'POST' }),
    onSuccess: () => invalidate(queryClient),
  })
}

// Dev-only: remove the seeded demo channels (their posts cascade away).
export function useClearDemoData() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      api<{ success: boolean }>('/api/dev/seed', { method: 'DELETE' }),
    onSuccess: () => invalidate(queryClient),
  })
}
