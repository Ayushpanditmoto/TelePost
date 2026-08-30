'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

export interface Channel {
  id: string
  telegramBotId: number
  telegramChatId: string
  username: string | null
  title: string
  verified: boolean
  hasPhoto: boolean
  createdAt: string
  updatedAt: string
}

interface ChannelsResponse {
  channels: Channel[]
}

export function useChannels() {
  return useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const data = await api<ChannelsResponse>('/api/channels')
      return data.channels
    },
    staleTime: 1000 * 30,
  })
}

export function useConnectChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (chatId: string) =>
      api<{ channel: Channel }>('/api/channels', {
        method: 'POST',
        body: JSON.stringify({ chatId }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  })
}

export function useVerifyChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ channel: Channel }>(`/api/channels/${id}/verify`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  })
}

export function useRemoveChannel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api(`/api/channels/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  })
}