import { Hono } from 'hono'
import { and, desc, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { posts, telegramChannels } from '@telepost/db'
import type { HonoEnv, SessionUser } from '../types'
import type { Context } from 'hono'
import { requireAuth } from '../lib/auth'
import { countUserScheduledPosts, getUserPlan } from '../lib/planLimits'
import { claimPostForPublish } from '../lib/publish'
import { processPublishMessage } from '../lib/publisher'
import { MAX_MEDIA_SIZE_BYTES, uploadPostMedia } from '../lib/media'

export const postRoutes = new Hono<HonoEnv>()

type PostRow = typeof posts.$inferSelect

function toPublicPost(row: PostRow) {
  return {
    id: row.id,
    channelId: row.channelId,
    content: row.content,
    status: row.status,
    scheduledAt: row.scheduledAt,
    publishedAt: row.publishedAt,
    errorMessage: row.errorMessage,
    retryCount: row.retryCount,
    telegramMessageId: row.telegramMessageId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const EDITABLE_STATUSES = new Set(['draft', 'scheduled'])
const PUBLISHABLE_STATUSES = new Set(['draft', 'scheduled', 'failed'])

// ─── Validation helpers ──────────────────────────────────────────────────────

function parseFutureDate(value: unknown): { ok: true; iso: string } | { ok: false; error: string } {
  if (typeof value !== 'string' || value.trim() === '') {
    return { ok: false, error: 'scheduledAt is required and must be an ISO date string' }
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return { ok: false, error: 'Invalid scheduledAt — use ISO 8601 format' }
  }
  if (date.getTime() <= Date.now()) {
    return { ok: false, error: 'scheduledAt must be in the future' }
  }
  return { ok: true, iso: date.toISOString() }
}

async function ownedChannelOrError(
  c: Context<HonoEnv>,
  userId: string,
  channelId: string
) {
  const db = createDb(c.env.DB)
  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, channelId), eq(telegramChannels.userId, userId)))
    .limit(1)
  if (!channel) {
    return { ok: false as const, error: 'Channel not found', status: 404 as const }
  }
  return { ok: true as const, channel }
}

async function ownedPostOrError(c: Context<HonoEnv>, user: SessionUser, postId: string) {
  const db = createDb(c.env.DB)
  const [post] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.id, postId), eq(posts.userId, user.id)))
    .limit(1)
  if (!post) {
    return { ok: false as const, error: 'Post not found', status: 404 as const }
  }
  return { ok: true as const, post, db }
}

// Enforce plan cap before scheduling another post.
async function scheduleCapOk(c: Context<HonoEnv>, userId: string) {
  const db = createDb(c.env.DB)
  const plan = await getUserPlan(db, userId)
  // No plan record or unlimited (0) → allow.
  if (!plan || plan.maxScheduledPosts === 0) return { ok: true as const }

  const used = await countUserScheduledPosts(db, userId)
  if (used >= plan.maxScheduledPosts) {
    return {
      ok: false as const,
      error: `Plan limit reached (${plan.maxScheduledPosts} scheduled posts). Upgrade for more.`,
    }
  }
  return { ok: true as const }
}

// GET /api/posts — list posts (?channelId=&status=)
postRoutes.get('/', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const channelId = c.req.query('channelId')
  const statusFilter = c.req.query('status')

  const conditions = [eq(posts.userId, user.id)]
  if (channelId) conditions.push(eq(posts.channelId, channelId))
  if (statusFilter) conditions.push(eq(posts.status, statusFilter as PostRow['status']))

  const rows = await db
    .select()
    .from(posts)
    .where(and(...conditions))
    .orderBy(desc(posts.createdAt))

  return c.json({ posts: rows.map(toPublicPost) })
})

// POST /api/posts — create a draft, or schedule directly when scheduledAt given.
postRoutes.post('/', async (c) => {
  const user = await requireAuth(c)
  const body = (
    await c.req
      .json<{ channelId?: unknown; content?: unknown; scheduledAt?: unknown }>()
      .catch(() => null)
  ) ?? {}

  const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : ''
  const content = typeof body.content === 'string' ? body.content : ''

  if (!channelId) return c.json({ error: 'channelId is required' }, 400)

  const trimmed = content.trim()
  if (!trimmed) return c.json({ error: 'content cannot be empty' }, 400)
  if (trimmed.length > 4096) {
    return c.json({ error: 'content exceeds Telegram limit of 4096 characters' }, 400)
  }

  const channelCheck = await ownedChannelOrError(c, user.id, channelId)
  if (!channelCheck.ok) {
    return c.json({ error: channelCheck.error }, channelCheck.status)
  }

  let scheduledAt: string | null = null
  let status: PostRow['status'] = 'draft'

  if (body.scheduledAt !== undefined && body.scheduledAt !== null) {
    const parsed = parseFutureDate(body.scheduledAt)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const cap = await scheduleCapOk(c, user.id)
    if (!cap.ok) return c.json({ error: cap.error }, 403)

    scheduledAt = parsed.iso
    status = 'scheduled'
  }

  const db = createDb(c.env.DB)
  const inserted = await db
    .insert(posts)
    .values({
      userId: user.id,
      channelId,
      content: trimmed,
      status,
      scheduledAt,
    })
    .returning()

  const post = inserted[0]
  if (!post) return c.json({ error: 'Failed to create post' }, 500)

  return c.json({ post: toPublicPost(post) }, 201)
})

// GET /api/posts/:id
postRoutes.get('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)

  return c.json({ post: toPublicPost(check.post) })
})

