'use client'

import React from 'react'
import styled from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'
import { useChannels } from '@/hooks/useChannels'
import { usePosts } from '@/hooks/usePosts'
import MessageCard from './MessageCard'
import MessageComposer from './MessageComposer'

const Panel = styled.main`
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.colors.bg.primary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};
  overflow: hidden;
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
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md} 0;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`

const DateSeparator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.xl};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`

const DateLine = styled.div`
  flex: 1;
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
`

const DateLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  white-space: nowrap;
`

const EmptyState = styled.div`
  flex: 1;
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

const AVATAR_COLORS = ['#2196f3', '#9c27b0', '#f44336', '#4caf50', '#ff9800']

const FILTERS = [
  { label: 'All', value: 'all' },
  { label: '🕐 Scheduled', value: 'scheduled' },
  { label: '✓ Published', value: 'published' },
  { label: '○ Draft', value: 'draft' },
  { label: '✕ Failed', value: 'failed' },
]

export default function CenterPanel() {
  const { selectedChannelId } = useDashboardStore()
  const { data: channels = [] } = useChannels()
  const { data: allPosts = [], isLoading: postsLoading } = usePosts(
    selectedChannelId
  )
  const [activeFilter, setActiveFilter] = React.useState('all')

  const channel = channels.find((c) => c.id === selectedChannelId)
  const channelIndex = channels.findIndex((c) => c.id === selectedChannelId)

  const posts = allPosts.filter(
    (p) => activeFilter === 'all' || p.status === activeFilter
  )

  return (
    <Panel>
      <Header>
        <ChannelInfo>
          {channel && (
            <>
              <ChannelAvatar $color={AVATAR_COLORS[channelIndex % AVATAR_COLORS.length] ?? '#2196f3'}>
                {channel.title.charAt(0)}
              </ChannelAvatar>
              <ChannelDetails>
                <ChannelName>
                  {channel.username ? `@${channel.username}` : channel.title}
                </ChannelName>
                <ChannelSub>{channel.title}</ChannelSub>
              </ChannelDetails>
            </>
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

      <Feed id="message-feed">
        {postsLoading ? (
          <EmptyState>
            <EmptyIcon>⏳</EmptyIcon>
            <EmptyTitle>Loading…</EmptyTitle>
          </EmptyState>
        ) : posts.length > 0 ? (
          <>
            <DateSeparator>
              <DateLine />
              <DateLabel>Today</DateLabel>
              <DateLine />
            </DateSeparator>
            {posts.map((post) => (
              <MessageCard key={post.id} post={post} />
            ))}
          </>
        ) : (
          <EmptyState>
            <EmptyIcon>📭</EmptyIcon>
            <EmptyTitle>No posts yet</EmptyTitle>
            <EmptyDesc>Write your first message below</EmptyDesc>
          </EmptyState>
        )}
      </Feed>

      <MessageComposer />
    </Panel>
  )
}
