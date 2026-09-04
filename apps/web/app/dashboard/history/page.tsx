'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import { History as HistoryIcon } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Post, PostStatus } from '@/hooks/usePosts'
import { formatPostDate } from '@/lib/mockData'
import { useChannels } from '@/hooks/useChannels'
import ViewHeader from '@/components/dashboard/ViewHeader'

const Page = styled.main`
  min-height: 100%;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing['2xl']} clamp(20px, 4vw, 64px);
`

const Inner = styled.div`
  max-width: 760px;
  margin: 0 auto;
`

const FilterBar = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  padding: 4px;
  width: fit-content;
  max-width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg.secondary};
`

const Chip = styled.button<{ $active?: boolean }>`
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.bg.input};
  color: ${({ $active, theme }) =>
    $active ? '#fff' : theme.colors.text.secondary};
  border: none;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.accentHover : theme.colors.bg.tertiary};
  }
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Item = styled.li`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: border-color ${({ theme }) => theme.transition.fast},
    background ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    background: ${({ theme }) => theme.colors.bg.messageHover};
  }
`

const ItemTop = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Badge = styled.span<{ $status: PostStatus }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};

  ${({ $status, theme }) => {
    const map: Record<string, [string, string]> = {
      scheduled: [theme.colors.status.scheduled, theme.colors.status.scheduledBg],
      published: [theme.colors.status.published, theme.colors.status.publishedBg],
      failed: [theme.colors.status.failed, theme.colors.status.failedBg],
      draft: [theme.colors.status.draft, theme.colors.status.draftBg],
      publishing: [theme.colors.status.publishing, theme.colors.status.publishingBg],
      cancelled: [theme.colors.status.cancelled, theme.colors.status.cancelledBg],
    }
    const [color, bg] = map[$status] ?? [theme.colors.text.muted, 'transparent']
    return `color: ${color}; background: ${bg};`
  }}
`

const ChannelName = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

const Time = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.timestamp};
`

export default function HistoryPage() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['posts', 'all'],
    queryFn: async () => (await api<{ posts: Post[] }>('/api/posts')).posts,
  })
  const { data: channels = [] } = useChannels()
  const [filter, setFilter] = useState<PostStatus | 'all'>('all')

  const filtered =
    filter === 'all' ? posts : posts.filter((p) => p.status === filter)

  const channelName = (id: string) => {
    const c = channels.find((ch) => ch.id === id)
    if (!c) return ''
    return c.username ? `@${c.username}` : c.title
  }

  return (
    <Page>
      <Inner>
        <ViewHeader
          icon={HistoryIcon}
          eyebrow="Content archive"
          title="History"
          subtitle="Review every draft, scheduled post, and published delivery in one place."
        />

        <FilterBar>
          {(
            ['all', 'scheduled', 'published', 'draft', 'failed', 'cancelled'] as const
          ).map((s) => (
            <Chip key={s} $active={filter === s} onClick={() => setFilter(s)}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Chip>
          ))}
        </FilterBar>

        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : filtered.length === 0 ? (
          <Empty>
            No posts{filter !== 'all' ? ` with status “${filter}”` : ''} yet.
          </Empty>
        ) : (
          <List>
            {filtered.map((p) => (
              <Item key={p.id}>
                <ItemTop>
                  <Badge $status={p.status}>{p.status}</Badge>
                  <ChannelName>{channelName(p.channelId)}</ChannelName>
                  <Time>{formatPostDate(p)}</Time>
                </ItemTop>
                <Content>{p.content}</Content>
                {p.errorMessage && <Content>⚠️ {p.errorMessage}</Content>}
              </Item>
            ))}
          </List>
        )}
      </Inner>
    </Page>
  )
}

const Content = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  white-space: pre-wrap;
  word-break: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
`