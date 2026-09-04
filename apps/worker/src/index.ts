import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { and, eq, lte } from 'drizzle-orm'
import { authRoutes } from './routes/auth'
import { webhookRoutes } from './routes/bot'
import { channelRoutes } from './routes/channels'
import { postRoutes } from './routes/posts'
import { mediaRoutes } from './routes/media'
import { devRoutes } from './routes/dev'
import { sessionMiddleware } from './lib/auth'
import { createDb } from './db'
import { posts } from '@telepost/db'
import { claimPostForPublish, type PublishClaim } from './lib/publish'
import { processPublishMessage } from './lib/publisher'
import type { Env } from './types'

// How long a 'publishing' claim may sit before the cron treats it as a dead
// attempt and reclaims it. A Telegram send completes in a few seconds; two
// minutes is generous headroom for slow media uploads on the free plan.
const STALE_PUBLISHING_MS = 2 * 60 * 1000

const app = new Hono<{ Bindings: Env }>()

// Origins allowed to call the API.
// CORS_ORIGINS (comma-separated) takes precedence; otherwise APP_URL.
// localhost is always allowed outside production.
function allowedOrigins(env: Env): string[] {
  const origins: string[] = []
  const raw = env.CORS_ORIGINS?.trim()
  if (raw) {
    for (const o of raw.split(',')) {
      const t = o.trim().replace(/\/$/, '')
      if (t) origins.push(t)
    }
  } else if (env.APP_URL) {
    origins.push(env.APP_URL.replace(/\/$/, ''))
  }
  if (env.ENVIRONMENT !== 'production') {
    origins.push('http://localhost:3000', 'http://127.0.0.1:3000')
  }
  return origins
}

// Middleware
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      const allowed = allowedOrigins(c.env)
      return origin && allowed.includes(origin) ? origin : null
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
)
// Populate c.get('user') from the session cookie for all API routes.
app.use('/api/*', sessionMiddleware())

// Health check
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.route('/api/auth', authRoutes)
app.route('/api/bot', webhookRoutes)
app.route('/api/channels', channelRoutes)
app.route('/api/posts', postRoutes)
app.route('/api/media', mediaRoutes)
app.route('/api/dev', devRoutes)

// Scheduled cron handler: find due posts and deliver them directly.
export default {
  fetch: app.fetch,

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const db = createDb(env.DB)
    const now = new Date().toISOString()

    // ─── Recovery: stale 'publishing' posts ──────────────────────────────────────
    // A delivery that died between claim (status → 'publishing') and its terminal
    // write (published/failed) used to strand the post forever. We now settle any
    // attempt that has been 'publishing' for more than STALE_PUBLISHING_MS into a
    // terminal, actionable 'failed' state (normal deliveries finish in seconds).
    // Marking it 'failed' — instead of auto-re-publishing — avoids a loop where a
    // persistently-broken send keeps bouncing publishing → scheduled → publishing,
    // which is exactly what made a stuck post look permanently stuck. The owner
    // can retry, edit, reschedule or cancel the post directly. The idempotency key
    // is kept, so a leftover half-finished attempt can never double-post on retry.
    const stale = await db
      .update(posts)
      .set({
        status: 'failed',
        updatedAt: now,
        errorMessage:
          'Publishing timed out — Telegram never confirmed the attempt. Review and retry.',
      })
      .where(
        and(
          eq(posts.status, 'publishing'),
          lte(
            posts.updatedAt,
            new Date(Date.now() - STALE_PUBLISHING_MS).toISOString()
          )
        )
      )
      .returning({ id: posts.id })

    if (stale.length > 0) {
      console.log(`[CRON] Recovered ${stale.length} stale 'publishing' post(s)`)
    }

    const due = await db
      .select()
      .from(posts)
      .where(and(eq(posts.status, 'scheduled'), lte(posts.scheduledAt, now)))
      .limit(25)

    let dispatched = 0
    for (const post of due) {
      const claimed: PublishClaim | null = await claimPostForPublish(env, post.id)
      if (!claimed) continue
      dispatched++
      // Free plan: no Queues — run delivery within the cron invocation.
      ctx.waitUntil(
        processPublishMessage(env, claimed).catch((err) => {
          // Don't swallow silently: log so a stranded delivery is visible in
          // worker logs (the stale-'publishing' recovery above heals it next run).
          console.error(`[CRON] Delivery failed for post ${claimed.postId}:`, err)
        })
      )
    }

    console.log(`[CRON] ${dispatched}/${due.length} due posts dispatched`)
  },
}
