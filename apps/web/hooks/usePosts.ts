'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, API_URL } from '@/lib/api'

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
  /** Shared by all upcoming occurrences of a recurring schedule. */
  seriesId?: string | null
  /** Attachments (metadata only; bytes stream from /api/media/:id). */
  media?: PostMediaInfo[]
  createdAt: string
  updatedAt: string
}

export interface PostMediaInfo {
  id: string
  mimeType: string
  fileSizeBytes: number
}

interface PostsResponse {
  posts: Post[]
}

export function usePosts(channelId: string | null | undefined) {
  return useQuery<Post[]>({
    queryKey: ['posts', channelId ?? 'all'],
    queryFn: async () => {
      const qs = channelId ? `?channelId=${encodeURIComponent(channelId)}` : ''
      const data = await api<PostsResponse>(`/api/posts${qs}`)
      return data.posts
    },
    staleTime: 1000 * 15,
  })
}

// Attach an image/video to an existing draft/scheduled post (R2 upload).
export function useUploadMedia() {
  return useMutation({
    mutationFn: ({ postId, file }: { postId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api<{ mediaId: string; r2Key: string }>(`/api/posts/${postId}/media`, {
        method: 'POST',
        body: form,
      })
    },
  })
}

function invalidatePosts(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['posts'] })
}

// Create a draft, a scheduled post, or a recurring series of scheduled posts.
export function useCreatePost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      channelId: string
      content: string
      scheduledAt?: string | null
      /** Pre-computed ISO datetimes — one per recurring occurrence. */
      occurrences?: string[]
    }) => {
      const body: Record<string, unknown> = {
        channelId: input.channelId,
        content: input.content,
      }
      if (input.scheduledAt) body.scheduledAt = input.scheduledAt
      if (input.occurrences?.length) body.occurrences = input.occurrences
      return api<{ post: Post; posts?: Post[] }>('/api/posts', {
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
    mutationFn: ({ id, scope }: { id: string; scope?: 'series' }) =>
      api(`/api/posts/${id}${scope === 'series' ? '?scope=series' : ''}`, {
        method: 'DELETE',
      }),
    onSuccess: () => invalidatePosts(queryClient),
  })
}

// Edit a draft/scheduled/failed post's content (database-only; nothing is sent
// to Telegram until publish/schedule fires).
export function useEditPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api<{ post: Post }>(`/api/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
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

// Auth-checked stream URL for a post attachment — drop straight into
// <img src> / <video src>; the session cookie authorizes the fetch.
export function postMediaUrl(mediaId: string): string {
  return `${API_URL}/api/media/${encodeURIComponent(mediaId)}`
}