'use client'

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'
import { useChannels } from '@/hooks/useChannels'
import { usePosts, type Post } from '@/hooks/usePosts'
import { useSeedDemoData } from '@/hooks/useDev'
import { dbDate, formatMemberCount } from '@/lib/mockData'
import { API_URL } from '@/lib/api'
import MessageCard from './MessageCard'
import MessageComposer from './MessageComposer'
import { ChevronDown } from 'lucide-react'

const Panel = styled.main`
  flex: 1;
  min-width: 0;
  height: 100vh;
  /* 100dvh keeps the column sized to the real viewport (mobile toolbars). */
  height: 100dvh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg.primary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};
  overflow: hidden;
  /* Required so the absolute-positioned ScrollToBottomBtn is contained here. */
  position: relative;
`

const Header = styled.div`
  height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.bg.secondary};
`

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const ChannelAvatar = styled.div<{ $color: string }>`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`

const ChannelDetails = styled.div``

const ChannelName = styled.div`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.2;
`

const ChannelSub = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const IconBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 16px;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  flex-shrink: 0;
  overflow-x: auto;

  &::-webkit-scrollbar {
    display: none;
  }
`

const FilterChip = styled.button<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
  transition: all ${({ theme }) => theme.transition.fast};

  ${({ $active, theme }) =>
    $active
      ? `
    background: ${theme.colors.accent};
    color: #fff;
  `
      : `
    background: ${theme.colors.bg.input};
    color: ${theme.colors.text.secondary};
    &:hover {
      background: ${theme.colors.bg.tertiary};
      color: ${theme.colors.text.primary};
    }
  `}
`

const Feed = styled.div`
  flex: 1;
  /* min-height: 0 lets the Feed shrink below its content inside the 100vh
     flex column — without it overflow-y never engages and it clips instead. */
  min-height: 0;
  /* A plain block scroller — bottom-anchoring must NOT live here. Flex
     alignment (flex-end) on a scroll container pushes overflow past the START
     edge where scrollTop gets clamped: the chat sticks to the bottom, fights
     manual scrolling, and the oldest bubble is unreachable/clipped. Anchoring
     happens inside FeedInner (CSS, short chats) and via the JS snap (long
     chats) — how Telegram's web app does it. */
  overflow-y: auto;
  /* Keeps wheel/touch momentum from chaining out of the feed once it ends. */
  overscroll-behavior: contain;
  overflow-x: hidden;
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.lg}
    ${({ theme }) => theme.spacing.xl};
  background-color: #101b28;
  background-image: url('/telegram-pattern.svg');
`

// Centered conversation band: Telegram keeps bubbles in a readable column
// instead of stretching them across ultra-wide panels. It is a flex column
// with auto height so bubbles can NEVER be squished by the scroll container
// (direct children of a fixed-height flex feed get compressed and their
// overflow:hidden clips text mid-line). `margin-top: auto` preserves the
// bottom-anchoring above for short chats.
const FeedInner = styled.div`
  width: 100%;
  max-width: ${({ theme }) => theme.layout.chatMaxWidth};
  margin: 0 auto;
  /* Fill short viewports so bubbles bottom-anchor via justify-content below —
     with no overflow there is nothing to scroll and no flex-overflow bug.
     Once messages exceed the viewport, min-height stops mattering and the
     feed scrolls as a normal block with the oldest message fully reachable. */
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`

// Telegram-style floating date pill, centered above the day's first message —
// reads as a clear group boundary instead of a full-width line of text.
const DateSeparator = styled.div`
  align-self: center;
  flex-shrink: 0;
  background: ${({ theme }) => theme.colors.bg.input};
  border-radius: ${({ theme }) => theme.radius.full};
  padding: 4px 14px;
  margin: ${({ theme }) => theme.spacing.md} 0 ${({ theme }) => theme.spacing.xs};
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.35);
`

const DateLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
`

const EmptyState = styled.div`
  min-height: 100%;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  color: ${({ theme }) => theme.colors.text.muted};
`

const EmptyIcon = styled.div`
  font-size: 40px;
  opacity: 0.5;
`

const EmptyTitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const EmptyDesc = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`

