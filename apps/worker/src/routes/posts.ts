import { Hono } from 'hono'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { createDb } from '../db'
import { postMedia, posts, telegramChannels } from '@telepost/db'
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
    seriesId: row.seriesId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

const EDITABLE_STATUSES = new Set(['draft', 'scheduled'])
const PUBLISHABLE_STATUSES = new Set(['draft', 'scheduled', 'failed'])
// Statuses whose message text can be edited (nothing sent to Telegram yet or
// delivery never succeeded). Published posts are frozen as-is by design.
const CONTENT_EDITABLE_STATUSES = new Set(['draft', 'scheduled', 'failed'])

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

// Enforce plan cap before scheduling more posts. `additional` counts how many
// new scheduled rows this request will create (1 normally, N for recurrences).
async function scheduleCapOk(
  c: Context<HonoEnv>,
  userId: string,
  additional = 1
) {
  const db = createDb(c.env.DB)
  const plan = await getUserPlan(db, userId)
  // No plan record or unlimited (0) → allow.
  if (!plan || plan.maxScheduledPosts === 0) return { ok: true as const }

  const used = await countUserScheduledPosts(db, userId)
  if (used + additional > plan.maxScheduledPosts) {
    const remaining = Math.max(0, plan.maxScheduledPosts - used)
    return {
      ok: false as const,
      error: `Plan limit reached (${plan.maxScheduledPosts} scheduled posts — ${remaining} slots left). Upgrade for more.`,
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

// POST /api/posts — create a draft, a scheduled post, or a recurring series
// (`occurrences` = pre-computed ISO datetimes, one DB row per occurrence).
postRoutes.post('/', async (c) => {
  const user = await requireAuth(c)
  const body = (
    await c.req
      .json<{
        channelId?: unknown
        content?: unknown
        scheduledAt?: unknown
        occurrences?: unknown
      }>()
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
  let occurrenceIsos: string[] | null = null

  if (body.occurrences !== undefined && body.occurrences !== null) {
    if (!Array.isArray(body.occurrences)) {
      return c.json({ error: 'occurrences must be an array of ISO date strings' }, 400)
    }
    const MAX_OCCURRENCES = 60
    const list = body.occurrences as unknown[]
    if (list.length < 1 || list.length > MAX_OCCURRENCES) {
      return c.json(
        { error: `occurrences must contain between 1 and ${MAX_OCCURRENCES} dates` },
        400
      )
    }
    const isos: string[] = []
    let lastMs = 0
    for (let i = 0; i < list.length; i++) {
      const parsed = parseFutureDate(list[i])
      if (!parsed.ok) {
        return c.json({ error: `occurrences[${i}]: ${parsed.error}` }, 400)
      }
      if (new Date(parsed.iso).getTime() <= lastMs) {
        return c.json(
          { error: 'occurrences must be unique and in ascending order' },
          400
        )
      }
      lastMs = new Date(parsed.iso).getTime()
      isos.push(parsed.iso)
    }
    occurrenceIsos = isos

    const cap = await scheduleCapOk(c, user.id, isos.length)
    if (!cap.ok) return c.json({ error: cap.error }, 403)
  } else if (body.scheduledAt !== undefined && body.scheduledAt !== null) {
    const parsed = parseFutureDate(body.scheduledAt)
    if (!parsed.ok) return c.json({ error: parsed.error }, 400)

    const cap = await scheduleCapOk(c, user.id)
    if (!cap.ok) return c.json({ error: cap.error }, 403)

    scheduledAt = parsed.iso
    status = 'scheduled'
  }

  const db = createDb(c.env.DB)

  let rows: Array<typeof posts.$inferInsert>
  if (occurrenceIsos) {
    const seriesId = crypto.randomUUID()
    rows = occurrenceIsos.map((iso) => ({
      userId: user.id,
      channelId,
      content: trimmed,
      status: 'scheduled' as PostRow['status'],
      scheduledAt: iso,
      seriesId,
    }))
  } else {
    rows = [
      {
        userId: user.id,
        channelId,
        content: trimmed,
        status,
        scheduledAt,
      },
    ]
  }

  // Chunked inserts keep each statement under D1's bound-parameter limit.
  const CHUNK_SIZE = 10
  const inserted: PostRow[] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    inserted.push(...(await db.insert(posts).values(chunk).returning()))
  }

  const post = inserted[0]
  if (!post) return c.json({ error: 'Failed to create post' }, 500)

  return c.json(
    {
      post: toPublicPost(post),
      ...(inserted.length > 1 ? { posts: inserted.map(toPublicPost) } : {}),
    },
    201
  )
})

// GET /api/posts/:id
postRoutes.get('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)

  return c.json({ post: toPublicPost(check.post) })
})

// PATCH /api/posts/:id — edit content (draft/scheduled/failed) and/or
// scheduledAt (draft/scheduled only; failed posts reschedule via /reschedule).
postRoutes.patch('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (!CONTENT_EDITABLE_STATUSES.has(post.status)) {
    return c.json({ error: `Cannot edit a ${post.status} post` }, 409)
  }

  const body = (
    await c.req
      .json<{ content?: unknown; scheduledAt?: unknown | null }>()
      .catch(() => null)
  ) ?? {}

  // Schedule changes go through POST /reschedule for failed posts.
  if (body.scheduledAt !== undefined && post.status === 'failed') {
    return c.json(
      { error: 'Use reschedule to move a failed post — only content is editable here' },
      409
    )
  }

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

// DELETE /api/posts/:id — remove the post from TelePost's database only.
// The published Telegram message is intentionally left untouched: deleting a
// record here never reaches the live channel. Publishing-in-flight is locked.
// `?scope=series` additionally deletes every not-yet-delivered sibling of a
// recurring series ("stop repeats") while keeping published history intact.
postRoutes.delete('/:id', async (c) => {
  const user = await requireAuth(c)
  const check = await ownedPostOrError(c, user, c.req.param('id'))
  if (!check.ok) return c.json({ error: check.error }, check.status)
  const { post } = check

  if (post.status === 'publishing') {
    return c.json({ error: 'Cannot delete a post while it is being published' }, 409)
  }

  const db = createDb(c.env.DB)

  let targets: PostRow[] = [post]
  const seriesId = post.seriesId
  if (c.req.query('scope') === 'series' && seriesId) {
    const siblings = await db
      .select()
      .from(posts)
      .where(and(eq(posts.userId, user.id), eq(posts.seriesId, seriesId)))
    targets = siblings.filter((row) => row.status !== 'publishing')
  }

  // Best-effort cleanup of any media blobs attached to these posts before the
  // rows go away (postMedia rows cascade-delete with them).
  const mediaRows =
    targets.length > 0
      ? await db
          .select()
          .from(postMedia)
          .where(inArray(postMedia.postId, targets.map((t) => t.id)))
      : []
  await Promise.allSettled(
    mediaRows.map((m) => c.env.MEDIA_BUCKET.delete(m.r2Key))
  )

  await db.delete(posts).where(inArray(posts.id, targets.map((t) => t.id)))

  return c.json({ success: true, deleted: targets.length })
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
