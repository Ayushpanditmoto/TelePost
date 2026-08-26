// Publishing pipeline, part 1: atomic claim → enqueue.
import { and, eq, isNull } from 'drizzle-orm'
import { createDb } from '../db'
import { posts } from '@telepost/db'
import type { Env } from '../types'

export interface PublishQueueMessage {
  postId: string
  idempotencyKey: string
}

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Atomically claim a post for publishing (idempotency key set only if null) and
 * enqueue it. Returns the key used, or null when the post is missing / already
 * claimed by a concurrent publisher (that caller will do the send).
 */
export async function enqueuePostForPublish(
  env: Env,
  postId: string
): Promise<string | null> {
  const db = createDb(env.DB)
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1)
  if (!post) return null

  // Already has a key (e.g. retrying after failure): reuse it so any in-flight
  // duplicate messages dedupe against the same value.
  if (post.idempotencyKey) {
    await db
      .update(posts)
      .set({ status: 'publishing', updatedAt: nowIso() })
      .where(eq(posts.id, postId))
    await env.POST_QUEUE.send({
      postId,
      idempotencyKey: post.idempotencyKey,
    } satisfies PublishQueueMessage)
    return post.idempotencyKey
  }

  const key = crypto.randomUUID()
  const claimed = await db
    .update(posts)
    .set({ idempotencyKey: key, status: 'publishing', updatedAt: nowIso() })
    .where(and(eq(posts.id, postId), isNull(posts.idempotencyKey)))
    .returning()

  if (!claimed[0]) return null // concurrent claim won; it will enqueue.

  await env.POST_QUEUE.send({ postId, idempotencyKey: key } satisfies PublishQueueMessage)
  return key
}