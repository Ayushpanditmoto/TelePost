import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { createDb } from '../db'
import { authNonces, sessions } from '@telepost/db'
import type { HonoEnv } from '../types'
import { findOrCreateUser, consumeNonce } from '../lib/auth'
import { callTelegram } from '../lib/telegram'

export const webhookRoutes = new Hono<HonoEnv>()

// POST /api/bot  — Telegram webhook
// Handles /start login_<nonceId>: creates the user, issues a session, consumes
// the nonce, and DMs a confirmation. Other messages get a helpful reply.
// (Mounted at app.route('/api/bot', ...), so the handler lives on '/'.)
webhookRoutes.post('/', async (c) => {
  const secret = c.req.header('x-telegram-bot-api-secret-token')
  if (!secret || secret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req.json<{
    message?: {
      from?: {
        id: number
        first_name: string
        last_name?: string
        username?: string
        photo_url?: string
      }
      text?: string
      chat?: { id: number }
    }
    update_id: number
  }>().catch(() => null)
  if (!body) return c.json({ ok: true })

  const msg = body.message
  if (!msg?.from?.id || !msg.text) return c.json({ ok: true })

  const from = msg.from
  const displayName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || 'Telegram User'
  const avatarUrl = from.photo_url || null

  const match = msg.text.match(/^\/start\s+login_([0-9a-fA-F-]+)$/)
  if (!match) {
    const chatId = msg.chat?.id ?? from.id
    await callTelegram(c.env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
      chat_id: chatId,
      text: 'Send /start login from the TelePost website to log in.',
    })
    return c.json({ ok: true })
  }

  const nonceId = match[1]!
  const db = createDb(c.env.DB)

  const nonce = await db
    .select()
    .from(authNonces)
    .where(eq(authNonces.id, nonceId))
    .limit(1)
    .then((r) => r[0])

  if (!nonce || nonce.consumedAt) return c.json({ ok: true })
  if (new Date(nonce.expiresAt).getTime() < Date.now()) return c.json({ ok: true })

  const sessionId = crypto.randomUUID()
  const sessionExpiresAt = new Date(Date.now() + 60 * 60 * 24 * 30 * 1000).toISOString()

  // Create/update the user, then the session, then mark the nonce consumed.
  const user = await findOrCreateUser(db, from.id, from.username ?? null, displayName, avatarUrl)
  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt: sessionExpiresAt })
  await consumeNonce(db, nonceId, { sessionId, userId: user.id })

  await callTelegram(c.env.TELEGRAM_BOT_TOKEN, 'sendMessage', {
    chat_id: from.id,
    text: '✅ You are logged in to TelePost. You can close this chat.',
  })

  return c.json({ ok: true })
})
