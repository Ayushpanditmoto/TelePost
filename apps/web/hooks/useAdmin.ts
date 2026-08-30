'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AdminUserRow {
  id: string
  telegramId: number
  username: string | null
  displayName: string
  createdAt: string
  channelCount: number
  postCount: number
  planSlug: string | null
  planName: string | null
  subscriptionExpiresAt: string | null
}

export interface PublicPlan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  active: boolean
}

// ─── Queries ─────────────────────────────────────────────────────────────────

// Whether the admin cookie is currently valid. Always resolves (never throws)
// so the page can render its login card without error noise.
export function useAdminSession() {
  return useQuery<boolean>({
    queryKey: ['admin-session'],
    queryFn: async () => {
      const data = await api<{ authenticated: boolean }>('/api/admin/me')
      return data.authenticated
    },
    staleTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  })
}

// Plan catalogue from the public pricing endpoint — used to fill the grant dropdown.
export function useAdminPlans(enabled: boolean) {
  return useQuery<PublicPlan[]>({
    queryKey: ['admin-plans'],
    queryFn: async () => {
      const data = await api<{ plans: PublicPlan[] }>('/api/plans')
      return data.plans
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

// User roster with plan + activity info.
export function useAdminUsers(enabled: boolean) {
  return useQuery<AdminUserRow[]>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const data = await api<{ users: AdminUserRow[] }>('/api/admin/users')
      return data.users
    },
    enabled,
    staleTime: 0,
    retry: false,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  // Plans changed → the dashboard's plan-aware gates will re-resolve on next load.
  queryClient.invalidateQueries({ queryKey: ['admin-plans'] })
}

export function useAdminLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ email, key }: { email: string; key: string }) =>
      api<{ authenticated: boolean }>('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email, key }),
      }),
    onSuccess: () => {
      queryClient.setQueryData(['admin-session'], true)
      invalidate(queryClient)
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => api<{ success: boolean }>('/api/admin/logout', { method: 'POST' }),
    onSuccess: () => {
      queryClient.setQueryData(['admin-session'], false)
      queryClient.removeQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useGrantPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, planSlug, months }: { userId: string; planSlug: string; months: number }) =>
      api(`/api/admin/users/${userId}/subscription`, {
        method: 'POST',
        body: JSON.stringify({ planSlug, months }),
      }),
    onSuccess: () => invalidate(queryClient),
  })
}

export function useRevokePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (userId: string) =>
      api<{ success: boolean; revoked: number }>(
        `/api/admin/users/${userId}/subscription`,
        { method: 'DELETE' }
      ),
    onSuccess: () => invalidate(queryClient),
  })
}

// ─── Manual QR payment review ─────────────────────────────────────────────────

export interface AdminPaymentRow {
  id: string
  userId: string
  userDisplay: string
  userTelegramId: number | null
  planSlug: string
  planName: string
  amount: number
  currency: string
  status: 'pending' | 'confirmed' | 'failed' | 'expired'
  note: string | null
  rejectionReason: string | null
  hasScreenshot: boolean
  createdAt: string
  confirmedAt: string | null
  reviewedAt: string | null
}

// Every manual QR payment, optionally filtered by ?status=.
export function useAdminPayments(enabled: boolean, status?: string) {
  return useQuery<AdminPaymentRow[]>({
    queryKey: ['admin-payments', status ?? 'all'],
    queryFn: async () => {
      const qs = status ? `?status=${encodeURIComponent(status)}` : ''
      const data = await api<{ payments: AdminPaymentRow[] }>(`/api/admin/payments${qs}`)
      return data.payments
    },
    enabled,
    staleTime: 0,
    retry: false,
    refetchInterval: 1000 * 20, // keep the review queue fresh
  })
}

export function useApprovePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, months }: { id: string; months: number }) =>
      api<{ success: boolean; paidForMonths: number; expiresAt: string }>(
        `/api/admin/payments/${id}/approve`,
        { method: 'POST', body: JSON.stringify({ months }) }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}

export function useRejectPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api<{ success: boolean }>(`/api/admin/payments/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })
}