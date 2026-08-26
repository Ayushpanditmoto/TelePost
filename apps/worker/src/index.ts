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
import { enqueuePostForPublish, type PublishQueueMessage } from './lib/publish'
import { processPublishMessage } from './lib/publisher'
import type { Env } from './types'

const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', logger())
app.use(
  '/api/*',
  cors({
    origin: ['http://localhost:3000', 'https://telepost.app'],
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

// Scheduled cron handler: find due posts and enqueue them for publishing.
export default {
  fetch: app.fetch,

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    const db = createDb(env.DB)
    const now = new Date().toISOString()

    const due = await db
      .select()
      .from(posts)
      .where(and(eq(posts.status, 'scheduled'), lte(posts.scheduledAt, now)))
      .limit(25)

    let queued = 0
    for (const post of due) {
      const key = await enqueuePostForPublish(env, post.id)
      if (key) queued++
    }

    console.log(`[CRON] ${queued}/${due.length} due posts enqueued`)
  },

  async queue(
    batch: MessageBatch<unknown>,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log(`[QUEUE] Processing ${batch.messages.length} messages`)

    for (const message of batch.messages) {
      const body = message.body as PublishQueueMessage

      // Defensive shape check — skip malformed payloads rather than crash-looping.
      if (typeof body?.postId !== 'string' || typeof body?.idempotencyKey !== 'string') {
        console.error('[QUEUE] Malformed message, acking:', JSON.stringify(body))
        message.ack()
        continue
      }

      try {
        const disposition = await processPublishMessage(env, body)
        console.log(`[QUEUE] ${body.postId}: ${disposition}`)
        message.ack()
      } catch (err) {
        // Unexpected error — let the queue retry the message itself.
        console.error(`[QUEUE] Unexpected failure for ${body.postId}:`, err)
        message.retry({ delaySeconds: 30 })
      }
    }
  },
}
