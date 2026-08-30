// Dev-only endpoints: seed random demo data so the dashboard chat has content
// locally (a dev-login account starts completely empty). Every route here 404s
// in production — these endpoints simply do not exist on real deployments.
import { Hono } from 'hono'
import { and, eq, inArray } from 'drizzle-orm'
import { createDb } from '../db'
import { posts, telegramChannels } from '@telepost/db'
import type { HonoEnv } from '../types'
import { requireAuth } from '../lib/auth'

export const devRoutes = new Hono<HonoEnv>()

// Guard: refuse to serve any /api/dev route outside local development.
devRoutes.use('*', async (c, next) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'Not found' }, 404)
  }
  await next()
})

// Stable fake chat ids — re-seeding never duplicates these channels and
// DELETE /api/dev/seed can find exactly what was seeded.
const DEMO_CHANNELS = [
  { telegramChatId: '-100900000001', username: 'CryptoTrading', title: 'Crypto Trading' },
  { telegramChatId: '-100900000002', username: 'DailyNews', title: 'Daily News' },
  { telegramChatId: '-100900000003', username: 'MarketSignals', title: 'Market Signals' },
]

// Platform bot id (mirrors channels.ts / bot.ts).
const PLATFORM_BOT_ID = 8985221169

const MESSAGE_POOL = [
  "📈 BTC is approaching yesterday's high at $68,420. Watch for a breakout — next target $70,000 if confirmed.",
  '📊 Daily recap: market closed green. BTC +3.2%, ETH +4.1%, SOL +6.8% above-average volume.',
  '⚡️ New signal: ETH/USDT — Entry $3,420–$3,450, Target $3,600, Stop $3,300. R:R 1:3.5',
  '🚨 Market alert: BTC flash-crashed to $64,200 in a liquidation cascade. Support $63,500 is critical.',
  '📅 Weekly outlook: US CPI Monday, Fed minutes Wednesday, $2.1B options expiry Friday.',
  '🗞️ Morning briefing: Fed signals September cut, Apple hits $3.5T cap, oil drops 2%.',
  '✅ Signal closed in profit — BTC/USDT long $66,400 → $68,200 (+2.7%). Good trade, team. 🎯',
  '📉 SOL showing weakness below $145. A clean break of $140 could test $130.',
  '🔥 Community poll: what content do you want more of this month? Vote below!',
  '🧠 Tip: position sizing matters more than entry price. Risk 1–2% per trade, always.',
  '🎯 New video is live: "Reading order flow like a market maker" — link in the pinned post.',
  '💬 Q&A thread open until 8 PM. Drop your questions about the upcoming halving.',
  '📌 Reminder: premium signals resume Monday. 3 spots left this cycle.',
  '🌙 Late-night chart scan: ETH dominance ticking up, alts quiet. Sleep well!',
]

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(list: readonly T[]): T {
  return list[randInt(0, list.length - 1)]!
}

function minutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString()
}

function minutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString()
}


// POST /api/dev/seed — ensure the demo channels exist, then insert a random mix
// of published / scheduled / draft / failed posts spread across the past and
// next few days so the chat feed has realistic content. Safe to call repeatedly
// (channels are idempotent; each call adds a fresh batch of random posts).
devRoutes.post('/seed', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const demoChatIds = DEMO_CHANNELS.map((ch) => ch.telegramChatId)

  // 1. Demo channels (idempotent).
  const existing = await db
    .select()
    .from(telegramChannels)
    .where(
      and(
        eq(telegramChannels.userId, user.id),
        inArray(telegramChannels.telegramChatId, demoChatIds)
      )
    )
  const have = new Set(existing.map((row) => row.telegramChatId))
  const missing = DEMO_CHANNELS.filter((ch) => !have.has(ch.telegramChatId))
  if (missing.length > 0) {
    await db.insert(telegramChannels).values(
      missing.map((ch) => ({
        userId: user.id,
        telegramBotId: PLATFORM_BOT_ID,
        telegramChatId: ch.telegramChatId,
        username: ch.username,
        title: ch.title,
        verified: true,
      }))
    )
  }

  const channels = await db
    .select()
    .from(telegramChannels)
    .where(
      and(
        eq(telegramChannels.userId, user.id),
        inArray(telegramChannels.telegramChatId, demoChatIds)
      )
    )
  if (channels.length === 0) {
    return c.json({ error: 'Failed to prepare demo channels' }, 500)
  }

  // 2. Random posts. The i % 7 pattern yields ~6 published, 4 scheduled,
  //    2 drafts and 2 failed per 14 rows — a believable chat history where
  //    delivery time differs from row-creation time.
  const shuffled = [...MESSAGE_POOL].sort(() => Math.random() - 0.5)
  const rows: (typeof posts.$inferInsert)[] = shuffled.map((content, i) => {
    const channel = pick(channels)
    const kind = i % 7

    if (kind === 0 || kind === 2 || kind === 4) {
      // Delivered in the past — chat history bubbles.
      const publishedAt = minutesAgo(randInt(30, 60 * 72))
      const createdAt = new Date(
        new Date(publishedAt).getTime() - randInt(2, 40) * 60_000
      ).toISOString()
      return {
        userId: user.id,
        channelId: channel.id,
        content,
        status: 'published',
        publishedAt,
        telegramMessageId: randInt(1000, 99999),
        createdAt,
        updatedAt: publishedAt,
      }
    }

    if (kind === 1 || kind === 6) {
      // Queued for the future.
      const createdAt = minutesAgo(randInt(5, 600))
      return {
        userId: user.id,
        channelId: channel.id,
        content,
        status: 'scheduled',
        scheduledAt: minutesFromNow(randInt(20, 60 * 72)),
        createdAt,
        updatedAt: createdAt,
      }
    }

    if (kind === 3) {
      const createdAt = minutesAgo(randInt(1, 240))
      return {
        userId: user.id,
        channelId: channel.id,
        content,
        status: 'draft',
        createdAt,
        updatedAt: createdAt,
      }
    }

    // kind === 5 — failed delivery with an error trail.
    const scheduledAt = minutesAgo(randInt(60, 60 * 48))
    const createdAt = new Date(
      new Date(scheduledAt).getTime() - randInt(5, 60) * 60_000
    ).toISOString()
    return {
      userId: user.id,
      channelId: channel.id,
      content,
      status: 'failed',
      scheduledAt,
      errorMessage:
        'Bot API error: 403 Forbidden — bot is not an administrator of the channel.',
      retryCount: 1,
      createdAt,
      updatedAt: scheduledAt,
    }
  })

  // D1 caps bound parameters per statement (100) — 14 rows × 12 columns would
  // blow past it, so chunk the insert (same pattern as posts.ts media lookups).
  for (let i = 0; i < rows.length; i += 7) {
    await db.insert(posts).values(rows.slice(i, i + 7))
  }

  return c.json({ channels: missing.length, posts: rows.length }, 201)
})

// DELETE /api/dev/seed — remove the demo channels; their posts (and media rows)
// cascade away with them. Any non-demo channels the user created stay intact.
devRoutes.delete('/seed', async (c) => {
  const user = await requireAuth(c)
  const db = createDb(c.env.DB)

  const removed = await db
    .delete(telegramChannels)
    .where(
      and(
        eq(telegramChannels.userId, user.id),
        inArray(
          telegramChannels.telegramChatId,
          DEMO_CHANNELS.map((ch) => ch.telegramChatId)
        )
      )
    )
    .returning()

  return c.json({ success: true, channels: removed.length })
})
