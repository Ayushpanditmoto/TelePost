// Publishing pipeline, part 1: atomic claim.
// (Queue-based delivery was removed for the Workers free plan — callers run
// processPublishMessage directly via waitUntil. The queue design lives in git
// history and can be restored when upgrading to Workers Paid.)
import { and, eq, isNull } from 'drizzle-orm'
import { createDb } from '../db'
import { posts } from '@telepost/db'
import type { Env } from '../types'

export interface PublishClaim {
  postId: string
  idempotencyKey: string
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Atomically claim a post for publishing (idempotency key set only if null).
 * Returns the claim to hand to processPublishMessage, or null when the post is
 * missing / already claimed by a concurrent publisher / already published.
 */
export async function claimPostForPublish(
  env: Env,
  postId: string
): Promise<PublishClaim | null> {
  const db = createDb(env.DB)
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return null
  if (post.status === 'published' || post.status === 'cancelled') return null

  // Already has a key (retry after failure or previous claim): reuse it so any
  // concurrent duplicate dedupes against the same value.
  if (post.idempotencyKey) {
    await db
      .update(posts)
      .set({ status: 'publishing', updatedAt: nowIso() })
      .where(eq(posts.id, postId))
    return { postId, idempotencyKey: post.idempotencyKey }
  }

  const key = crypto.randomUUID()
  const claimed = await db
    .update(posts)
    .set({ idempotencyKey: key, status: 'publishing', updatedAt: nowIso() })
    .where(and(eq(posts.id, postId), isNull(posts.idempotencyKey)))
    .returning()

  if (!claimed[0]) return null // concurrent claim won; it will deliver.

  return { postId, idempotencyKey: key }
}