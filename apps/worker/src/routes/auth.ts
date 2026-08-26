import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { users } from '@telepost/db'
import type { HonoEnv } from '../types'
import { verifyTelegramAuth } from '../lib/telegramAuth'
import {
  SESSION_COOKIE,
  createSession,
  destroySession,
  getSessionUser,
} from '../lib/auth'
import { parseCookies } from '../lib/cookies'

export const authRoutes = new Hono<HonoEnv>()

// POST /api/auth/telegram
// Verify the Telegram Login Widget payload, create/find the user, and issue a
// session cookie. Body may be JSON or application/x-www-form-urlencoded.
authRoutes.post('/telegram', async (c) => {
  let fields: Record<string, unknown>
  const contentType = c.req.header('Content-Type') ?? ''

  if (contentType.includes('application/x-www-form-urlencoded')) {
    fields = await c.req
      .parseBody()
      .then((r) =>
        Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v as unknown]))
      )
      .catch(() => ({}))
  } else {
    fields = (await c.req.json<Record<string, unknown>>().catch(() => null)) ?? {}
  }

  const verified = await verifyTelegramAuth(fields, c.env.TELEGRAM_BOT_TOKEN)
  if (!verified.ok) {
    return c.json({ error: verified.error }, 401)
  }

  const v = verified.user
  const db = createDb(c.env.DB)

  const existing = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, v.telegramId))
    .limit(1)

  let row = existing[0]
  if (row) {
    const updated = await db
      .update(users)
      .set({
        telegramUsername: v.username ?? row.telegramUsername,
        displayName: v.displayName,
        avatarUrl: v.avatarUrl ?? row.avatarUrl,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, row.id))
      .returning()
    row = updated[0] ?? row
  } else {
    const inserted = await db
      .insert(users)
      .values({
        telegramId: v.telegramId,
        telegramUsername: v.username,
        displayName: v.displayName,
        avatarUrl: v.avatarUrl,
      })
      .returning()
    row = inserted[0]
  }

  if (!row) return c.json({ error: 'Failed to create user' }, 500)

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

// GET /api/auth/me — return the authenticated user, if any.
authRoutes.get('/me', async (c) => {
  const user = await getSessionUser(c)
  if (!user) return c.json({ error: 'Unauthorized' }, 401)
  return c.json({ user })
})

// POST /api/auth/logout — destroy the session and clear the cookie.
authRoutes.post('/logout', async (c) => {
  const sessionId = parseCookies(c.req.header('Cookie'))[SESSION_COOKIE] ?? null
  await destroySession(c, sessionId)
  return c.json({ success: true })
})