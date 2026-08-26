// Shared helpers for enqueueing posts to the publish queue.
import { eq } from 'drizzle-orm'
import type { Context } from 'hono'
import { createDb, type Db } from '../db'
import { posts } from '@telepost/db'
import type { HonoEnv } from '../types'

export interface PublishQueueMessage {
  postId: string
  idempotencyKey: string
}

// Atomically claim a post for publishing (set idempotency key only if null) and
// enqueue it. Returns null if the key was already set (already in flight).
export async function enqueuePostForPublish(
  c: Context<HonoEnv>,
  postId: string
): Promise<PublishQueueMessage | null> {
  const db: Db = createDb(c.env.DB)
  const [row] = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1)
  if (!row) return null

  const idempotencyKey = row.idempotencyKey ?? crypto.randomUUID()

  if (!row.idempotencyKey) {
    const updated = await db
      .update(posts)
      .set({
        idempotencyKey,
        status: 'publishing',
        updatedAt: new Date().toISOString(),
      })
      .where(eq(posts.id, postId))
      .returning()
    if (!updated[0]) return null
  }

  await c.env.POST_QUEUE.send({ postId, idempotencyKey })

  return { postId, idempotencyKey }
}