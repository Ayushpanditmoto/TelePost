// Plan limit resolution: uses the user's active subscription, falling back to
// the seeded Free plan when no subscription exists yet.
import { and, desc, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'
import { plans, posts, subscriptions, telegramChannels, type Plan } from '@telepost/db'
import type { Db } from '../db'

export async function getUserPlan(db: Db, userId: string): Promise<Plan | null> {
  const now = new Date().toISOString()

  const rows = await db
    .select({ plan: plans })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, 'active'),
        or(isNull(subscriptions.expiresAt), gt(subscriptions.expiresAt, now))
      )
    )
    .orderBy(desc(subscriptions.expiresAt))
    .limit(1)

  if (rows[0]) return rows[0].plan

  // No active subscription → Free plan (seeded in 0001_initial.sql).
  const [free] = await db.select().from(plans).where(eq(plans.slug, 'free')).limit(1)
  return free ?? null
}

export async function countUserChannels(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(telegramChannels)
    .where(eq(telegramChannels.userId, userId))
  return row?.value ?? 0
}

// Count a user's current scheduled+queued posts (excludes drafts, published, failed, cancelled).
// Free plan (`maxScheduledPosts=0`) is treated as unlimited, matching the seed.
export async function countUserScheduledPosts(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ value: sql<number>`count(*)` })
    .from(posts)
    .where(
      and(eq(posts.userId, userId), inArray(posts.status, ['scheduled', 'publishing']))
    )
  return row?.value ?? 0
}