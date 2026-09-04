import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { users, authNonces } from '@telepost/db'
import type { HonoEnv } from '../types'
import {
  createSession,
  destroySession,
  getSessionUser,
  findOrCreateUser,
  consumeNonce,
  SESSION_COOKIE,
  cookieBase,
} from '../lib/auth'
import { parseCookies, serializeCookie } from '../lib/cookies'

export const authRoutes = new Hono<HonoEnv>()

// POST /api/auth/telegram/start
// Create a one-time login nonce and return the bot deep-link the frontend opens
// so the user clicks "Start" in Telegram. Avoids the phone-number prompt.
authRoutes.post('/telegram/start', async (c) => {
  const nonceId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 1000 * 60 * 10).toISOString() // 10 min
  const db = createDb(c.env.DB)
  await db.insert(authNonces).values({ id: nonceId, expiresAt })

  const { getMe } = await import('../lib/telegram')
  const me = await getMe(c.env.TELEGRAM_BOT_TOKEN)
  const botUsername = me.ok ? me.result.username : 'Panditfxbot'

  const startLink = `https://t.me/${botUsername}?start=login_${nonceId}`

  return c.json({ startLink, nonceId })
})

// GET /api/auth/telegram/start/status?nonce_id=xxx
// Polls: 202 pending / 200 complete / 404 expired.
authRoutes.get('/telegram/start/status', async (c) => {
  const nonceId = c.req.query('nonce_id')
  if (!nonceId) return c.json({ error: 'nonce_id required' }, 400)

  const db = createDb(c.env.DB)
  const row = await db
    .select()
    .from(authNonces)
    .where(eq(authNonces.id, nonceId))
    .limit(1)
    .then((r) => r[0])

  if (!row) return c.json({ status: 'expired' }, 404)
  if (!row.sessionId || !row.userId) return c.json({ status: 'pending' }, 202)

  // The bot already issued a session in /start. Hand that session id to the
  // browser as its cookie so the web app is now logged in.
  c.header(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, row.sessionId, cookieBase(c.env))
  )

  return c.json({ status: 'complete', user: { id: row.userId } })
})

// GET /api/auth/me — the authenticated user, or 401 when logged out.
authRoutes.get('/me', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)

  return c.json({ user })
})

// POST /api/auth/dev — local-development-only login (refuses in production).
authRoutes.post('/dev', async (c) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'Not found' }, 404)
  }

  const body = (
    await c.req
      .json<{ username?: unknown; displayName?: unknown; telegramId?: unknown }>()
      .catch(() => null)
  ) ?? {}

  const telegramId =
    typeof body.telegramId === 'number' && Number.isSafeInteger(body.telegramId) && body.telegramId > 0
      ? body.telegramId
      : 42424242
  const username = typeof body.username === 'string' && body.username.trim() ? body.username.trim().replace(/^@/, '') : 'devuser'
  const displayName = typeof body.displayName === 'string' && body.displayName.trim() ? body.displayName.trim() : 'Dev User'

  const db = createDb(c.env.DB)
  const existing = await db.select().from(users).where(eq(users.telegramId, telegramId)).limit(1)

  let row = existing[0]
  if (!row) {
    const inserted = await db
      .insert(users)
      .values({ telegramId, telegramUsername: username, displayName })
      .returning()
    row = inserted[0]
  }
  if (!row) return c.json({ error: 'Failed to create dev user' }, 500)

  await createSession(c, row.id)

  return c.json({
    user: {
      id: row.id,
      telegramId: row.telegramId,
      username: row.telegramUsername,
      displayName: row.displayName,
    },
  })
})

// POST /api/auth/logout — destroy the session and clear the cookie.
authRoutes.post('/logout', async (c) => {
  const sessionId = parseCookies(c.req.header('Cookie'))[SESSION_COOKIE] ?? null
  await destroySession(c, sessionId)
  return c.json({ success: true })
})