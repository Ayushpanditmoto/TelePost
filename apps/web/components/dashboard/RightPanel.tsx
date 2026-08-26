'use client'

import React, { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { useQuery } from '@tanstack/react-query'
import { useDashboardStore } from '@/store/dashboardStore'
import { api } from '@/lib/api'
import { dbDate, formatPostDate } from '@/lib/mockData'
import { useChannels } from '@/hooks/useChannels'
import {
  type Post,
  useCancelPost,
  useDeletePost,
  usePublishPost,
  useReschedulePost,
} from '@/hooks/usePosts'

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

const RescheduleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const RescheduleInput = styled.input`
  flex: 1;
  padding: 8px 10px;
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  outline: none;
  color-scheme: dark;

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
`

const ActionsSection = styled.div`
  padding: ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  flex-shrink: 0;
`

const PrimaryAction = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.fast};

  &:disabled {
    opacity: 0.6;
    cursor: default;
  }

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }
`

const SecondaryAction = styled.button<{ $disabled?: boolean }>`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &:hover:not(:disabled) {
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

// ─── Shimmer skeleton (post details initial fetch) ───────────────────────────
const shimmerSweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`

const skeletonIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
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

const DotBone = styled(Bone)`
  && {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }
`

const SkelRow = styled.div<{ $delay?: string; $spread?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: ${({ $spread }) => ($spread ? 'space-between' : 'flex-start')};
  width: 100%;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: ${skeletonIn} ${({ theme }) => theme.transition.default} ease
    ${({ $delay }) => $delay ?? '0s'} both;
`

const SkelStack = styled.div<{ $delay?: string }>`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: ${skeletonIn} ${({ theme }) => theme.transition.default} ease
    ${({ $delay }) => $delay ?? '0s'} both;
`

const SkelCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`

// Mirrors the real details layout: status header, labelled meta sections and
// the action buttons, so nothing shifts once data arrives.
function DetailsSkeleton() {
  return (
    <div id="details-skeleton">
      <SkelRow $delay="0s">
        <DotBone />
        <SkelCol>
          <Bone $w="96px" $h="13px" />
          <Bone $w="150px" $h="10px" />
        </SkelCol>
      </SkelRow>

      <SkelStack $delay="0.08s">
        <Bone $w="74px" $h="9px" $round="5px" />
        <Bone />
        <Bone $w="62%" />
      </SkelStack>

      <SkelStack $delay="0.16s">
        <Bone $w="62px" $h="9px" $round="5px" />
        <Bone $w="132px" $h="13px" />
      </SkelStack>

      <SkelStack $delay="0.24s">
        <Bone $w="92px" $h="9px" $round="5px" />
        <Bone $w="164px" $h="13px" />
      </SkelStack>

      <SkelStack $delay="0.32s">
        <Bone $w="58px" $h="9px" $round="5px" />
        <Bone $w="152px" $h="13px" />
      </SkelStack>

      <SkelRow $delay="0.4s" $spread>
        <Bone $w="112px" $h="36px" $round="9999px" />
        <Bone $w="84px" $h="36px" $round="9999px" />
      </SkelRow>
    </div>
  )
}

export default function RightPanel() {
  const { selectedPostId, setSelectedPostId, clearSelectedPost, setEditingPost } =
    useDashboardStore()
  const { data: channels = [] } = useChannels()
  const publishPost = usePublishPost()
  const cancelPost = useCancelPost()
  const deletePost = useDeletePost()
  const reschedulePost = useReschedulePost()
  const [showReschedule, setShowReschedule] = useState(false)
  const [newTime, setNewTime] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Fetch the selected post fresh from the API.
  const {
    data: post,
    isLoading,
    isError,
  } = useQuery<Post>({
    queryKey: ['post', selectedPostId],
    queryFn: async () => {
      const data = await api<{ post: Post }>(`/api/posts/${selectedPostId}`)
      return data.post
    },
    enabled: !!selectedPostId,
  })

  const channel = channels.find((c) => c.id === post?.channelId)

  // Drafts/scheduled/failed posts are editable; published ones stay frozen —
  // their live Telegram message is intentionally never touched.
  const canEditContent =
    !!post &&
    (post.status === 'draft' ||
      post.status === 'scheduled' ||
      post.status === 'failed')

  const startEditing = () => {
    if (!post) return
    setEditingPost({ id: post.id, channelId: post.channelId, content: post.content })
    setSelectedPostId(null) // close the details panel; the composer takes over
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelectedPost()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [clearSelectedPost])

  if (!selectedPostId) return null
  if (isError) {
    return (
      <Panel $open id="right-panel">
        <PanelHeader>
          <PanelTitle>Post Details</PanelTitle>
          <CloseBtn onClick={clearSelectedPost} title="Close (Esc)">✕</CloseBtn>
        </PanelHeader>
        <ScrollArea>
          <SectionValue>Could not load this post.</SectionValue>
        </ScrollArea>
      </Panel>
    )
  }

  // Fresh fetch (or cache miss): show shimmer bones shaped like the details view.
  if (isLoading || !post) {
    return (
      <Panel $open id="right-panel">
        <PanelHeader>
          <PanelTitle>Post Details</PanelTitle>
          <CloseBtn onClick={clearSelectedPost} id="right-panel-close" title="Close (Esc)">
            ✕
          </CloseBtn>
        </PanelHeader>
        <ScrollArea>
          <DetailsSkeleton />
        </ScrollArea>
      </Panel>
    )
  }

  const runAction = async (fn: () => Promise<unknown>) => {
    setActionError(null)
    try {
      await fn()
      if (deletePost.isSuccess) setSelectedPostId(null)
      setShowReschedule(false)
      setNewTime('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Action failed')
    }
  }

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

        <Section>
          <SectionTitle>Channel</SectionTitle>
          <SectionValue>
            {channel
              ? channel.username
                ? `@${channel.username}`
                : channel.title
              : '—'}
          </SectionValue>
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
              {dbDate(post.publishedAt)?.toLocaleString('en-US', {
                month: 'short', day: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              }) ?? '—'}
            </SectionValue>
          </Section>
        )}

        <Section>
          <SectionTitle>Created</SectionTitle>
          <SectionValue>
            {dbDate(post.createdAt)?.toLocaleString('en-US', {
              month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true
            }) ?? '—'}
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
        {actionError && (
          <Section>
            <ErrorBox>{actionError}</ErrorBox>
          </Section>
        )}
        {showReschedule && (
          <Section>
            <SectionTitle>New time</SectionTitle>
            <RescheduleRow>
              <RescheduleInput
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
              <SecondaryAction
                onClick={() =>
                  newTime &&
                  runAction(() =>
                    reschedulePost.mutateAsync({
                      id: post.id,
                      scheduledAt: new Date(newTime).toISOString(),
                    })
                  )
                }
                disabled={reschedulePost.isPending || !newTime}
              >
                Save
              </SecondaryAction>
            </RescheduleRow>
          </Section>
        )}
        {post.status === 'scheduled' && (
          <>
            {canEditContent && (
              <SecondaryAction id="action-edit" onClick={startEditing}>
                ✏️ Edit
              </SecondaryAction>
            )}
            <SecondaryAction
              id="action-reschedule"
              onClick={() => setShowReschedule((v) => !v)}
            >
              📅 Reschedule
            </SecondaryAction>
            <PrimaryAction
              id="action-post-now"
              onClick={() => runAction(() => publishPost.mutateAsync(post.id))}
              disabled={publishPost.isPending}
            >
              ⚡ Post Now
            </PrimaryAction>
            <DangerAction
              id="action-cancel"
              onClick={() => runAction(() => cancelPost.mutateAsync(post.id))}
              disabled={cancelPost.isPending}
            >
              Cancel Post
            </DangerAction>
            {post.seriesId && (
              <DangerAction
                id="action-stop-series"
                onClick={() =>
                  runAction(() =>
                    deletePost.mutateAsync({ id: post.id, scope: 'series' })
                  )
                }
                disabled={deletePost.isPending}
              >
                🔁 Stop Repeats
              </DangerAction>
            )}
            <DangerAction
              id="action-delete"
              onClick={() => runAction(() => deletePost.mutateAsync({ id: post.id }))}
              disabled={deletePost.isPending}
            >
              🗑 Delete
            </DangerAction>
          </>
        )}
        {post.status === 'draft' && (
          <>
            {canEditContent && (
              <SecondaryAction id="action-edit" onClick={startEditing}>
                ✏️ Edit
              </SecondaryAction>
            )}
            <PrimaryAction
              id="action-post-now"
              onClick={() => runAction(() => publishPost.mutateAsync(post.id))}
              disabled={publishPost.isPending}
            >
              ⚡ Post Now
            </PrimaryAction>
            <DangerAction
              id="action-delete"
              onClick={() => runAction(() => deletePost.mutateAsync({ id: post.id }))}
              disabled={deletePost.isPending}
            >
              🗑 Delete
            </DangerAction>
          </>
        )}
        {post.status === 'cancelled' && (
          <DangerAction
            id="action-delete"
            onClick={() => runAction(() => deletePost.mutateAsync({ id: post.id }))}
            disabled={deletePost.isPending}
          >
            🗑 Delete
          </DangerAction>
        )}
        {post.status === 'published' && (
          <DangerAction
            id="action-delete"
            onClick={() => runAction(() => deletePost.mutateAsync({ id: post.id }))}
            disabled={deletePost.isPending}
          >
            {deletePost.isPending ? 'Deleting…' : '🗑 Delete'}
          </DangerAction>
        )}
        {post.status === 'failed' && (
          <>
            {canEditContent && (
              <SecondaryAction id="action-edit" onClick={startEditing}>
                ✏️ Edit
              </SecondaryAction>
            )}
            <PrimaryAction
              id="action-retry"
              onClick={() => runAction(() => publishPost.mutateAsync(post.id))}
              disabled={publishPost.isPending}
            >
              ↻ Retry
            </PrimaryAction>
            <SecondaryAction
              id="action-reschedule"
              onClick={() => setShowReschedule((v) => !v)}
            >
              📅 Reschedule
            </SecondaryAction>
            <DangerAction
              id="action-cancel"
              onClick={() => runAction(() => cancelPost.mutateAsync(post.id))}
              disabled={cancelPost.isPending}
            >
              Cancel Post
            </DangerAction>
          </>
        )}
      </ActionsSection>
    </Panel>
  )
}
