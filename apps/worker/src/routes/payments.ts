import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { payments, plans } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'
import { requireAdmin } from '../lib/adminAuth'

export const paymentRoutes = new Hono<HonoEnv>()

// Manual QR payments: users pay your TrustWallet address, upload a screenshot,
// and the admin approves manually. The wallet/QR details come from env so you
// never expose secrets in code.

const SCREENSHOT_R2_PREFIX = 'payment-screenshots/'
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024 // 5 MB is plenty for a screenshot
const ACCEPTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

export interface PaymentWithPlan {
  id: string
  planSlug: string
  planName: string
  amount: number
  currency: string
  status: string
  note: string | null
  rejectionReason: string | null
  hasScreenshot: boolean
  createdAt: string
  confirmedAt: string | null
}

function toPayment(
  row: typeof payments.$inferSelect,
  plan?: typeof plans.$inferSelect
): PaymentWithPlan {
  return {
    id: row.id,
    planSlug: plan?.slug ?? '',
    planName: plan?.name ?? '',
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    note: row.note,
    rejectionReason: row.rejectionReason,
    hasScreenshot: Boolean(row.screenshotKey),
    createdAt: row.createdAt,
    confirmedAt: row.confirmedAt,
  }
}

// GET /api/payments/config — public; whether manual QR payments are enabled
// and what the user needs (address, network, optional QR image URL, note).
paymentRoutes.get('/config', (c) => {
  const address = c.env.PAYMENT_ADDRESS?.trim() ?? ''
  const configured = address.length > 0
  return c.json({
    configured,
    address: configured ? address : null,
    network: configured ? (c.env.PAYMENT_NETWORK?.trim() || null) : null,
    qrUrl: configured ? (c.env.PAYMENT_QR_URL?.trim() || null) : null,
    note: configured ? (c.env.PAYMENT_NOTE?.trim() || null) : null,
  })
})

// POST /api/payments/request — auth; multipart: planSlug, file (screenshot), note.
// Creates a pending payment; the admin activates the plan after manual review.
paymentRoutes.post('/request', async (c) => {
  const user = await requireAuth(c)
  if (!c.env.PAYMENT_ADDRESS?.trim()) {
    return c.json({ error: 'Payments are not configured on this deployment' }, 503)
  }

  const form = await c.req.parseBody().catch(() => null)
  if (!form) return c.json({ error: 'Expected a multipart form (planSlug + file)' }, 400)

  const planSlug =
    typeof form.planSlug === 'string' ? String(form.planSlug).trim() : ''
  const note =
    typeof form.note === 'string' ? String(form.note).trim().slice(0, 500) : ''
  const fileEntry = form.file
  if (!planSlug) return c.json({ error: 'planSlug is required' }, 400)
  if (!(fileEntry instanceof File)) {
    return c.json({ error: 'A payment screenshot is required' }, 400)
  }
  const file = fileEntry as File

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return c.json({
      error: `Unsupported file type "${file.type}" — upload a PNG, JPEG or WebP`,
    }, 415)
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    return c.json({ error: 'Screenshot exceeds 5 MB limit' }, 413)
  }

  const db = createDb(c.env.DB)

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, planSlug), eq(plans.active, true)))
    .limit(1)
  if (!plan) return c.json({ error: `Plan "${planSlug}" not found` }, 400)
  if (plan.price <= 0) return c.json({ error: 'This plan is free — no payment needed' }, 400)

  // One outstanding payment at a time keeps manual review unambiguous.
  const pending = await db
    .select()
    .from(payments)
    .where(and(eq(payments.userId, user.id), eq(payments.status, 'pending')))
    .limit(1)
  if (pending[0]) {
    return c.json({ error: 'You already have a payment awaiting review.' }, 409)
  }

  // Store the screenshot first so the payment row never references a lost key.
  const ext =
    file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const r2Key = `${SCREENSHOT_R2_PREFIX}${crypto.randomUUID()}.${ext}`
  await c.env.MEDIA_BUCKET.put(r2Key, file.stream(), {
    httpMetadata: { contentType: file.type },
  })

  const inserted = await db
    .insert(payments)
    .values({
      userId: user.id,
      planId: plan.id,
      provider: 'manual_qr',
      amount: plan.price,
      currency: 'USDT',
      status: 'pending',
      screenshotKey: r2Key,
      note: note || null,
    })
    .returning()

  const row = inserted[0]
  if (!row) {
    // Clean up the orphan so storage doesn't leak.
    await c.env.MEDIA_BUCKET.delete(r2Key).catch(() => undefined)
    return c.json({ error: 'Failed to record payment' }, 500)
  }

  return c.json({ payment: toPayment(row, plan) }, 201)
})

// GET /api/payments/mine — auth; the user's own payment history.
paymentRoutes.get('/mine', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const rows = await db
    .select({ payment: payments, plan: plans })
    .from(payments)
    .innerJoin(plans, eq(plans.id, payments.planId))
    .where(eq(payments.userId, user.id))
    .orderBy(desc(payments.createdAt))

  return c.json({ payments: rows.map((r) => toPayment(r.payment, r.plan)) })
})

// POST /api/payments/:id/cancel — owner only; only for pending payments.
paymentRoutes.post('/:id/cancel', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, c.req.param('id')))
    .limit(1)
  if (!row || row.userId !== user.id) return c.json({ error: 'Payment not found' }, 404)
  if (row.status !== 'pending') {
    return c.json({ error: 'Only pending payments can be cancelled' }, 400)
  }

  await db
    .update(payments)
    .set({ status: 'failed', transactionReference: 'cancelled' })
    .where(eq(payments.id, row.id))

  if (row.screenshotKey) {
    await c.env.MEDIA_BUCKET.delete(row.screenshotKey).catch(() => undefined)
  }

  return c.json({ success: true })
})

// GET /api/payments/:id/screenshot — owner or admin; streams the screenshot.
paymentRoutes.get('/:id/screenshot', async (c) => {
  const db = createDb(c.env.DB)

  const [row] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, c.req.param('id')))
    .limit(1)
  if (!row) return c.json({ error: 'Payment not found' }, 404)

  // Owner via the session middleware; otherwise the admin session is allowed.
  const isOwner = c.get('user')?.id === row.userId
  if (!isOwner) {
    await requireAdmin(c)
  }
  if (!row.screenshotKey) return c.json({ error: 'No screenshot on file' }, 404)

  const obj = await c.env.MEDIA_BUCKET.get(row.screenshotKey)
  if (!obj) return c.json({ error: 'Screenshot missing from storage' }, 404)

  return new Response(obj.body as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=600',
    },
  })
})