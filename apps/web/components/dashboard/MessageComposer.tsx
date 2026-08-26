'use client'

import React, { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'
import { useCreatePost, usePublishPost } from '@/hooks/usePosts'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`

const ComposerWrapper = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: ${({ theme }) => theme.colors.bg.secondary};
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
`

const ComposerBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const AttachBtn = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 18px;
  flex-shrink: 0;
  transition: color ${({ theme }) => theme.transition.fast},
    background ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

const InputWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  background: ${({ theme }) => theme.colors.bg.input};
  border-radius: ${({ theme }) => theme.radius.full};
  padding: 8px 14px;
  border: 1px solid transparent;
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
`

const TextInput = styled.input`
  flex: 1;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const EmojiBtn = styled.button`
  font-size: 16px;
  opacity: 0.6;
  transition: opacity ${({ theme }) => theme.transition.fast};
  flex-shrink: 0;

  &:hover {
    opacity: 1;
  }
`

const SendBtn = styled.button<{ $hasContent: boolean }>`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: ${({ $hasContent, theme }) =>
    $hasContent ? theme.colors.accent : theme.colors.bg.input};
  color: ${({ $hasContent, theme }) =>
    $hasContent ? '#fff' : theme.colors.text.muted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
  transition: background ${({ theme }) => theme.transition.fast},
    color ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast};

  &:hover {
    ${({ $hasContent, theme }) =>
      $hasContent
        ? `
      background: ${theme.colors.accentHover};
      transform: scale(1.1);
      box-shadow: ${theme.shadow.glow};
    `
        : ''}
  }
`

const ExpandedArea = styled.div`
  animation: ${fadeIn} ${({ theme }) => theme.transition.default} ease;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 80px;
  max-height: 200px;
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  resize: none;
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  font-family: inherit;
  outline: none;
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const FormatTools = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`

const FormatBtn = styled.button`
  padding: 4px 8px;
  border-radius: ${({ theme }) => theme.radius.xs};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`

const SendMenu = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const SendNowBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
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

const ScheduleBtn = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.border.accent : theme.colors.border.default};
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

const ScheduleRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const DateTimeInput = styled.input`
  padding: 8px 12px;
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

const ConfirmScheduleBtn = styled.button<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  opacity: ${({ $disabled }) => ($disabled ? 0.6 : 1)};
  cursor: ${({ $disabled }) => ($disabled ? 'default' : 'pointer')};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.font.size.xs};
`

const HintText = styled.span`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};
`

export default function MessageComposer() {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { selectedChannelId } = useDashboardStore()
  const createPost = useCreatePost()
  const publishPost = usePublishPost()

  const handleFocus = () => setIsExpanded(true)

  const reset = () => {
    setContent('')
    setScheduledAt('')
    setShowSchedulePicker(false)
    setIsExpanded(false)
  }

  const canSend = !!selectedChannelId && content.trim().length > 0 && !createPost.isPending

  // "Send Now": create the post, then immediately publish it.
  const handleSendNow = async () => {
    if (!canSend || !selectedChannelId) return
    try {
      const { post } = await createPost.mutateAsync({
        channelId: selectedChannelId,
        content: content.trim(),
      })
      await publishPost.mutateAsync(post.id)
      reset()
    } catch {
      // error surfaced below from the mutations
    }
  }

  const error =
    createPost.error instanceof Error
      ? createPost.error.message
      : publishPost.error instanceof Error
      ? publishPost.error.message
      : null

  const busy = createPost.isPending || publishPost.isPending

  return (
    <ComposerWrapper>
      {isExpanded ? (
        <>
          <ExpandedArea>
            <TextArea
              ref={textareaRef}
              placeholder={
                selectedChannelId
                  ? 'Write your message...'
                  : 'Connect and select a channel first…'
              }
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
              id="composer-textarea"
            />
            <ToolbarRow>
              <FormatTools>
                <FormatBtn id="format-bold" title="Bold">B</FormatBtn>
                <FormatBtn id="format-italic" title="Italic" style={{ fontStyle: 'italic' }}>I</FormatBtn>
                <FormatBtn id="format-code" title="Code" style={{ fontFamily: 'monospace' }}>{'{}'}</FormatBtn>
                <FormatBtn id="format-link" title="Link">🔗</FormatBtn>
              </FormatTools>
              <SendMenu>
                {!selectedChannelId && (
                  <HintText>Select a channel to post</HintText>
                )}
                {error && <ErrorText>{error}</ErrorText>}
                <ScheduleBtn
                  $active={showSchedulePicker}
                  onClick={() => setShowSchedulePicker((v) => !v)}
                  disabled={!selectedChannelId}
                  id="composer-schedule-btn"
                >
                  📅 Schedule
                </ScheduleBtn>
                <SendNowBtn
                  onClick={handleSendNow}
                  disabled={!canSend}
                  style={{ opacity: canSend ? 1 : 0.5 }}
                  id="composer-send-btn"
                >
                  {busy ? 'Sending…' : '➤ Send Now'}
                </SendNowBtn>
              </SendMenu>
            </ToolbarRow>

            {showSchedulePicker && (
              <ScheduleRow>
                <DateTimeInput
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  id="composer-schedule-input"
                />
                <ConfirmScheduleBtn
                  $disabled={!scheduledAt || busy}
                  onClick={async () => {
                    if (!scheduledAt || !selectedChannelId) return
                    try {
                      await createPost.mutateAsync({
                        channelId: selectedChannelId,
                        content: content.trim(),
                        scheduledAt: new Date(scheduledAt).toISOString(),
                      })
                      reset()
                    } catch {
                      // error surfaced above
                    }
                  }}
                  id="composer-schedule-confirm"
                >
                  Confirm Schedule
                </ConfirmScheduleBtn>
              </ScheduleRow>
            )}
          </ExpandedArea>
        </>
      ) : (
        <ComposerBar>
          <AttachBtn id="composer-attach-btn" title="Attach media">📎</AttachBtn>
          <InputWrapper onClick={handleFocus} id="composer-input-wrapper">
            <TextInput
              placeholder="Write a message..."
              onFocus={handleFocus}
              readOnly
              id="composer-input"
            />
            <EmojiBtn id="composer-emoji-btn">😊</EmojiBtn>
          </InputWrapper>
          <SendBtn $hasContent={false} id="composer-send-collapsed">
            ➤
          </SendBtn>
        </ComposerBar>
      )}
    </ComposerWrapper>
  )
}
