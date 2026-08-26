import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { telegramChannels } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'
import { getChat, getChatMember, sendMessage } from '../lib/telegram'
import { countUserChannels, getUserPlan } from '../lib/planLimits'

// Platform bot that publishes for all users (from TELEGRAM_BOT_TOKEN env).
const PLATFORM_BOT_ID = 8985221169

export const channelRoutes = new Hono<HonoEnv>()

// Channels (and supergroups) are supported; private chats/groups are not.
const ALLOWED_CHAT_TYPES = new Set(['channel', 'supergroup'])

function toPublicChannel(row: typeof telegramChannels.$inferSelect) {
  return {
    id: row.id,
    telegramBotId: row.telegramBotId,
    telegramChatId: row.telegramChatId,
    username: row.username,
    title: row.title,
    verified: row.verified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// GET /api/channels — list the authenticated user's channels.
channelRoutes.get('/', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const channels = await db
    .select()
    .from(telegramChannels)
    .where(eq(telegramChannels.userId, user.id))
    .orderBy(telegramChannels.createdAt)

  return c.json({ channels: channels.map(toPublicChannel) })
})

// POST /api/channels — connect a channel by adding @Panditfxbot as admin.
// Body: { chatId: string } (@username or numeric id)
channelRoutes.post('/', async (c) => {
  const user = await requireAuth(c)
  const body = (await c.req.json<{ chatId?: unknown }>().catch(() => null)) ?? {}
  const chatId = typeof body.chatId === 'string' ? body.chatId.trim().replace(/^@/, '') : ''

  if (!chatId) {
    return c.json({ error: 'chatId is required' }, 400)
  }

  const db = createDb(c.env.DB)
  const token = c.env.TELEGRAM_BOT_TOKEN

  // Resolve the chat so we store the canonical id/title/username.
  const chatRes = await getChat(token, chatId)
  if (!chatRes.ok) {
    return c.json(
      { error: `Telegram rejected chat: ${chatRes.description ?? 'Not found'}` },
      400
    )
  }
  const chat = chatRes.result

  if (!ALLOWED_CHAT_TYPES.has(chat.type)) {
    return c.json(
      { error: `Unsupported chat type "${chat.type}" — must be a channel or supergroup` },
      400
    )
  }

  // @Panditfxbot must be an admin (or creator) to post.
  const memberRes = await getChatMember(token, String(chat.id), PLATFORM_BOT_ID)
  if (!memberRes.ok) {
    return c.json(
      { error: `Cannot verify bot membership: ${memberRes.description ?? 'Unknown error'}` },
      400
    )
  }
  const status = memberRes.result?.status
  if (status !== 'administrator' && status !== 'creator') {
    return c.json(
      { error: `@Panditfxbot must be an administrator of this channel (current status: ${status}). Add the bot as admin first.` },
      403
    )
  }

  const telegramChatId = String(chat.id)

  // Reject duplicates for this user.
  const duplicate = await db
    .select()
    .from(telegramChannels)
    .where(
      and(
        eq(telegramChannels.userId, user.id),
        eq(telegramChannels.telegramChatId, telegramChatId)
      )
    )
    .limit(1)
  if (duplicate[0]) {
    return c.json({ error: 'This channel is already connected' }, 409)
  }

  // Enforce plan limit.
  const plan = await getUserPlan(db, user.id)
  if (plan) {
    const existing = await countUserChannels(db, user.id)
    if (existing >= plan.maxChannels) {
      return c.json(
        { error: `Plan limit reached (${plan.maxChannels} channels). Upgrade to connect more.` },
        403
      )
    }
  }

  const inserted = await db
    .insert(telegramChannels)
    .values({
      userId: user.id,
      telegramBotId: PLATFORM_BOT_ID,
      telegramChatId,
      username: chat.username ?? null,
      title: chat.title ?? chatId,
      verified: false,
    })
    .returning()

  const channel = inserted[0]
  if (!channel) return c.json({ error: 'Failed to connect channel' }, 500)

  return c.json({ channel: toPublicChannel(channel) }, 201)
})

// GET /api/channels/:id
channelRoutes.get('/:id', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, c.req.param('id')), eq(telegramChannels.userId, user.id)))
    .limit(1)

  if (!channel) return c.json({ error: 'Channel not found' }, 404)
  return c.json({ channel: toPublicChannel(channel) })
})

// DELETE /api/channels/:id
channelRoutes.delete('/:id', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, c.req.param('id')), eq(telegramChannels.userId, user.id)))
    .limit(1)

  if (!channel) return c.json({ error: 'Channel not found' }, 404)

  await db.delete(telegramChannels).where(eq(telegramChannels.id, channel.id))

  return c.json({ success: true })
})

// POST /api/channels/:id/verify — send a test message via the platform bot.
channelRoutes.post('/:id/verify', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, c.req.param('id')), eq(telegramChannels.userId, user.id)))
    .limit(1)
  if (!channel) return c.json({ error: 'Channel not found' }, 404)

  const res = await sendMessage(
    c.env.TELEGRAM_BOT_TOKEN,
    channel.telegramChatId,
    '✅ This channel is connected to TelePost and ready for scheduled posts!'
  )
  if (!res.ok) {
    return c.json({ error: `Test message failed: ${res.description ?? 'Unknown error'}` }, 400)
  }

  const [updated] = await db
    .update(telegramChannels)
    .set({ verified: true, updatedAt: new Date().toISOString() })
    .where(eq(telegramChannels.id, channel.id))
    .returning()

  return c.json({ channel: updated ? toPublicChannel(updated) : toPublicChannel(channel) })
})
