import {
  sqliteTable,
  text,
  integer,
  uniqueIndex,
  index,
} from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ─── Helpers ────────────────────────────────────────────────────────────────

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
}

// ─── Users ───────────────────────────────────────────────────────────────────

export const users = sqliteTable(
  'users',
  {
    id: id(),
    telegramId: integer('telegram_id').notNull().unique(),
    telegramUsername: text('telegram_username'),
    displayName: text('display_name').notNull(),
    avatarUrl: text('avatar_url'),
    ...timestamps,
  },
  (t) => ({
    telegramIdIdx: uniqueIndex('users_telegram_id_idx').on(t.telegramId),
  })
)

// ─── Telegram Bots ───────────────────────────────────────────────────────────
// Kept for reference; TelePost now publishes through the platform's own bot
// (@Panditfxbot, from TELEGRAM_BOT_TOKEN env) so users never create their own.
// This table is no longer used by the channel/publish flows.

export const telegramBots = sqliteTable(
  'telegram_bots',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    telegramBotId: integer('telegram_bot_id').notNull(),
    username: text('username').notNull(),
    encryptedToken: text('encrypted_token').notNull(),
    tokenKeyVersion: integer('token_key_version').notNull().default(1),
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index('bots_user_id_idx').on(t.userId),
  })
)

// ─── Telegram Channels ───────────────────────────────────────────────────────

export const telegramChannels = sqliteTable(
  'telegram_channels',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // ID of the platform's own bot (@Panditfxbot). Stored for display/audit;
    // the actual token always comes from TELEGRAM_BOT_TOKEN at publish time.
    telegramBotId: integer('telegram_bot_id').notNull(),
    telegramChatId: text('telegram_chat_id').notNull(),
    username: text('username'),
    title: text('title').notNull(),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    // R2 key of the chat's profile photo (Bot API getChat → photo), cached at
    // connect time or lazily by GET /api/channels/:id/photo.
    photoKey: text('photo_key'),
    // Cached Telegram member count, refreshed at most hourly by the channels
    // list endpoint (getChatMemberCount; bot must be admin — it always is).
    memberCount: integer('member_count'),
    memberCountUpdatedAt: text('member_count_updated_at'),
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index('channels_user_id_idx').on(t.userId),
  })
)

// ─── Posts ───────────────────────────────────────────────────────────────────

export const posts = sqliteTable(
  'posts',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    channelId: text('channel_id')
      .notNull()
      .references(() => telegramChannels.id, { onDelete: 'cascade' }),
    content: text('content').notNull(),
    status: text('status', {
      enum: ['draft', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'],
    })
      .notNull()
      .default('draft'),
    scheduledAt: text('scheduled_at'),
    publishedAt: text('published_at'),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),
    idempotencyKey: text('idempotency_key').unique(),
    telegramMessageId: integer('telegram_message_id'),
    // Recurring series: upcoming occurrences of a repeating schedule share this id.
    seriesId: text('series_id'),
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index('posts_user_id_idx').on(t.userId),
    channelIdIdx: index('posts_channel_id_idx').on(t.channelId),
    statusIdx: index('posts_status_idx').on(t.status),
    scheduledAtIdx: index('posts_scheduled_at_idx').on(t.scheduledAt),
    seriesIdIdx: index('posts_series_id_idx').on(t.seriesId),
  })
)

// ─── Post Media ──────────────────────────────────────────────────────────────

export const postMedia = sqliteTable(
  'post_media',
  {
    id: id(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    r2Key: text('r2_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    postIdIdx: index('post_media_post_id_idx').on(t.postId),
  })
)

// ─── Post Analytics ──────────────────────────────────────────────────────────

export const postAnalytics = sqliteTable(
  'post_analytics',
  {
    id: id(),
    postId: text('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    views: integer('views').notNull().default(0),
    forwards: integer('forwards').notNull().default(0),
    reactions: integer('reactions').notNull().default(0),
    replies: integer('replies').notNull().default(0),
    measuredAt: text('measured_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    postIdIdx: index('analytics_post_id_idx').on(t.postId),
  })
)

// ─── Sessions ────────────────────────────────────────────────────────────────

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').notNull().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    expiresAt: text('expires_at').notNull(),
  },
    (t) => ({
    userIdIdx: index('sessions_user_id_idx').on(t.userId),
    expiresAtIdx: index('sessions_expires_at_idx').on(t.expiresAt),
  })
)

// ─── Login nonces (Telegram "Start" login flow) ──────────────────────────────

export const authNonces = sqliteTable(
  'auth_nonces',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text('session_id'), // populated once the bot sees /start
    userId: text('user_id'),
    consumedAt: text('consumed_at'),
    expiresAt: text('expires_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    expiresAtIdx: index('auth_nonces_expires_at_idx').on(t.expiresAt),
  })
)

// ─── Type Exports ────────────────────────────────────────────────────────────

export type Session = typeof sessions.$inferSelect
export type AuthNonce = typeof authNonces.$inferSelect
export type User = typeof users.$inferSelect
export type TelegramBot = typeof telegramBots.$inferSelect
export type TelegramChannel = typeof telegramChannels.$inferSelect
export type Post = typeof posts.$inferSelect
export type PostMedia = typeof postMedia.$inferSelect
export type PostAnalytics = typeof postAnalytics.$inferSelect
