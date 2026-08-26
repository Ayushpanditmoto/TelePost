'use client'

import React, { useState, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { useDashboardStore } from '@/store/dashboardStore'

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

const ScheduleBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
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

export default function MessageComposer() {
  const [content, setContent] = useState('')
  const [isExpanded, setIsExpanded] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { setScheduleDialogOpen } = useDashboardStore()

  const handleFocus = () => setIsExpanded(true)

  const handleScheduleClick = () => {
    setScheduleDialogOpen(true)
  }

  return (
    <ComposerWrapper>
      {isExpanded ? (
        <>
          <ExpandedArea>
            <TextArea
              ref={textareaRef}
              placeholder="Write your message..."
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
                <ScheduleBtn onClick={handleScheduleClick} id="composer-schedule-btn">
                  📅 Schedule
                </ScheduleBtn>
                <SendNowBtn id="composer-send-btn">
                  ➤ Send Now
                </SendNowBtn>
              </SendMenu>
            </ToolbarRow>
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
