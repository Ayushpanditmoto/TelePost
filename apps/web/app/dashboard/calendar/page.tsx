'use client'

import React, { useMemo } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Post } from '@/hooks/usePosts'
import { formatPostTime } from '@/lib/mockData'

const Page = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing['2xl']};
`

const Inner = styled.div`
  max-width: 640px;
  margin: 0 auto;
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const DayGroup = styled.section`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const DayLabel = styled.h2`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.accent};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-left: 3px solid ${({ theme }) => theme.colors.status.scheduled};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  display: flex;
  flex-direction: column;
  gap: 4px;
`

const CardTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

const Content = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  white-space: pre-wrap;
  word-break: break-word;
`

const Empty = styled.p`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  text-align: center;
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
`

function dayKey(iso: string): string {
  return new Date(iso).toDateString()
}

export default function CalendarPage() {
  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ['posts', 'all'],
    queryFn: async () => (await api<{ posts: Post[] }>('/api/posts')).posts,
  })

  // Upcoming scheduled posts, grouped by calendar day.
  const groups = useMemo(() => {
    const now = Date.now()
    const upcoming = posts
      .filter(
        (p) =>
          p.status === 'scheduled' &&
          p.scheduledAt &&
          new Date(p.scheduledAt).getTime() >= now - 60_000
      )
      .sort(
        (a, b) =>
          new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime()
      )

    const map = new Map<string, Post[]>()
    for (const p of upcoming) {
      const key = dayKey(p.scheduledAt!)
      const list = map.get(key) ?? []
      list.push(p)
      map.set(key, list)
    }
    return Array.from(map.entries())
  }, [posts])

  const label = (key: string) => {
    const d = new Date(key)
    const today = new Date().toDateString()
    const tomorrow = new Date(Date.now() + 86_400_000).toDateString()
    if (key === today) return 'Today'
    if (key === tomorrow) return 'Tomorrow'
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <Page>
      <Inner>
        <TopBar>
          <Title>Calendar</Title>
          <BackLink href="/dashboard">← Back to dashboard</BackLink>
        </TopBar>
        <Subtitle>Upcoming scheduled posts, soonest first.</Subtitle>

        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : groups.length === 0 ? (
          <Empty>Nothing scheduled yet. Schedule a post from the composer.</Empty>
        ) : (
          groups.map(([key, items]) => (
            <DayGroup key={key}>
              <DayLabel>
                {label(key)} · {items.length}{' '}
                {items.length === 1 ? 'post' : 'posts'}
              </DayLabel>
              {items.map((p) => (
                <Card key={p.id}>
                  <CardTop>
                    <span>{formatPostTime(p)}</span>
                    <span>{p.retryCount > 0 ? `retry ${p.retryCount}` : ''}</span>
                  </CardTop>
                  <Content>{p.content}</Content>
                </Card>
              ))}
            </DayGroup>
          ))
        )}
      </Inner>
    </Page>
  )
}