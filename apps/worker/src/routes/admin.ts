import { Hono } from 'hono'
import { and, desc, eq, gt, isNull, or, sql } from 'drizzle-orm'
import { createDb, type Db } from '../db'
import { payments, plans, posts, subscriptions, telegramChannels, users } from '@telepost/db'
import type { HonoEnv } from '../types'
import {
  clearAdminCookie,
  createAdminCookieValue,
  isAdminConfigured,
  isAuthenticatedAdmin,
  requireAdmin,
  setAdminCookie,
  verifyAdminCredentials,
} from '../lib/adminAuth'

export const adminRoutes = new Hono<HonoEnv>()

// ─── Auth ────────────────────────────────────────────────────────────────────

// POST /api/admin/login — body: { email, key }, both matched against env.
adminRoutes.post('/login', async (c) => {
  if (!isAdminConfigured(c.env)) {
    return c.json({ error: 'Admin panel is not configured on this deployment' }, 503)
  }

  const body = (await c.req.json<{ email?: unknown; key?: unknown }>().catch(() => null)) ?? {}
  const ok = await verifyAdminCredentials(c.env, body.email, body.key)
  if (!ok) {
    // Same message for wrong email / wrong key / malformed body.
    return c.json({ error: 'Invalid admin credentials' }, 401)
  }

  const { value } = await createAdminCookieValue(c.env)
  setAdminCookie(c, value)
  return c.json({ authenticated: true })
})

// POST /api/admin/logout — clear the admin cookie.
adminRoutes.post('/logout', (c) => {
  clearAdminCookie(c)
  return c.json({ success: true })
})

// GET /api/admin/me — never 401s; lets the frontend learn its state quietly.
adminRoutes.get('/me', async (c) => {
  const authenticated = await isAuthenticatedAdmin(c)
  return c.json({ authenticated })
})

// ─── Users & plans (guarded) ────────────────────────────────────────────────

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

