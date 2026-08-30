'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, API_URL } from '@/lib/api'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentConfig {
  configured: boolean
  address: string | null
  network: string | null
  qrUrl: string | null
  note: string | null
}

export interface MyPayment {
  id: string
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
}

// ─── Queries ─────────────────────────────────────────────────────────────────

// Whether manual QR payments are enabled and how to pay (address/network/QR).
export function usePaymentConfig() {
  return useQuery<PaymentConfig>({
    queryKey: ['payment-config'],
    queryFn: () => api<PaymentConfig>('/api/payments/config'),
    staleTime: 1000 * 60 * 10,
  })
}

// The user's own payment requests, newest first.
export function useMyPayments(enabled: boolean) {
  return useQuery<MyPayment[]>({
    queryKey: ['my-payments'],
    queryFn: async () => {
      const data = await api<{ payments: MyPayment[] }>('/api/payments/mine')
      return data.payments
    },
    enabled,
    staleTime: 0,
    refetchOnWindowFocus: true,
  })
}

export interface PublicPlan {
  id: string
  name: string
  slug: string
  price: number
  currency: string
  active: boolean
}

// Public pricing catalogue (/api/plans) — used for the upgrade options.
export function usePublicPlans(enabled: boolean) {
  return useQuery<PublicPlan[]>({
    queryKey: ['public-plans'],
    queryFn: async () => {
      const data = await api<{ plans: PublicPlan[] }>('/api/plans')
      return data.plans
    },
    enabled,
    staleTime: 1000 * 60 * 5,
  })
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export function useRequestPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ planSlug, file, note }: { planSlug: string; file: File; note?: string }) => {
      const form = new FormData()
      form.append('planSlug', planSlug)
      form.append('file', file)
      if (note && note.trim()) form.append('note', note.trim())
      return api<{ payment: MyPayment }>('/api/payments/request', {
        method: 'POST',
        body: form,
      })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-payments'] }),
  })
}

export function useCancelPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api<{ success: boolean }>(`/api/payments/${id}/cancel`, { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-payments'] }),
  })
}

// Auth-checked stream URL for a payment screenshot; the session cookie authorises it.
export function paymentScreenshotUrl(paymentId: string): string {
  return `${API_URL}/api/payments/${encodeURIComponent(paymentId)}/screenshot`
}