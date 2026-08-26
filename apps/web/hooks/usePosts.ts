'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export type PostStatus =
  | 'draft'
  | 'scheduled'
  | 'publishing'
  | 'published'
  | 'failed'
  | 'cancelled'

export interface Post {
  id: string
  channelId: string
  content: string
  status: PostStatus
  scheduledAt: string | null
  publishedAt: string | null
  errorMessage: string | null
  retryCount: number
  telegramMessageId: number | null
  createdAt: string
  updatedAt: string
}

interface PostsResponse {
  posts: Post[]
}

export function usePosts(channelId: string | null) {
  return useQuery<Post[]>({
    queryKey: ['posts', channelId],
    queryFn: async () => {
      const data = await api<PostsResponse>(
        `/api/posts?channelId=${encodeURIComponent(channelId!)}`
      )
      return data.posts
    },
    enabled: !!channelId,
    staleTime: 1000 * 15,
  })
}

function invalidatePosts(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['posts'] })
}

// Create a draft, or a scheduled post when scheduledAt is provided.
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      channelId: string
      content: string
      scheduledAt?: string | null
    }) => {
      const body: Record<string, unknown> = {
        channelId: input.channelId,
        content: input.content,
      }
      if (input.scheduledAt) body.scheduledAt = input.scheduledAt
      return api<{ post: Post }>('/api/posts', {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function usePublishPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/posts/${id}/publish`, { method: 'POST' }),
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function useCancelPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ post: Post }>(`/api/posts/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api(`/api/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidatePosts(queryClient),
  })
}

export function useReschedulePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      api<{ post: Post }>(`/api/posts/${id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduledAt }),
      }),
    onSuccess: () => invalidatePosts(queryClient),
  })
}