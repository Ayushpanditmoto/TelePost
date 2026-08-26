import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authRoutes } from './routes/auth'
import { botRoutes } from './routes/bots'
import { channelRoutes } from './routes/channels'
import { postRoutes } from './routes/posts'
import { planRoutes } from './routes/plans'
import { adminRoutes } from './routes/admin'
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

// Scheduled cron handler
export default {
  fetch: app.fetch,

  async scheduled(
    _event: ScheduledEvent,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log('[CRON] Checking for due posts...')
    // TODO Phase 7: query D1 for scheduled posts, enqueue them
  },

  async queue(
    batch: MessageBatch<unknown>,
    env: Env,
    _ctx: ExecutionContext
  ): Promise<void> {
    console.log(`[QUEUE] Processing ${batch.messages.length} messages`)
    // TODO Phase 7: decrypt token, call Telegram API, update post status
  },
}
