import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { postMedia, posts } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'

export const mediaRoutes = new Hono<HonoEnv>()

// GET /api/media/:mediaId — stream a stored attachment back to its owner.
// Bytes live in R2; ownership is enforced by joining posts on the session user.
mediaRoutes.get('/:mediaId', async (c) => {
  const user = await requireAuth(c)
  const mediaId = c.req.param('mediaId')

  const db = createDb(c.env.DB)
  const [row] = await db
    .select({ media: postMedia, ownerId: posts.userId })
    .from(postMedia)
    .innerJoin(posts, eq(posts.id, postMedia.postId))
    .where(eq(postMedia.id, mediaId))
    .limit(1)

  if (!row || row.ownerId !== user.id) {
    return c.json({ error: 'Not found' }, 404)
  }

  const obj = await c.env.MEDIA_BUCKET.get(row.media.r2Key)
  if (!obj) {
    return c.json({ error: 'Media missing from storage' }, 404)
  }

  return new Response(obj.body as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': row.media.mimeType,
      'Content-Length': String(row.media.fileSizeBytes),
      // Private caching lets <img>/<video> reuse the bytes within the session
      // without ever exposing them cross-user.
      'Cache-Control': 'private, max-age=86400',
    },
  })
})