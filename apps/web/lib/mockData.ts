export interface MockChannel {
  id: string
  username: string
  title: string
  memberCount: number
}

export interface MockPost {
  id: string
  channelId: string
  content: string
  status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed' | 'cancelled'
  scheduledAt: string | null
  publishedAt: string | null
  hasMedia: boolean
  mediaType?: 'image' | 'video'
  errorMessage?: string
  createdAt: string
}

export const MOCK_CHANNELS: MockChannel[] = [
  { id: 'channel_1', username: '@CryptoTrading', title: 'Crypto Trading', memberCount: 12400 },
  { id: 'channel_2', username: '@MarketSignals', title: 'Market Signals', memberCount: 8900 },
  { id: 'channel_3', username: '@DailyNews', title: 'Daily News', memberCount: 31200 },
]

export const MOCK_POSTS: MockPost[] = [
  {
    id: 'post_1',
    channelId: 'channel_1',
    content:
      '📈 BTC is approaching yesterday\'s high at $68,420.\n\nWatch for a breakout above this level — if confirmed, next target is $70,000.\n\nRSI is at 67, momentum still bullish. Set alerts at $68,500.',
    status: 'scheduled',
    scheduledAt: '2026-08-26T05:30:00.000Z',
    publishedAt: null,
    hasMedia: true,
    mediaType: 'image',
    createdAt: '2026-08-26T04:50:00.000Z',
  },
  {
    id: 'post_2',
    channelId: 'channel_1',
    content:
      '📊 Daily Trading Recap\n\nMarket closed green today. BTC +3.2%, ETH +4.1%, SOL +6.8%.\n\nTotal volume was above average — institutional buying patterns detected across the board.\n\nTomorrow\'s key levels: BTC support at $66,800.',
    status: 'published',
    scheduledAt: null,
    publishedAt: '2026-08-26T02:00:00.000Z',
    hasMedia: false,
    createdAt: '2026-08-26T01:00:00.000Z',
  },
  {
    id: 'post_3',
    channelId: 'channel_1',
    content:
      '⚡️ New Signal: ETH/USDT\n\nEntry: $3,420 – $3,450\nTarget 1: $3,600\nTarget 2: $3,800\nStop Loss: $3,300\n\nRisk/Reward: 1:3.5\n\nDo your own research. This is not financial advice.',
    status: 'draft',
    scheduledAt: null,
    publishedAt: null,
    hasMedia: false,
    createdAt: '2026-08-26T04:00:00.000Z',
  },
  {
    id: 'post_4',
    channelId: 'channel_1',
    content:
      '🚨 Market Alert\n\nBTC flash crashed to $64,200 in the last hour. This appears to be a liquidation cascade.\n\nRemain calm. Support at $63,500 is critical.',
    status: 'failed',
    scheduledAt: '2026-08-26T03:30:00.000Z',
    publishedAt: null,
    hasMedia: false,
    errorMessage: 'Bot API error: 403 Forbidden — bot is not an administrator of the channel.',
    createdAt: '2026-08-26T03:00:00.000Z',
  },
  {
    id: 'post_5',
    channelId: 'channel_1',
    content:
      '📅 Weekly Market Outlook\n\nKey events this week:\n• Monday: US CPI data\n• Wednesday: Fed minutes release\n• Friday: Options expiry ($2.1B BTC)\n\nExpect volatility. Trade with caution.',
    status: 'scheduled',
    scheduledAt: '2026-08-27T05:00:00.000Z',
    publishedAt: null,
    hasMedia: false,
    createdAt: '2026-08-26T03:00:00.000Z',
  },
  {
    id: 'post_6',
    channelId: 'channel_2',
    content:
      '📉 SOL showing weakness below $145. Key support at $140 — a break could see $130 tested.\n\nWatch volume closely before entering.',
    status: 'scheduled',
    scheduledAt: '2026-08-26T06:00:00.000Z',
    publishedAt: null,
    hasMedia: false,
    createdAt: '2026-08-26T04:30:00.000Z',
  },
  {
    id: 'post_7',
    channelId: 'channel_2',
    content:
      '✅ Signal closed in profit!\n\nBTC/USDT long from $66,400 → closed at $68,200.\nProfit: +2.7% | R:R achieved: 1:2.8\n\nGood trade, team. 🎯',
    status: 'published',
    scheduledAt: null,
    publishedAt: '2026-08-25T18:00:00.000Z',
    hasMedia: false,
    createdAt: '2026-08-25T17:45:00.000Z',
  },
  {
    id: 'post_8',
    channelId: 'channel_3',
    content:
      '🗞️ Morning Briefing\n\nTop headlines:\n• Fed signals rate cut in September\n• Apple hits $3.5T market cap\n• Oil drops 2% on demand fears\n\nMore updates throughout the day.',
    status: 'published',
    scheduledAt: null,
    publishedAt: '2026-08-26T03:00:00.000Z',
    hasMedia: false,
    createdAt: '2026-08-26T02:45:00.000Z',
  },
]


export interface PostTimestamps {
  scheduledAt: string | null
  publishedAt: string | null
  createdAt: string
}

// Parse a timestamp from the API. `scheduled_at`/`published_at` are written as
// full ISO strings with a Z suffix, but DB-defaulted columns (created_at,
// updated_at, …) come back as bare "YYYY-MM-DD HH:MM:SS" — UTC without a
// marker. Without the fix below, browsers parse those as LOCAL time and show
// them hours off. Treat any timezone-less stamp as UTC.
export function dbDate(input: string | null | undefined): Date | null {
  if (!input) return null
  const s =
    /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(input) ? `${input}Z` : input
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatPostTime(post: PostTimestamps): string {
  const date =
    dbDate(post.publishedAt) ??
    dbDate(post.scheduledAt) ??
    dbDate(post.createdAt)

  if (!date) return '—'

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatPostDate(post: PostTimestamps): string {
  const date = dbDate(post.scheduledAt) ?? dbDate(post.publishedAt) ?? dbDate(post.createdAt)
  if (!date) return '—'

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow =
    date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

  if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}

// 12400 → "12.4K", 1200000 → "1.2M" — Telegram-style member counts.
export function formatMemberCount(count: number | null | undefined): string | null {
  if (count == null || !Number.isFinite(count)) return null
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, '')}K`
  }
  return String(count)
}