const SeedBtn = styled.button`
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px dashed ${({ theme }) => theme.colors.border.accent};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentMuted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const SeedError = styled.p`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.status.failed};
`

const ScrollToBottomBtn = styled.button<{ $visible?: boolean }>`
  /* absolute so it's contained inside Panel (position: relative) instead of
     the viewport — this way it always floats just above the composer bar
     regardless of how many panels are open side-by-side. */
  position: absolute;
  right: ${({ theme }) => theme.spacing.lg};
  /* 56px composer height + a little breathing room */
  bottom: calc(64px + ${({ theme }) => theme.spacing.md});
  z-index: 10;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${({ theme }) => theme.colors.bg.tertiary};
  color: ${({ theme }) => theme.colors.text.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  visibility: hidden;
  transform: translateY(10px);
  transition: all 120ms ease;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);

  /* visible state */
  ${({ $visible }) =>
    $visible &&
    `
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
    pointer-events: auto;
  `}

  &:hover {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
    transform: translateY(0) scale(1.1);
    box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  }
`

const AVATAR_COLORS = ['#2196f3', '#9c27b0', '#f44336', '#4caf50', '#ff9800']

// Dev tooling renders only when the app is built with NEXT_PUBLIC_DEV_LOGIN=true
// (see .env.example) — the worker refuses /api/dev routes in production anyway.
const DEV_TOOLS_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true'

// ─── Shimmer skeletons (React Query initial loads) ───────────────────────────
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const shimmerSweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`

const Bone = styled.div<{ $w?: string; $h?: string; $round?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '12px'};
  border-radius: ${({ $round }) => $round ?? '6px'};
  background-color: ${({ theme }) => theme.colors.bg.tertiary};
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 35%,
    rgba(255, 255, 255, 0.13) 50%,
    rgba(255, 255, 255, 0.05) 65%,
    transparent 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: ${shimmerSweep} 1.4s ease-in-out infinite;
`

const HeaderSkeleton = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  animation: ${fadeIn} ${({ theme }) => theme.transition.default} ease both;
`

const HeaderSkeletonAvatar = styled(Bone)`
  && {
    width: 34px;
    height: 34px;
    border-radius: 50%;
  }
`

const HeaderSkeletonLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const CardSkeleton = styled.div`
  background: ${({ theme }) => theme.colors.bg.message};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 14px 8px;
  margin: 2px 12px;
  opacity: 0;
  animation: ${fadeIn} ${({ theme }) => theme.transition.default} ease both;
`

const CardSkeletonLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const CardSkeletonMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
`

// Pin the loading bones to the bottom of the viewport like real messages do.
const FeedSkeletonWrap = styled.div`
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
`

function FeedSkeleton() {
  // Staggered delays make the bones settle in instead of blinking on.
  return (
    <FeedSkeletonWrap id="feed-skeleton">
      {[0, 1, 2, 3, 4].map((i) => (
        <CardSkeleton
          key={i}
          style={{ animationDelay: `${i * 0.07}s` }}
        >
          <CardSkeletonLines>
            <Bone $w="88%" />
            <Bone $w="96%" />
            <Bone $w={i % 2 === 0 ? '54%' : '71%'} />
          </CardSkeletonLines>
          <CardSkeletonMeta>
            <Bone $w="86px" $h="18px" $round="9999px" />
            <Bone $w="70px" $h="10px" />
          </CardSkeletonMeta>
        </CardSkeleton>
      ))}
    </FeedSkeletonWrap>
  )
}

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: '🕐 Scheduled', value: 'scheduled' },
  { label: '✓ Published', value: 'published' },
  { label: '○ Draft', value: 'draft' },
  { label: '✕ Failed', value: 'failed' },
]

// ─── Recurring-series collapsing ─────────────────────────────────────────────
// One "Repeat daily" submission stores one post row per upcoming date (all
// rows share a series_id). Rendering every row floods the chat with identical
// bubbles for every date, so all members of a series collapse into a single
// bubble labelled with the repeat rule, the next run time and how many more
// runs are queued. Already-published occurrences stay collapsed too — one
// bubble speaks for the whole routine.
const MS_PER_DAY = 86_400_000

// "Repeats daily" / "Repeats weekly" / "Repeats custom days", inferred from
// the gaps between occurrence timestamps (calendar-day stepping means DST can
// shift raw ms by ±1h, so compare rounded day distances).
function cadenceLabel(timesAsc: number[]): string {
  if (timesAsc.length < 2) return 'Repeats custom days'
  const dayGaps = timesAsc
    .slice(1)
    .map((t, i) => Math.round((t - timesAsc[i]) / MS_PER_DAY))
  if (dayGaps.every((g) => g === 1)) return 'Repeats daily'
  if (dayGaps.every((g) => g >= 6 && g % 7 === 0)) return 'Repeats weekly'
  return 'Repeats custom days'
}

interface FeedItem {
  /** The bubble's backing row — the next thing that will happen in a series. */
  post: Post
  series?: { label: string; extra: string | null }
}

function buildFeedItems(posts: Post[]): FeedItem[] {
  const membersBySeries = new Map<string, Post[]>()
  for (const p of posts) {
    if (!p.seriesId) continue
    const list = membersBySeries.get(p.seriesId)
    if (list) list.push(p)
    else membersBySeries.set(p.seriesId, [p])
  }

  const emitted = new Set<string>()
  const timeOf = (m: Post) =>
    dbDate(m.scheduledAt)?.getTime() ?? Number.POSITIVE_INFINITY

  const items: FeedItem[] = []
  for (const p of posts) {
    if (!p.seriesId) {
      items.push({ post: p })
      continue
    }
    if (emitted.has(p.seriesId)) continue
    emitted.add(p.seriesId)

    const members = membersBySeries.get(p.seriesId)!
    const upcoming = members
      .filter((m) => m.status === 'scheduled' || m.status === 'publishing')
      .sort((a, b) => timeOf(a) - timeOf(b))

    // Bubble shows the next scheduled run; once nothing is queued it shows
    // the most recently delivered occurrence instead.
    const rep =
      upcoming[0] ??
      [...members].sort(
        (a, b) =>
          (dbDate(b.publishedAt)?.getTime() ?? 0) -
          (dbDate(a.publishedAt)?.getTime() ?? 0)
      )[0] ??
      p

    const cadence = cadenceLabel(
      (upcoming.length ? upcoming : members)
        .filter((m) => m.scheduledAt)
        .map(timeOf)
        .sort((a, b) => a - b)
    )
    // The rep itself is the next run; the rest of the queue collapses.
    const remaining = Math.max(upcoming.length - 1, 0)

    items.push({
      post: rep,
      series: {
        label: cadence,
        extra: remaining > 0 ? `${remaining} more` : null,
      },
    })
  }
  return items
}

// ─── Chat chronology helpers ─────────────────────────────────────────────────
// A bubble's position in the chat is its *logical* message time — when it was
// (or will be) delivered to Telegram — not when the row was created in
// TelePost's DB. Falling back published → scheduled → created keeps drafts
// anchored near when they were written.
function messageTimeMs(post: Post): number {
  return (
    dbDate(post.publishedAt)?.getTime() ??
    dbDate(post.scheduledAt)?.getTime() ??
    dbDate(post.createdAt)?.getTime() ??
    0
  )
}

// Telegram-style separator labels relative to now.
function dayLabel(timeMs: number): string {
  const date = new Date(timeMs)
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const dayDiff = Math.round(
    (startOfDay(date) - startOfDay(new Date())) / MS_PER_DAY
  )
  if (dayDiff === 0) return 'Today'
  if (dayDiff === -1) return 'Yesterday'
  if (dayDiff === 1) return 'Tomorrow'
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

// Feed rows interleave per-day date separators with message bubbles.
type FeedRow =
  | { kind: 'separator'; key: string; label: string }
  | { kind: 'message'; key: string; item: FeedItem }

export default function CenterPanel() {
  const { selectedChannelId } = useDashboardStore()
  const { data: channels = [], isLoading: channelsLoading } = useChannels()
  const { data: allPosts = [], isLoading: postsLoading } = usePosts(
    selectedChannelId
  )
  const [activeFilter, setActiveFilter] = React.useState('all')
  const feedRef = useRef<HTMLDivElement>(null)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  // Set to false whenever the view changes; set to true once we've snapped.
  const hasSnappedRef = useRef(false)
  // Track post count for live-update follow logic.
  const lastPostCount = useRef(0)

  const channel = channels.find((c) => c.id === selectedChannelId)
  const channelIndex = channels.findIndex((c) => c.id === selectedChannelId)

  const posts = allPosts.filter(
    (p) => activeFilter === 'all' || p.status === activeFilter
  )

  // Chat chronology: a Telegram-style feed reads oldest → newest with the
  // newest bubble pinned at the bottom. The API returns rows newest-first by
  // DB row-creation time, which made the chat read backwards and let the
  // snap-to-bottom land on the *oldest* message — re-sort ascending by each
  // message's logical time before anything else.
  const chronologicalPosts = useMemo(
    () => [...posts].sort((a, b) => messageTimeMs(a) - messageTimeMs(b)),
    [posts]
  )

  // Collapse recurring series into single bubbles before rendering.
  const feedItems = useMemo(
    () => buildFeedItems(chronologicalPosts),
    [chronologicalPosts]
  )

  // Interleave "Today / Yesterday / <date>" separators between the bubbles.
  const feedRows = useMemo<FeedRow[]>(() => {
    const rows: FeedRow[] = []
    let lastDayKey = ''
    for (const item of feedItems) {
      const timeMs = messageTimeMs(item.post)
      const dayKey = new Date(timeMs).toDateString()
      if (dayKey !== lastDayKey) {
        lastDayKey = dayKey
        rows.push({ kind: 'separator', key: `sep-${dayKey}`, label: dayLabel(timeMs) })
      }
      rows.push({ kind: 'message', key: item.post.id, item })
    }
    return rows
  }, [feedItems])

  // Dev builds only: one-click random demo data for an empty chat.
  const seedDemo = useSeedDemoData()

  const SCROLL_THRESHOLD = 80

  const isNearBottom = useCallback(() => {
    const feed = feedRef.current
    if (!feed) return true
    return feed.scrollHeight - feed.scrollTop - feed.clientHeight < SCROLL_THRESHOLD
  }, [])

  const scrollToBottom = useCallback(() => {
    const feed = feedRef.current
    if (!feed) return
    feed.scrollTo({ top: feed.scrollHeight, behavior: 'smooth' })
  }, [])

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return
    const { scrollHeight, scrollTop, clientHeight } = feedRef.current
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD)
  }, [])

  // Attach scroll listener.
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return
    feed.addEventListener('scroll', handleScroll, { passive: true })
    return () => feed.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // ─── Initial snap via MutationObserver ───────────────────────────────────
  // MutationObserver fires AFTER the browser has committed DOM changes and
  // computed layout — meaning feed.scrollHeight is always accurate here.
  // This is immune to every timing issue that useLayoutEffect / rAF suffer:
  //   • React Query cache-hit (data arrives without postsLoading ever being true)
  //   • Concurrent-mode deferred rendering
  //   • Lazy images inflating height after first paint
  useEffect(() => {
    const feed = feedRef.current
    if (!feed) return

    // Reset snap flag for the new view.
    hasSnappedRef.current = false
    lastPostCount.current = 0
    setShowScrollBtn(false)

    const trySnap = () => {
      if (hasSnappedRef.current) return
      // Only snap once there is actual overflowing content to scroll to.
      if (feed.scrollHeight <= feed.clientHeight) return
      hasSnappedRef.current = true
      feed.scrollTop = feed.scrollHeight
    }

    // Try immediately in case content is already in the DOM (cache hit).
    trySnap()

    // Watch for message cards being added (covers async fetch path).
    const mo = new MutationObserver(trySnap)
    // subtree: bubbles render inside FeedInner, one level below the feed.
    mo.observe(feed, { childList: true, subtree: true })

    return () => mo.disconnect()
  // Re-run when the user switches channel or filter.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChannelId, activeFilter])

  // ─── Live-update follow ───────────────────────────────────────────────────
  // When new posts arrive, follow to the bottom only if the user is already
  // near the bottom (never yank them away from history). Chats that never
  // overflowed have no snap yet — follow those too, or a first message that
  // pushes the feed past the viewport would land below the fold.
  useEffect(() => {
    if (postsLoading) return
    const prevCount = lastPostCount.current
    const currentCount = posts.length
    if (currentCount > prevCount) {
      if (isNearBottom() || !hasSnappedRef.current) scrollToBottom()
      else setShowScrollBtn(true)
    } else if (currentCount < prevCount) {
      setShowScrollBtn(false)
    }
    lastPostCount.current = currentCount
  }, [posts, postsLoading, isNearBottom, scrollToBottom])

  return (
    <Panel>
      <Header>
        <ChannelInfo>
          {channelsLoading ? (
            <HeaderSkeleton id="header-skeleton">
              <HeaderSkeletonAvatar />
              <HeaderSkeletonLines>
                <Bone $w="120px" $h="13px" />
                <Bone $w="86px" $h="10px" />
              </HeaderSkeletonLines>
            </HeaderSkeleton>
          ) : (
            channel && (
              <>
                <ChannelAvatar $color={AVATAR_COLORS[channelIndex % AVATAR_COLORS.length] ?? '#2196f3'}>
                  {channel.hasPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${API_URL}/api/channels/${channel.id}/photo`}
                      alt=""
                      draggable={false}
                    />
                  ) : (
                    channel.title.charAt(0)
                  )}
                </ChannelAvatar>
                <ChannelDetails>
                  <ChannelName>
                    {channel.username ? `@${channel.username}` : channel.title}
                  </ChannelName>
                  <ChannelSub>
                    {formatMemberCount(channel.memberCount)
                      ? `${formatMemberCount(channel.memberCount)} members · ${channel.title}`
                      : channel.title}
                  </ChannelSub>
                </ChannelDetails>
              </>
            )
          )}
        </ChannelInfo>
        <HeaderActions>
          <IconBtn id="feed-search-btn" title="Search">🔍</IconBtn>
          <IconBtn id="feed-filter-btn" title="Filter">⊞</IconBtn>
          <IconBtn id="feed-more-btn" title="More">⋮</IconBtn>
        </HeaderActions>
      </Header>

      <FilterBar>
        {FILTERS.map((f) => (
          <FilterChip
            key={f.value}
            $active={activeFilter === f.value}
            onClick={() => setActiveFilter(f.value)}
            id={`filter-${f.value}`}
          >
            {f.label}
          </FilterChip>
        ))}
            </FilterBar>

      <Feed id="message-feed" ref={feedRef}>
        {postsLoading ? (
          <FeedSkeleton />
        ) : posts.length > 0 ? (
          <FeedInner>
            {feedRows.map((row) =>
              row.kind === 'separator' ? (
                <DateSeparator key={row.key}>
                  <DateLabel>{row.label}</DateLabel>
                </DateSeparator>
              ) : (
                <MessageCard
                  key={row.key}
                  post={row.item.post}
                  series={row.item.series}
                />
              )
            )}
          </FeedInner>
        ) : (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDesc>Write your first message below</EmptyDesc>
            {DEV_TOOLS_ENABLED && (
              <>
                <SeedBtn
                  onClick={() => seedDemo.mutate()}
                  disabled={seedDemo.isPending}
                  id="seed-demo-btn"
                >
                  {seedDemo.isPending ? 'Seeding…' : '✨ Seed demo messages'}
                </SeedBtn>
                {seedDemo.isError && (
                  <SeedError>
                    {seedDemo.error instanceof Error
                      ? seedDemo.error.message
                      : 'Seeding failed'}
                  </SeedError>
                )}
              </>
            )}
          </EmptyState>
        )}
        {/* Invisible scroll anchor removed — we use direct scrollTop now */}
      </Feed>

      <ScrollToBottomBtn
        $visible={showScrollBtn}
        onClick={() => scrollToBottom()}
        title="Scroll to bottom"
        aria-label="Scroll to bottom"
      >
        <ChevronDown size={18} />
      </ScrollToBottomBtn>
      

      <MessageComposer />
    </Panel>
  )
}
