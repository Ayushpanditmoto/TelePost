import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { createDb } from '../db'
import { telegramBots, telegramChannels } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'
import { decryptSecret } from '../lib/crypto'
import { getChat, getChatMember, sendMessage } from '../lib/telegram'
import { countUserChannels, getUserPlan } from '../lib/planLimits'

export const channelRoutes = new Hono<HonoEnv>()

// Channels (and supergroups) are supported; private chats/groups are not.
const ALLOWED_CHAT_TYPES = new Set(['channel', 'supergroup'])

function toPublicChannel(row: typeof telegramChannels.$inferSelect) {
  return {
    id: row.id,
    botId: row.botId,
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

// POST /api/channels — connect a channel via the user's bot.
// Body: { botId: string, chatId: string } (chatId can be @username or numeric id)
channelRoutes.post('/', async (c) => {
  const user = await requireAuth(c)
  const body = (await c.req.json<{ botId?: unknown; chatId?: unknown }>().catch(() => null)) ?? {}
  const botId = typeof body.botId === 'string' ? body.botId.trim() : ''
  const chatId = typeof body.chatId === 'string' ? body.chatId.trim() : ''

  if (!botId || !chatId) {
    return c.json({ error: 'botId and chatId are required' }, 400)
  }

  const db = createDb(c.env.DB)

  // The bot must belong to the authenticated user.
  const [bot] = await db
    .select()
    .from(telegramBots)
    .where(and(eq(telegramBots.id, botId), eq(telegramBots.userId, user.id)))
    .limit(1)
  if (!bot) return c.json({ error: 'Bot not found' }, 404)

  let token: string
  try {
    token = await decryptSecret(c.env, bot.encryptedToken)
  } catch {
    return c.json({ error: 'Failed to decrypt bot token' }, 500)
  }

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

  // The bot must be an administrator (or creator) to post.
  const memberRes = await getChatMember(token, String(chat.id), bot.telegramBotId)
  if (!memberRes.ok) {
    return c.json(
      { error: `Cannot verify bot membership: ${memberRes.description ?? 'Unknown error'}` },
      400
    )
  }
  const status = memberRes.result?.status
  if (status !== 'administrator' && status !== 'creator') {
    return c.json(
      { error: `Bot must be an administrator of this channel (current status: ${status})` },
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
      botId,
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

// POST /api/channels/:id/verify — send a test message via the bot.
channelRoutes.post('/:id/verify', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, c.req.param('id')), eq(telegramChannels.userId, user.id)))
    .limit(1)
  if (!channel) return c.json({ error: 'Channel not found' }, 404)

  const [bot] = await db
    .select()
    .from(telegramBots)
    .where(eq(telegramBots.id, channel.botId))
    .limit(1)
  if (!bot) return c.json({ error: 'Bot not found' }, 404)

  let token: string
  try {
    token = await decryptSecret(c.env, bot.encryptedToken)
  } catch {
    return c.json({ error: 'Failed to decrypt bot token' }, 500)
  }

  const res = await sendMessage(
    token,
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
