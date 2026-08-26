'use client'

import React, { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'
import {
  useCreatePost,
  useEditPost,
  usePublishPost,
  useUploadMedia,
} from '@/hooks/usePosts'

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

const MediaChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: ${({ theme }) => theme.spacing.sm};
  padding: 6px 10px;
  background: ${({ theme }) => theme.colors.bg.tertiary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.sm};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const RemoveMediaBtn = styled.button`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};
  padding: 0 2px;
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.danger};
  }
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

const RepeatRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  margin-top: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const RepeatLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  margin-right: ${({ theme }) => theme.spacing.xs};
`

const ModeChip = styled.button<{ $active?: boolean }>`
  padding: 4px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.border.accent : theme.colors.border.default};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentMuted : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const DayChip = styled.button<{ $active?: boolean }>`
  width: 44px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid
    ${({ $active, theme }) =>
      $active ? theme.colors.border.accent : theme.colors.border.default};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentMuted : 'transparent'};
  color: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const RecurrenceHint = styled.span`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};

  b {
    color: ${({ theme }) => theme.colors.text.primary};
  }
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

const EditBar = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  flex-wrap: wrap;
`

const EditBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const EditHint = styled.span`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.xs};
`

const DiscardBtn = styled.button`
  display: flex;
  align-items: center;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  background: transparent;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`

type RepeatMode = 'none' | 'daily' | 'weekly'

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Recurrence guardrails: cap both the series length and how far ahead it goes.
const RECURRENCE_MAX_POSTS = 30
const RECURRENCE_HORIZON_DAYS = 42

// Format a Date for <input type="datetime-local"> in the user's local time.
function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  )
}

// Concrete upcoming instants for the chosen repeat rule. Occurrences are
// generated on this device so every post fires at the picked wall-clock time
// in the user's own timezone.
function buildOccurrences(
  startStr: string,
  mode: RepeatMode,
  days: number[]
): string[] {
  if (mode === 'none') return []
  if (mode === 'weekly' && days.length === 0) return []

  const start = new Date(startStr)
  if (Number.isNaN(start.getTime())) return []

  const wanted = new Set(days)
  const out: string[] = []
  for (
    let offset = 0;
    offset <= RECURRENCE_HORIZON_DAYS && out.length < RECURRENCE_MAX_POSTS;
    offset++
  ) {
    // Calendar-day stepping preserves the picked clock time across DST shifts.
    const d = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + offset,
      start.getHours(),
      start.getMinutes()
    )
    const hitsDay = mode === 'daily' || wanted.has(d.getDay())
    if (hitsDay && d.getTime() > Date.now()) out.push(d.toISOString())
  }
  return out
}

