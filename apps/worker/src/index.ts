import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { and, eq, lte } from 'drizzle-orm'
import { authRoutes } from './routes/auth'
import { botRoutes } from './routes/bots'
import { channelRoutes } from './routes/channels'
import { postRoutes } from './routes/posts'
import { planRoutes } from './routes/plans'
import { adminRoutes } from './routes/admin'
import { sessionMiddleware } from './lib/auth'
import { createDb } from './db'
import { posts } from '@telepost/db'
import { claimPostForPublish, type PublishClaim } from './lib/publish'
import { processPublishMessage } from './lib/publisher'
import type { Env } from './types'

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
app.route('/api/bots', botRoutes)
app.route('/api/channels', channelRoutes)
app.route('/api/posts', postRoutes)
app.route('/api/plans', planRoutes)
app.route('/api/admin', adminRoutes)

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
      ctx.waitUntil(processPublishMessage(env, claimed).catch(() => undefined))
    }

    console.log(`[CRON] ${dispatched}/${due.length} due posts dispatched`)
  },
}
