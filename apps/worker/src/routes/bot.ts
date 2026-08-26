import { Hono, type Context } from 'hono'
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { authNonces, sessions, telegramChannels, users } from '@telepost/db'
import type { HonoEnv } from '../types'
import { findOrCreateUser, consumeNonce } from '../lib/auth'
import { callTelegram, getChatMember } from '../lib/telegram'
import { countUserChannels, getUserPlan } from '../lib/planLimits'

// Platform bot that publishes for all users (matches channels.ts / schema).
const PLATFORM_BOT_ID = 8985221169

export const webhookRoutes = new Hono<HonoEnv>()

interface ForwardedChat {
  id: number
  title?: string
  username?: string
  type?: string
}

interface WebhookMessage {
  from?: {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
  }
  text?: string
  chat?: { id: number }
  // Bot API 7.x style
  forward_origin?: {
    type?: string
    chat?: ForwardedChat
  }
  // Legacy field still sent by some clients
  forward_from_chat?: ForwardedChat
}

// Source channel when a user forwards a message from it (private-channel flow).
function forwardedChat(msg: WebhookMessage): ForwardedChat | null {
  const origin = msg.forward_origin
  if (origin?.type === 'channel' && origin.chat?.id) return origin.chat
  if (msg.forward_from_chat?.id) return msg.forward_from_chat
  return null
}

async function reply(token: string, chatId: number, text: string) {
  await callTelegram(token, 'sendMessage', { chat_id: chatId, text })
}

// POST /api/bot  — Telegram webhook
// Handles /start login_<nonceId>: creates the user, issues a session, consumes
// the nonce, and DMs a confirmation. Other messages get a helpful reply.
// (Mounted at app.route('/api/bot', ...), so the handler lives on '/'.)
webhookRoutes.post('/', async (c) => {
  const secret = c.req.header('x-telegram-bot-api-secret-token')
  if (!secret || secret !== c.env.TELEGRAM_WEBHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const body = await c.req
    .json<{ message?: WebhookMessage; update_id: number }>()
    .catch(() => null)
  if (!body) return c.json({ ok: true })

  const msg = body.message
  if (!msg?.from?.id) return c.json({ ok: true })

  const from = msg.from
  const displayName =
    [from.first_name, from.last_name].filter(Boolean).join(' ') ||
    from.username ||
    'Telegram User'
  const avatarUrl = from.photo_url || null

  // ─── Flow 1: /start login_<nonce> — web login ───────────────────────────────
  const match = msg.text?.match(/^\/start\s+login_([0-9a-fA-F-]+)$/)
  if (match) {
    return handleLogin(c, match[1]!, from.id, displayName, avatarUrl)
  }

  // ─── Flow 2: forwarded message — connect a private channel ─────────────────
  const src = forwardedChat(msg)
  if (src) {
    return handleForwardedChannel(c, from.id, src)
  }

  // Anything else: helpful hint.
  await reply(
    c.env.TELEGRAM_BOT_TOKEN,
    msg.chat?.id ?? from.id,
    [
      '👋 Hi! This bot powers TelePost.',
      '',
      '• To log in: click “Log in with Telegram” on the website.',
      '• To connect a channel: add me as an admin there, then forward me any post from it (works for private channels too).',
    ].join('\n'),
  )
  return c.json({ ok: true })
})

// ─── /start login_<nonce> ─────────────────────────────────────────────────────
async function handleLogin(
  c: Context<HonoEnv>,
  nonceId: string,
  telegramId: number,
  displayName: string,
  avatarUrl: string | null,
): Promise<Response> {
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
  const user = await findOrCreateUser(db, telegramId, null, displayName, avatarUrl)
  await db.insert(sessions).values({ id: sessionId, userId: user.id, expiresAt: sessionExpiresAt })
  await consumeNonce(db, nonceId, { sessionId, userId: user.id })

  await reply(
    c.env.TELEGRAM_BOT_TOKEN,
    telegramId,
    '✅ You are logged in to TelePost. You can close this chat.',
  )
  return c.json({ ok: true })
}

// ─── Forwarded message → connect the source channel ──────────────────────────
async function handleForwardedChannel(
  c: Context<HonoEnv>,
  senderTelegramId: number,
  src: ForwardedChat,
): Promise<Response> {
  const db = createDb(c.env.DB)
  const token = c.env.TELEGRAM_BOT_TOKEN

  // The forwarder must already have a TelePost account (via website login).
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.telegramId, senderTelegramId))
    .limit(1)

  if (!user) {
    await reply(
      token,
      senderTelegramId,
      'Please log in on the TelePost website first, then forward a post here to connect your channel.',
    )
    return c.json({ ok: true })
  }

  // Only channels/supergroups can be scheduled to.
  const chatType = src.type ?? 'channel'
  if (chatType !== 'channel' && chatType !== 'supergroup') {
    await reply(token, senderTelegramId, 'That is not a channel — forward a post from a channel or supergroup.')
    return c.json({ ok: true })
  }

  // The platform bot must be an admin there.
  const member = await getChatMember(token, String(src.id), PLATFORM_BOT_ID)
  const status = member.ok ? member.result?.status : undefined
  if (status !== 'administrator' && status !== 'creator') {
    await reply(
      token,
      senderTelegramId,
      `Add @Panditfxbot as an administrator of “${src.title ?? 'this chat'}” first, then forward a post again.`,
    )
    return c.json({ ok: true })
  }

  const telegramChatId = String(src.id)

  // Already connected?
  const [dupe] = await db
    .select()
    .from(telegramChannels)
    .where(
      and(
        eq(telegramChannels.userId, user.id),
        eq(telegramChannels.telegramChatId, telegramChatId),
      ),
    )
    .limit(1)
  if (dupe) {
    await reply(
      token,
      senderTelegramId,
      `✅ “${dupe.title}” is already connected to your TelePost account.`,
    )
    return c.json({ ok: true })
  }

  // Plan limit.
  const plan = await getUserPlan(db, user.id)
  if (plan) {
    const used = await countUserChannels(db, user.id)
    if (used >= plan.maxChannels) {
      await reply(
        token,
        senderTelegramId,
        `Your plan allows ${plan.maxChannels} channel(s). Disconnect one first or upgrade to add more.`,
      )
      return c.json({ ok: true })
    }
  }

  await db.insert(telegramChannels).values({
    userId: user.id,
    telegramBotId: PLATFORM_BOT_ID,
    telegramChatId,
    username: src.username ?? null,
    title: src.title ?? telegramChatId,
    verified: false,
  })

  const shownName = src.title ?? (src.username ? `@${src.username}` : telegramChatId)
  await reply(
    token,
    senderTelegramId,
    `🎉 Connected “${shownName}”!\n\nOpen telegrampost.vercel.app/dashboard and start scheduling.`,
  )
  return c.json({ ok: true })
}
