import { Hono } from 'hono'
import type { Context } from 'hono'
import { and, eq } from 'drizzle-orm'
import { createDb, type Db } from '../db'
import { telegramChannels } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'
import {
  getChat,
  getChatMember,
  getChatMemberCount,
  sendMessage,
} from '../lib/telegram'
import { storeChannelPhoto } from '../lib/media'

// Platform bot that publishes for all users (from TELEGRAM_BOT_TOKEN env).
const PLATFORM_BOT_ID = 8985221169

// Member counts are refreshed from the Bot API at most this often.
const MEMBER_COUNT_TTL_MS = 60 * 60 * 1000

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
    hasPhoto: Boolean(row.photoKey),
    memberCount: row.memberCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// Refresh one channel's cached member count when older than the TTL. Marks
// the attempt time even on failure so a broken chat is retried hourly, not
// on every request. Returns the fresh count, or the previous one.
async function refreshMemberCount(
  c: Context<HonoEnv>,
  db: Db,
  channel: typeof telegramChannels.$inferSelect
): Promise<number | null> {
  const updatedAt = new Date().toISOString()
  const res = await getChatMemberCount(c.env.TELEGRAM_BOT_TOKEN, channel.telegramChatId)
  const memberCount =
    res.ok && typeof res.result === 'number' ? res.result : channel.memberCount

  await db
    .update(telegramChannels)
    .set({ memberCount, memberCountUpdatedAt: updatedAt })
    .where(eq(telegramChannels.id, channel.id))
  channel.memberCount = memberCount
  channel.memberCountUpdatedAt = updatedAt
  return memberCount
}

// GET /api/channels — list the authenticated user's channels. Member counts
// are refreshed from Telegram when their cache is older than an hour.
channelRoutes.get('/', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const channels = await db
    .select()
    .from(telegramChannels)
    .where(eq(telegramChannels.userId, user.id))
    .orderBy(telegramChannels.createdAt)

  const now = Date.now()
  for (const channel of channels) {
    const age = channel.memberCountUpdatedAt
      ? now - new Date(channel.memberCountUpdatedAt).getTime()
      : Number.POSITIVE_INFINITY
    if (age < MEMBER_COUNT_TTL_MS) continue
    await refreshMemberCount(c, db, channel)
  }

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

  // Current member count (bot is admin, so getChatMemberCount is allowed).
  const memberCountRes = await getChatMemberCount(c.env.TELEGRAM_BOT_TOKEN, telegramChatId)
  const memberCount =
    memberCountRes.ok && typeof memberCountRes.result === 'number'
      ? memberCountRes.result
      : null

  const inserted = await db
    .insert(telegramChannels)
    .values({
      userId: user.id,
      telegramBotId: PLATFORM_BOT_ID,
      telegramChatId,
      username: chat.username ?? null,
      title: chat.title ?? chatId,
      verified: false,
      memberCount,
      memberCountUpdatedAt:
        memberCount != null ? new Date().toISOString() : null,
    })
    .returning()

  let channel = inserted[0]
  if (!channel) return c.json({ error: 'Failed to connect channel' }, 500)

  // Cache the chat's profile photo (getChat already returned it) so the
  // sidebar can render the real avatar instead of a letter tile.
  const photoKey = await storeChannelPhoto(c.env, chat.photo, channel.id)
  if (photoKey) {
    const [updated] = await db
      .update(telegramChannels)
      .set({ photoKey, updatedAt: new Date().toISOString() })
      .where(eq(telegramChannels.id, channel.id))
      .returning()
    if (updated) channel = updated
  }

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

  // Best-effort cleanup of the cached avatar blob.
  if (channel.photoKey) {
    await c.env.MEDIA_BUCKET.delete(channel.photoKey).catch(() => undefined)
  }

  await db.delete(telegramChannels).where(eq(telegramChannels.id, channel.id))

  return c.json({ success: true })
})

// GET /api/channels/:id/photo — the chat's profile photo (avatar).
// Streams the cached R2 object; rows connected before photos were stored are
// fetched from the Bot API lazily (once) and then cached.
channelRoutes.get('/:id/photo', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const [channel] = await db
    .select()
    .from(telegramChannels)
    .where(and(eq(telegramChannels.id, c.req.param('id')), eq(telegramChannels.userId, user.id)))
    .limit(1)
  if (!channel) return c.json({ error: 'Channel not found' }, 404)

  let photoKey = channel.photoKey
  if (!photoKey) {
    const chatRes = await getChat(c.env.TELEGRAM_BOT_TOKEN, channel.telegramChatId)
    if (chatRes.ok) {
      photoKey = await storeChannelPhoto(c.env, chatRes.result.photo, channel.id)
      if (photoKey) {
        await db
          .update(telegramChannels)
          .set({ photoKey, updatedAt: new Date().toISOString() })
          .where(eq(telegramChannels.id, channel.id))
      }
    }
  }
  if (!photoKey) return c.json({ error: 'Channel has no profile photo' }, 404)

  const obj = await c.env.MEDIA_BUCKET.get(photoKey)
  if (!obj) return c.json({ error: 'Photo missing from storage' }, 404)

  return new Response(obj.body as unknown as ReadableStream, {
    status: 200,
    headers: {
      'Content-Type': obj.httpMetadata?.contentType ?? 'image/jpeg',
      'Cache-Control': 'private, max-age=86400',
    },
  })
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
