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
    scheduledAt: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    publishedAt: null,
    hasMedia: true,
    mediaType: 'image',
    createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
  },
  {
    id: 'post_2',
    channelId: 'channel_1',
    content:
      '📊 Daily Trading Recap\n\nMarket closed green today. BTC +3.2%, ETH +4.1%, SOL +6.8%.\n\nTotal volume was above average — institutional buying patterns detected across the board.\n\nTomorrow\'s key levels: BTC support at $66,800.',
    status: 'published',
    scheduledAt: null,
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    hasMedia: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
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
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'post_4',
    channelId: 'channel_1',
    content:
      '🚨 Market Alert\n\nBTC flash crashed to $64,200 in the last hour. This appears to be a liquidation cascade.\n\nRemain calm. Support at $63,500 is critical.',
    status: 'failed',
    scheduledAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    publishedAt: null,
    hasMedia: false,
    errorMessage: 'Bot API error: 403 Forbidden — bot is not an administrator of the channel.',
    createdAt: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
  },
  {
    id: 'post_5',
    channelId: 'channel_1',
    content:
      '📅 Weekly Market Outlook\n\nKey events this week:\n• Monday: US CPI data\n• Wednesday: Fed minutes release\n• Friday: Options expiry ($2.1B BTC)\n\nExpect volatility. Trade with caution.',
    status: 'scheduled',
    scheduledAt: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    publishedAt: null,
    hasMedia: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
]

export function formatPostTime(post: MockPost): string {
  const date =
    post.publishedAt
      ? new Date(post.publishedAt)
      : post.scheduledAt
      ? new Date(post.scheduledAt)
      : new Date(post.createdAt)

  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatPostDate(post: MockPost): string {
  const date =
    post.scheduledAt
      ? new Date(post.scheduledAt)
      : post.publishedAt
      ? new Date(post.publishedAt)
      : new Date(post.createdAt)

  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow =
    date.toDateString() === new Date(now.getTime() + 86400000).toDateString()

  if (isToday) return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  if (isTomorrow) return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })
}
