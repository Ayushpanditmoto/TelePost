'use client'

import React, { useEffect } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'
import { MOCK_POSTS, formatPostDate } from '@/lib/mockData'
import { useChannels } from '@/hooks/useChannels'

const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`

const Panel = styled.aside<{ $open: boolean }>`
  width: ${({ theme }) => theme.layout.rightPanelWidth};
  height: 100vh;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-left: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
  animation: ${({ $open }) => ($open ? slideIn : 'none')} ${({ theme }) => theme.transition.panel} ease;
`

const PanelHeader = styled.div`
  height: 56px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 ${({ theme }) => theme.spacing.lg};
  flex-shrink: 0;
`

const PanelTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const CloseBtn = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 18px;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.lg};
`

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  padding-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`

const StatusDot = styled.div<{ $status: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${({ $status, theme }) => {
    switch ($status) {
      case 'scheduled': return theme.colors.status.scheduled
      case 'published': return theme.colors.status.published
      case 'failed': return theme.colors.status.failed
      case 'draft': return theme.colors.status.draft
      default: return theme.colors.text.muted
    }
  }};
`

const StatusInfo = styled.div``

const StatusLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-transform: capitalize;
`

const StatusTime = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-top: 2px;
`

const Section = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const SectionTitle = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const SectionValue = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  white-space: pre-wrap;
  word-break: break-word;
`

const ErrorBox = styled.div`
  padding: ${({ theme }) => theme.spacing.md};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.status.failedBg};
  border: 1px solid rgba(244, 67, 54, 0.2);
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.status.failed};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
`

const MediaPreview = styled.div`
  width: 100%;
  height: 120px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg.tertiary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  color: ${({ theme }) => theme.colors.text.muted};
`

const ActionsSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`

const PrimaryAction = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }
`

const SecondaryAction = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

const DangerAction = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid rgba(244, 67, 54, 0.3);
  color: ${({ theme }) => theme.colors.status.failed};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.status.failedBg};
    border-color: ${({ theme }) => theme.colors.status.failed};
  }
`

export default function RightPanel() {
  const { selectedPostId, clearSelectedPost } = useDashboardStore()
  const { data: channels = [] } = useChannels()

  const post = MOCK_POSTS.find((p) => p.id === selectedPostId)
  const channel = channels.find((c) => c.id === post?.channelId)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelectedPost()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [clearSelectedPost])

  if (!post) return null

  const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Scheduled',
    published: 'Published',
    failed: 'Failed',
    draft: 'Draft',
    publishing: 'Publishing',
    cancelled: 'Cancelled',
  }

  return (
    <Panel $open={!!selectedPostId} id="right-panel">
      <PanelHeader>
        <PanelTitle>Post Details</PanelTitle>
        <CloseBtn onClick={clearSelectedPost} id="right-panel-close" title="Close (Esc)">
          ✕
        </CloseBtn>
      </PanelHeader>

      <ScrollArea>
        <StatusSection>
          <StatusDot $status={post.status} />
          <StatusInfo>
            <StatusLabel>{STATUS_LABELS[post.status] ?? post.status}</StatusLabel>
            <StatusTime>{formatPostDate(post)}</StatusTime>
          </StatusInfo>
        </StatusSection>

        <Section>
          <SectionTitle>Content</SectionTitle>
          <SectionValue>{post.content}</SectionValue>
        </Section>

        {post.hasMedia && (
          <Section>
            <SectionTitle>Media</SectionTitle>
            <MediaPreview>{post.mediaType === 'video' ? '🎬' : '🖼️'}</MediaPreview>
          </Section>
        )}

        <Section>
          <SectionTitle>Channel</SectionTitle>
          <SectionValue>{channel?.username ?? '—'}</SectionValue>
        </Section>

        {post.scheduledAt && (
          <Section>
            <SectionTitle>Scheduled For</SectionTitle>
            <SectionValue>{formatPostDate(post)}</SectionValue>
          </Section>
        )}

        {post.publishedAt && (
          <Section>
            <SectionTitle>Published At</SectionTitle>
            <SectionValue>
              {new Date(post.publishedAt).toLocaleString('en-US', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              })}
            </SectionValue>
          </Section>
        )}

        <Section>
          <SectionTitle>Created</SectionTitle>
          <SectionValue>
            {new Date(post.createdAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true
            })}
          </SectionValue>
        </Section>

        {post.errorMessage && (
          <Section>
            <SectionTitle>Error</SectionTitle>
            <ErrorBox>{post.errorMessage}</ErrorBox>
          </Section>
        )}
      </ScrollArea>

      <ActionsSection>
        {post.status === 'scheduled' && (
          <>
            <PrimaryAction id="action-edit">✏️ Edit</PrimaryAction>
            <SecondaryAction id="action-reschedule">📅 Reschedule</SecondaryAction>
            <SecondaryAction id="action-post-now">⚡ Post Now</SecondaryAction>
            <DangerAction id="action-cancel">Cancel Post</DangerAction>
          </>
        )}
        {post.status === 'draft' && (
          <>
            <PrimaryAction id="action-edit">✏️ Edit</PrimaryAction>
            <SecondaryAction id="action-schedule">📅 Schedule</SecondaryAction>
            <SecondaryAction id="action-post-now">⚡ Post Now</SecondaryAction>
            <DangerAction id="action-delete">Delete</DangerAction>
          </>
        )}
        {post.status === 'published' && (
          <>
            <SecondaryAction id="action-duplicate">⎘ Duplicate</SecondaryAction>
            <DangerAction id="action-delete">Delete</DangerAction>
          </>
        )}
        {post.status === 'failed' && (
          <>
            <PrimaryAction id="action-retry">↻ Retry</PrimaryAction>
            <SecondaryAction id="action-reschedule">📅 Reschedule</SecondaryAction>
            <SecondaryAction id="action-edit">✏️ Edit</SecondaryAction>
            <DangerAction id="action-delete">Delete</DangerAction>
          </>
        )}
      </ActionsSection>
    </Panel>
  )
}