export default function MessageComposer() {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSchedulePicker, setShowSchedulePicker] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('none')
  const [repeatDays, setRepeatDays] = useState<number[]>([])
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [localError, setLocalError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { selectedChannelId, editingPost, setEditingPost } = useDashboardStore()
  const createPost = useCreatePost()
  const publishPost = usePublishPost()
  const uploadMedia = useUploadMedia()
  const editPost = useEditPost()

  const MAX_MEDIA_BYTES = 50 * 1024 * 1024

  const handleFocus = () => setIsExpanded(true)

  // Tracks which editing snapshot was last loaded into the composer.
  const [loadedEditingPost, setLoadedEditingPost] =
    useState<typeof editingPost>(null)

  // Load the post being edited into the composer (snapshot replaces wholesale).
  // State is adjusted during render instead of inside an effect, so React
  // applies these updates immediately before committing — no cascading renders.
  if (editingPost && loadedEditingPost !== editingPost) {
    setLoadedEditingPost(editingPost)
    setContent(editingPost.content)
    setShowSchedulePicker(false)
    setIsExpanded(true)
  }

  const reset = () => {
    setContent('')
    setScheduledAt('')
    setRepeatMode('none')
    setRepeatDays([])
    setMediaFile(null)
    setShowSchedulePicker(false)
    setIsExpanded(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const pickMedia = (file: File | undefined) => {
    setLocalError(null)
    if (!file) return
    if (!/^(image|video)\//.test(file.type)) {
      setLocalError('Only images and videos are supported')
      return
    }
    if (file.size > MAX_MEDIA_BYTES) {
      setLocalError('File exceeds the 50 MB limit')
      return
    }
    setMediaFile(file)
  }

  const canSend =
    !!selectedChannelId &&
    content.trim().length > 0 &&
    !createPost.isPending &&
    !uploadMedia.isPending &&
    !publishPost.isPending

  // Create → (attach media to every occurrence) → publish / leave scheduled.
  const submit = async (scheduleIso: string | null) => {
    if (!canSend || !selectedChannelId || editingPost) return
    try {
      const useSeries = !!scheduleIso && occurrences.length > 0
      const { post, posts: created } = await createPost.mutateAsync({
        channelId: selectedChannelId,
        content: content.trim(),
        scheduledAt: scheduleIso,
        ...(useSeries ? { occurrences } : {}),
      })
      if (mediaFile) {
        const targetIds = created?.length ? created.map((p) => p.id) : [post.id]
        for (const id of targetIds) {
          await uploadMedia.mutateAsync({ postId: id, file: mediaFile })
        }
      }
      if (!scheduleIso) {
        await publishPost.mutateAsync(post.id)
      }
      reset()
    } catch {
      // errors surfaced below from the mutations
    }
  }

  const handleSendNow = () => submit(null)

  const canSaveEdit =
    !!editingPost && content.trim().length > 0 && !editPost.isPending

  // Save content edits back to TelePost's database — Telegram is never touched.
  const handleSaveEdit = async () => {
    if (!canSaveEdit || !editingPost) return
    try {
      await editPost.mutateAsync({
        id: editingPost.id,
        content: content.trim(),
      })
      setEditingPost(null)
      reset()
    } catch {
      // errors surfaced below from the mutations
    }
  }

  const handleDiscardEdit = () => {
    setEditingPost(null)
    reset()
  }

  const error =
    localError ??
    (editPost.error instanceof Error
      ? editPost.error.message
      : createPost.error instanceof Error
        ? createPost.error.message
        : uploadMedia.error instanceof Error
          ? uploadMedia.error.message
          : publishPost.error instanceof Error
            ? publishPost.error.message
            : null)

  const busy =
    createPost.isPending || uploadMedia.isPending || publishPost.isPending

  // Concrete occurrences for the picked repeat rule (empty → single post).
  const occurrences =
    repeatMode !== 'none'
      ? buildOccurrences(scheduledAt, repeatMode, repeatDays)
      : []
  const recurrenceSpanDays =
    occurrences.length > 1
      ? Math.round(
          (Date.parse(occurrences[occurrences.length - 1]) -
            Date.parse(occurrences[0])) /
            86_400_000
        )
      : 0

  const canConfirmSchedule =
    !!scheduledAt &&
    !busy &&
    (repeatMode === 'none' || occurrences.length > 0)

  // ─── Edit mode: update an existing draft/scheduled/failed post ──────────────
  if (editingPost) {
    return (
      <ComposerWrapper>
        <ExpandedArea>
          <EditBar id="composer-edit-bar">
            <EditBadge>✏️ Editing</EditBadge>
            <EditHint>
              Saves to TelePost only — messages live on Telegram aren&apos;t touched
            </EditHint>
          </EditBar>
          <TextArea
            ref={textareaRef}
            placeholder="Update your message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            id="composer-edit-textarea"
          />
          <ToolbarRow>
            <span />
            <SendMenu>
              {error && <ErrorText>{error}</ErrorText>}
              <DiscardBtn
                onClick={handleDiscardEdit}
                disabled={editPost.isPending}
                id="composer-edit-discard"
              >
                Discard
              </DiscardBtn>
              <SendNowBtn
                onClick={handleSaveEdit}
                disabled={!canSaveEdit}
                style={{ opacity: canSaveEdit ? 1 : 0.5 }}
                id="composer-edit-save"
              >
                {editPost.isPending ? 'Saving…' : '💾 Save Changes'}
              </SendNowBtn>
            </SendMenu>
          </ToolbarRow>
        </ExpandedArea>
      </ComposerWrapper>
    )
  }

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
            {mediaFile && (
              <MediaChip>
                {mediaFile.type.startsWith('video/') ? '🎬' : '🖼️'}{' '}
                {mediaFile.name.length > 28
                  ? mediaFile.name.slice(0, 25) + '…'
                  : mediaFile.name}{' '}
                ({Math.max(1, Math.round(mediaFile.size / 1024))} KB)
                <RemoveMediaBtn
                  onClick={() => setMediaFile(null)}
                  title="Remove attachment"
                >
                  ✕
                </RemoveMediaBtn>
              </MediaChip>
            )}
            <ToolbarRow>
              <FormatTools>
                <AttachBtn
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach image or video"
                  id="composer-attach-btn"
                >
                  📎
                </AttachBtn>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => pickMedia(e.target.files?.[0])}
                />
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
                  onClick={() => {
                    // Opening the picker defaults to the current date & time.
                    if (!showSchedulePicker && !scheduledAt) {
                      setScheduledAt(toLocalInputValue(new Date()))
                    }
                    setShowSchedulePicker((v) => !v)
                  }}
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
              <>
                <ScheduleRow>
                  <DateTimeInput
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    id="composer-schedule-input"
                  />
                  <ConfirmScheduleBtn
                    $disabled={!canConfirmSchedule}
                    onClick={() => {
                      if (!scheduledAt) return
                      void submit(new Date(scheduledAt).toISOString())
                    }}
                    id="composer-schedule-confirm"
                  >
                    Confirm Schedule
                  </ConfirmScheduleBtn>
                </ScheduleRow>

                <RepeatRow>
                  <RepeatLabel>🔁 Repeat</RepeatLabel>
                  <ModeChip
                    $active={repeatMode === 'none'}
                    onClick={() => setRepeatMode('none')}
                    id="repeat-off-btn"
                  >
                    Off
                  </ModeChip>
                  <ModeChip
                    $active={repeatMode === 'daily'}
                    onClick={() => setRepeatMode('daily')}
                    id="repeat-daily-btn"
                  >
                    Daily
                  </ModeChip>
                  <ModeChip
                    $active={repeatMode === 'weekly'}
                    onClick={() => setRepeatMode('weekly')}
                    id="repeat-custom-btn"
                  >
                    Custom days
                  </ModeChip>
                </RepeatRow>

                {repeatMode === 'weekly' && (
                  <RepeatRow>
                    {WEEKDAY_LABELS.map((label, day) => (
                      <DayChip
                        key={label}
                        $active={repeatDays.includes(day)}
                        onClick={() =>
                          setRepeatDays((prev) =>
                            prev.includes(day)
                              ? prev.filter((d) => d !== day)
                              : [...prev, day].sort((a, b) => a - b)
                          )
                        }
                        title={label}
                      >
                        {label}
                      </DayChip>
                    ))}
                  </RepeatRow>
                )}

                {repeatMode !== 'none' && (
                  <RepeatRow>
                    {occurrences.length > 0 ? (
                      <RecurrenceHint>
                        Creates{' '}
                        <b>{occurrences.length}</b>{' '}
                        {occurrences.length === 1 ? 'post' : 'posts'}
                        {recurrenceSpanDays > 0
                          ? ` over the next ${recurrenceSpanDays} days`
                          : ''}{' '}
                        — perfect for consistent routines &amp; announcements.
                      </RecurrenceHint>
                    ) : (
                      <RecurrenceHint>
                        Choose an upcoming time
                        {repeatMode === 'weekly' ? ' on the selected days' : ''}.
                      </RecurrenceHint>
                    )}
                  </RepeatRow>
                )}
              </>
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
