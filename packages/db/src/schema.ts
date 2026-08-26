import {
  sqliteTable,
  text,
  integer,
  real,
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

// ─── Plans ───────────────────────────────────────────────────────────────────

export const plans = sqliteTable('plans', {
  id: id(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  price: real('price').notNull(),
  currency: text('currency').notNull().default('USD'),
  maxChannels: integer('max_channels').notNull(),
  maxScheduledPosts: integer('max_scheduled_posts').notNull(),
  maxMediaMb: integer('max_media_mb').notNull().default(0),
  allowRecurring: integer('allow_recurring', { mode: 'boolean' })
    .notNull()
    .default(false),
  features: text('features', { mode: 'json' }).$type<string[]>().notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// ─── Subscriptions ───────────────────────────────────────────────────────────

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    status: text('status', {
      enum: ['active', 'expired', 'cancelled', 'pending'],
    })
      .notNull()
      .default('pending'),
    startedAt: text('started_at'),
    expiresAt: text('expires_at'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (t) => ({
    userIdIdx: index('subscriptions_user_id_idx').on(t.userId),
  })
)

// ─── Telegram Bots ───────────────────────────────────────────────────────────

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
    botId: text('bot_id')
      .notNull()
      .references(() => telegramBots.id, { onDelete: 'cascade' }),
    telegramChatId: text('telegram_chat_id').notNull(),
    username: text('username'),
    title: text('title').notNull(),
    verified: integer('verified', { mode: 'boolean' }).notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index('channels_user_id_idx').on(t.userId),
    botIdIdx: index('channels_bot_id_idx').on(t.botId),
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
    ...timestamps,
  },
  (t) => ({
    userIdIdx: index('posts_user_id_idx').on(t.userId),
    channelIdIdx: index('posts_channel_id_idx').on(t.channelId),
    statusIdx: index('posts_status_idx').on(t.status),
    scheduledAtIdx: index('posts_scheduled_at_idx').on(t.scheduledAt),
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

// ─── Payments ────────────────────────────────────────────────────────────────

export const payments = sqliteTable(
  'payments',
  {
    id: id(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    planId: text('plan_id')
      .notNull()
      .references(() => plans.id),
    provider: text('provider').notNull(),
    providerPaymentId: text('provider_payment_id'),
    amount: real('amount').notNull(),
    currency: text('currency').notNull(),
    status: text('status', {
      enum: ['pending', 'confirmed', 'failed', 'expired'],
    })
      .notNull()
      .default('pending'),
    transactionReference: text('transaction_reference'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    confirmedAt: text('confirmed_at'),
  },
  (t) => ({
    userIdIdx: index('payments_user_id_idx').on(t.userId),
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

// ─── Type Exports ────────────────────────────────────────────────────────────

export type Session = typeof sessions.$inferSelect
export type User = typeof users.$inferSelect
export type Plan = typeof plans.$inferSelect
export type Subscription = typeof subscriptions.$inferSelect
export type TelegramBot = typeof telegramBots.$inferSelect
export type TelegramChannel = typeof telegramChannels.$inferSelect
export type Post = typeof posts.$inferSelect
export type PostMedia = typeof postMedia.$inferSelect
export type Payment = typeof payments.$inferSelect
export type PostAnalytics = typeof postAnalytics.$inferSelect
