import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { telegramBots } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'
import { getMe } from '../lib/telegram'
import { encryptSecret } from '../lib/crypto'

export const botRoutes = new Hono<HonoEnv>()

const BOT_TOKEN_REGEX = /^\d{4,}:[A-Za-z0-9_-]{30,}$/
const TOKEN_KEY_VERSION = 1

// Shape a bot row for the API (never leak encryptedToken).
function toPublicBot(row: typeof telegramBots.$inferSelect) {
  return {
    id: row.id,
    telegramBotId: row.telegramBotId,
    username: row.username,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// GET /api/bots — list the authenticated user's connected bots.
botRoutes.get('/', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const bots = await db
    .select()
    .from(telegramBots)
    .where(eq(telegramBots.userId, user.id))
    .orderBy(telegramBots.createdAt)

  return c.json({ bots: bots.map(toPublicBot) })
})

// POST /api/bots — validate a token with Telegram getMe, encrypt it, store it.
botRoutes.post('/', async (c) => {
  const user = await requireAuth(c)
  const body = (await c.req.json<{ token?: unknown }>().catch(() => null)) ?? {}
  const token = typeof body.token === 'string' ? body.token.trim() : ''

  if (!BOT_TOKEN_REGEX.test(token)) {
    return c.json({ error: 'Invalid bot token format' }, 400)
  }

  // Confirm the token is real and owned by the caller.
  const me = await getMe(token)
  if (!me.ok || !me.result.is_bot) {
    const detail = me.ok ? 'Token does not belong to a bot' : (me.description ?? 'Unknown error')
    return c.json({ error: `Telegram rejected token: ${detail}` }, 400)
  }

  const db = createDb(c.env.DB)

  // Reject duplicates for this user.
  const existing = await db
    .select()
    .from(telegramBots)
    .where(
      and(
        eq(telegramBots.userId, user.id),
        eq(telegramBots.telegramBotId, me.result.id)
      )
    )
    .limit(1)

  if (existing[0]) {
    return c.json({ error: 'This bot is already connected' }, 409)
  }

  const username = me.result.username ?? `bot_${me.result.id}`
  const encryptedToken = await encryptSecret(c.env, token)

  const inserted = await db
    .insert(telegramBots)
    .values({
      userId: user.id,
      telegramBotId: me.result.id,
      username,
      encryptedToken,
      tokenKeyVersion: TOKEN_KEY_VERSION,
    })
    .returning()

  const bot = inserted[0]
  if (!bot) return c.json({ error: 'Failed to create bot' }, 500)

  return c.json({ bot: toPublicBot(bot) }, 201)
})

// DELETE /api/bots/:id — disconnect a bot (ownership required).
botRoutes.delete('/:id', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const id = c.req.param('id')
  const [bot] = await db
    .select()
    .from(telegramBots)
    .where(and(eq(telegramBots.id, id), eq(telegramBots.userId, user.id)))
    .limit(1)

  if (!bot) return c.json({ error: 'Bot not found' }, 404)

  await db.delete(telegramBots).where(eq(telegramBots.id, id))

  return c.json({ success: true })
})