// Latest still-valid subscription per user (mirrors getUserPlan semantics).
async function loadActiveSubscriptions(db: Db) {
  const now = new Date().toISOString()
  const rows = await db
    .select({ sub: subscriptions, plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(plans.id, subscriptions.planId))
    .where(
      and(
        eq(subscriptions.status, 'active'),
        or(isNull(subscriptions.expiresAt), gt(subscriptions.expiresAt, now))
      )
    )
  // Keep only the furthest-out expiry per user in case of legacy overlaps.
  const byUser = new Map<string, { slug: string; name: string; expiresAt: string | null }>()
  for (const row of rows) {
    const prev = byUser.get(row.sub.userId)
    if (!prev || (row.sub.expiresAt ?? '') > (prev.expiresAt ?? '')) {
      byUser.set(row.sub.userId, {
        slug: row.plan.slug,
        name: row.plan.name,
        expiresAt: row.sub.expiresAt,
      })
    }
  }
  return byUser
}

// GET /api/admin/users — every user with plan + activity counts.
adminRoutes.get('/users', async (c) => {
  await requireAdmin(c)
  const db = createDb(c.env.DB)

  const [userRows, subsByUser, channelCounts, postCounts] = await Promise.all([
    db.select().from(users).orderBy(desc(users.createdAt)),
    loadActiveSubscriptions(db),
    db
      .select({ userId: telegramChannels.userId, value: sql<number>`count(*)` })
      .from(telegramChannels)
      .groupBy(telegramChannels.userId),
    db
      .select({ userId: posts.userId, value: sql<number>`count(*)` })
      .from(posts)
      .groupBy(posts.userId),
  ])

  const channelsByUser = new Map(channelCounts.map((r) => [r.userId, Number(r.value)]))
  const postsByUser = new Map(postCounts.map((r) => [r.userId, Number(r.value)]))

  const outUsers: AdminUserRow[] = userRows.map((u) => {
    const sub = subsByUser.get(u.id)
    return {
      id: u.id,
      telegramId: u.telegramId,
      username: u.telegramUsername,
      displayName: u.displayName,
      createdAt: u.createdAt,
      channelCount: channelsByUser.get(u.id) ?? 0,
      postCount: postsByUser.get(u.id) ?? 0,
      planSlug: sub?.slug ?? 'free',
      planName: sub?.name ?? 'Free',
      subscriptionExpiresAt: sub?.expiresAt ?? null,
    }
  })

  return c.json({ users: outUsers })
})

// POST /api/admin/users/:id/subscription — grant a paid plan.
// Body: { planSlug: string, months?: number } → current actives are expired and
// a fresh subscription starts now for `months` months (default 1, max 36).
adminRoutes.post('/users/:id/subscription', async (c) => {
  await requireAdmin(c)
  const userId = c.req.param('id')
  const db = createDb(c.env.DB)

  const body = (await c.req.json<{ planSlug?: unknown; months?: unknown }>().catch(() => null)) ?? {}
  const planSlug = typeof body.planSlug === 'string' ? body.planSlug.trim() : ''
  if (!planSlug) return c.json({ error: 'planSlug is required' }, 400)

  let months = 1
  if (body.months !== undefined && body.months !== null) {
    if (typeof body.months !== 'number' || !Number.isInteger(body.months)) {
      return c.json({ error: 'months must be an integer' }, 400)
    }
    months = Math.min(Math.max(body.months, 1), 36)
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const [plan] = await db
    .select()
    .from(plans)
    .where(and(eq(plans.slug, planSlug), eq(plans.active, true)))
    .limit(1)
  if (!plan) return c.json({ error: `Plan "${planSlug}" not found` }, 400)

  const now = new Date()
  const expires = new Date(now)
  expires.setMonth(expires.getMonth() + months)

  // Atomic swap: retire the user's active subscriptions, then insert the new one.
  await db.batch([
    db
      .update(subscriptions)
      .set({ status: 'expired' })
      .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active'))),
    db.insert(subscriptions).values({
      userId: user.id,
      planId: plan.id,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    }),
  ])

  // Re-read the fresh subscription so the response reflects stored state.
  const [inserted] = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active')))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1)
  if (!inserted) {
    return c.json({ error: 'Failed to create subscription' }, 500)
  }

  return c.json({
    subscription: {
      id: inserted.id,
      userId: inserted.userId,
      planSlug: plan.slug,
      planName: plan.name,
      status: inserted.status,
      startedAt: inserted.startedAt,
      expiresAt: inserted.expiresAt,
    },
  })
})

// DELETE /api/admin/users/:id/subscription — revoke paid access. With no active
// subscription left, getUserPlan() falls back to the seeded Free plan.
adminRoutes.delete('/users/:id/subscription', async (c) => {
  await requireAdmin(c)
  const userId = c.req.param('id')
  const db = createDb(c.env.DB)

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (!user) return c.json({ error: 'User not found' }, 404)

  const revoked = await db
    .update(subscriptions)
    .set({ status: 'expired' })
    .where(and(eq(subscriptions.userId, user.id), eq(subscriptions.status, 'active')))
    .returning()

  return c.json({ success: true, revoked: revoked.length })
})

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
  status: string
  note: string | null
  rejectionReason: string | null
  hasScreenshot: boolean
  createdAt: string
  confirmedAt: string | null
  reviewedAt: string | null
}

// GET /api/admin/payments — every QR payment (optionally filtered by status).
adminRoutes.get('/payments', async (c) => {
  await requireAdmin(c)
  const db = createDb(c.env.DB)

  const status = c.req.query('status')
  const STATUSES = ['pending', 'confirmed', 'failed', 'expired'] as const
  const where =
    status && (STATUSES as readonly string[]).includes(status)
      ? eq(payments.status, status as (typeof STATUSES)[number])
      : undefined

  const rows = await db
    .select({ payment: payments, plan: plans, user: users })
    .from(payments)
    .innerJoin(plans, eq(plans.id, payments.planId))
    .innerJoin(users, eq(users.id, payments.userId))
    .where(where)
    .orderBy(desc(payments.createdAt))
    .limit(200)

  return c.json({
    payments: rows.map((r) => ({
      id: r.payment.id,
      userId: r.payment.userId,
      userDisplay: r.user.displayName,
      userTelegramId: r.user.telegramId,
      planSlug: r.plan.slug,
      planName: r.plan.name,
      amount: r.payment.amount,
      currency: r.payment.currency,
      status: r.payment.status,
      note: r.payment.note,
      rejectionReason: r.payment.rejectionReason,
      hasScreenshot: Boolean(r.payment.screenshotKey),
      createdAt: r.payment.createdAt,
      confirmedAt: r.payment.confirmedAt,
      reviewedAt: r.payment.reviewedAt,
    })) as AdminPaymentRow[],
  })
})

// POST /api/admin/payments/:id/approve — confirms the payment and activates the
// plan. Body: { months?: number } (default 1). Reuses the subscription swap so
// the user ends up with exactly one active subscription.
adminRoutes.post('/payments/:id/approve', async (c) => {
  await requireAdmin(c)
  const paymentId = c.req.param('id')
  const db = createDb(c.env.DB)

  const [payment] = await db
    .select({ payment: payments, plan: plans })
    .from(payments)
    .innerJoin(plans, eq(plans.id, payments.planId))
    .where(eq(payments.id, paymentId))
    .limit(1)
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.payment.status !== 'pending') {
    return c.json({ error: 'Only pending payments can be approved' }, 400)
  }

  const body = (
    await c.req.json<{ months?: unknown }>().catch(() => null)
  ) ?? {}
  let months = 1
  if (body.months !== undefined && body.months !== null) {
    if (typeof body.months !== 'number' || !Number.isInteger(body.months)) {
      return c.json({ error: 'months must be an integer' }, 400)
    }
    months = Math.min(Math.max(body.months, 1), 36)
  }

  const now = new Date()
  const expires = new Date(now)
  expires.setMonth(expires.getMonth() + months)

  await db.batch([
    db
      .update(payments)
      .set({
        status: 'confirmed',
        confirmedAt: now.toISOString(),
        reviewedAt: now.toISOString(),
        reviewedBy: c.env.ADMIN_EMAIL ?? 'admin',
      })
      .where(eq(payments.id, paymentId)),
    // Retire any current active subscription, then start the new one.
    db
      .update(subscriptions)
      .set({ status: 'expired' })
      .where(
        and(eq(subscriptions.userId, payment.payment.userId), eq(subscriptions.status, 'active'))
      ),
    db.insert(subscriptions).values({
      userId: payment.payment.userId,
      planId: payment.plan.id,
      status: 'active',
      startedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    }),
  ])

  return c.json({ success: true, paidForMonths: months, expiresAt: expires.toISOString() })
})

// POST /api/admin/payments/:id/reject — marks the payment failed with a reason.
adminRoutes.post('/payments/:id/reject', async (c) => {
  await requireAdmin(c)
  const paymentId = c.req.param('id')
  const db = createDb(c.env.DB)

  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1)
  if (!payment) return c.json({ error: 'Payment not found' }, 404)
  if (payment.status !== 'pending') {
    return c.json({ error: 'Only pending payments can be rejected' }, 400)
  }

  const body = (await c.req.json<{ reason?: unknown }>().catch(() => null)) ?? {}
  const reason =
    typeof body.reason === 'string' ? body.reason.trim().slice(0, 500) : ''

  await db
    .update(payments)
    .set({
      status: 'failed',
      rejectionReason: reason || 'Rejected by admin',
      reviewedAt: new Date().toISOString(),
      reviewedBy: c.env.ADMIN_EMAIL ?? 'admin',
    })
    .where(eq(payments.id, paymentId))

  return c.json({ success: true })
})