// PATCH /api/posts/:id — edit content / scheduledAt while draft or scheduled.
postRoutes.patch('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (!EDITABLE_STATUSES.has(post.status)) {
    return c.json({ error: `Cannot edit a ${post.status} post` }, 409)
  }

  const body = (
    await c.req
      .json<{ content?: unknown; scheduledAt?: unknown | null }>()
      .catch(() => null)
  ) ?? {}

  const updates: Partial<PostRow> = { updatedAt: new Date().toISOString() }

  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim() === '') {
      return c.json({ error: 'content cannot be empty' }, 400)
    }
    if (body.content.length > 4096) {
      return c.json({ error: 'content exceeds Telegram limit of 4096 characters' }, 400)
    }
    updates.content = body.content
  }

  if (body.scheduledAt !== undefined) {
    if (body.scheduledAt === null) {
      // Clearing the schedule returns the post to a draft.
      updates.scheduledAt = null
      updates.status = 'draft'
    } else {
      const parsed = parseFutureDate(body.scheduledAt)
      if (!parsed.ok) return c.json({ error: parsed.error }, 400)
      updates.scheduledAt = parsed.iso
    }
  }

  const db = createDb(c.env.DB)
  const [updated] = await db
    .update(posts)
    .set(updates)
    .where(eq(posts.id, post.id))
    .returning()

  return c.json({ post: updated ? toPublicPost(updated) : toPublicPost(post) })
})

// DELETE /api/posts/:id
postRoutes.delete('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  if (!EDITABLE_STATUSES.has(check.post.status)) {
    return c.json({ error: `Cannot delete a ${check.post.status} post` }, 409)
  }

  await check.db.delete(posts).where(eq(posts.id, check.post.id))

  return c.json({ success: true })
})

// POST /api/posts/:id/publish — enqueue for immediate publishing.
postRoutes.post('/:id/publish', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (!PUBLISHABLE_STATUSES.has(post.status)) {
    return c.json({ error: `Cannot publish a ${post.status} post` }, 409)
  }

  const claimed = await claimPostForPublish(c.env, post.id)
  if (!claimed) return c.json({ error: 'Failed to queue post' }, 500)

  // Deliver directly (free plan, no Queues): run after the response is sent.
  c.executionCtx.waitUntil(
    processPublishMessage(c.env, claimed).catch(() => undefined)
  )

  return c.json({ queued: true, idempotencyKey: claimed.idempotencyKey })
})

// POST /api/posts/:id/schedule — schedule a draft for a future time.
postRoutes.post('/:id/schedule', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (post.status !== 'draft') {
    return c.json(
      { error: `Only drafts can be scheduled (current status: ${post.status})` },
      409
    )
  }

  const body = (await c.req.json<{ scheduledAt?: unknown }>().catch(() => null)) ?? {}
  const parsed = parseFutureDate(body.scheduledAt)
  if (!parsed.ok) return c.json({ error: parsed.error }, 400)

  const cap = await scheduleCapOk(c, user.id)
  if (!cap.ok) return c.json({ error: cap.error }, 403)

  const [updated] = await check.db
    .update(posts)
    .set({
      status: 'scheduled',
      scheduledAt: parsed.iso,
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, post.id))
    .returning()

  return c.json({ post: updated ? toPublicPost(updated) : toPublicPost(post) })
})

// POST /api/posts/:id/reschedule — move a scheduled/failed post to a new time.
postRoutes.post('/:id/reschedule', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (post.status !== 'scheduled' && post.status !== 'failed') {
    return c.json(
      { error: `Only scheduled or failed posts can be rescheduled (current status: ${post.status})` },
      409
    )
  }

  const body = (await c.req.json<{ scheduledAt?: unknown }>().catch(() => null)) ?? {}
  const parsed = parseFutureDate(body.scheduledAt)
  if (!parsed.ok) return c.json({ error: parsed.error }, 400)

  const [updated] = await check.db
    .update(posts)
    .set({
      status: 'scheduled',
      scheduledAt: parsed.iso,
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(posts.id, post.id))
    .returning()

  return c.json({ post: updated ? toPublicPost(updated) : toPublicPost(post) })
})

// POST /api/posts/:id/cancel — cancel a draft or scheduled post.
postRoutes.post('/:id/cancel', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (!EDITABLE_STATUSES.has(post.status)) {
    return c.json({ error: `Cannot cancel a ${post.status} post` }, 409)
  }

  const [updated] = await check.db
    .update(posts)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(posts.id, post.id))
    .returning()

  return c.json({ post: updated ? toPublicPost(updated) : toPublicPost(post) })
})

// POST /api/posts/:id/media — attach one image/video (R2 upload).
postRoutes.post('/:id/media', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (!EDITABLE_STATUSES.has(post.status)) {
    return c.json({ error: `Cannot attach media to a ${post.status} post` }, 409)
  }

  // Plan gate: maxMediaMb of 0 means media is not allowed on this plan.
  const db = createDb(c.env.DB)
  const plan = await getUserPlan(db, user.id)
  if (!plan || plan.maxMediaMb === 0) {
    return c.json(
      { error: 'Your plan does not include media uploads. Upgrade to Pro.' },
      403
    )
  }

  const form = await c.req.parseBody().catch(() => null)
  const fileEntry = form?.file
  if (!(fileEntry instanceof File)) {
    return c.json({ error: 'Multipart "file" field is required' }, 400)
  }
  if (fileEntry.size > MAX_MEDIA_SIZE_BYTES) {
    return c.json({ error: 'File exceeds 50 MB limit' }, 413)
  }

  const result = await uploadPostMedia(c, post.id, fileEntry)
  if (!result.ok) return c.json({ error: result.error }, result.status)

  return c.json({ mediaId: result.mediaId, r2Key: result.r2Key }, 201)
})
