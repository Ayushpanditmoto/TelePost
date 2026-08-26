'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import { useConnectChannel } from '@/hooks/useChannels'

const PLATFORM_BOT = '@Panditfxbot'

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${({ theme }) => theme.colors.bg.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: ${({ theme }) => theme.spacing.lg};
`

const Dialog = styled.div`
  width: 100%;
  max-width: 440px;
  background: ${({ theme }) => theme.colors.bg.modal};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  box-shadow: ${({ theme }) => theme.shadow.lg};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Steps = styled.ol`
  margin: 0 0 ${({ theme }) => theme.spacing.lg};
  padding-left: ${({ theme }) => theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
`

const BotName = styled.span`
  color: ${({ theme }) => theme.colors.accent};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
`

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  outline: none;
  transition: border-color ${({ theme }) => theme.transition.fast};
  margin-bottom: ${({ theme }) => theme.spacing.sm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
`

const Error = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.font.size.xs};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.md};
`

const CancelBtn = styled.button`
  padding: 8px 16px;
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
  }
`

const ConnectBtn = styled.button<{ $disabled: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
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

interface Props {
  open: boolean
  onClose: () => void
}

export default function AddChannelDialog({ open, onClose }: Props) {
  const [chatId, setChatId] = useState('')
  const connect = useConnectChannel()

  if (!open) return null

  const handleSubmit = async () => {
    if (!chatId.trim() || connect.isPending) return
    try {
      await connect.mutateAsync(chatId.trim())
      onClose()
      setChatId('')
    } catch {
      // error shown below
    }
  }

  return (
    <Overlay onClick={() => !connect.isPending && onClose()}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Title>Connect a channel</Title>
        <Subtitle>
          <BotName>{PLATFORM_BOT}</BotName> publishes to your channel — you
          don&apos;t need your own bot.
        </Subtitle>

        <Steps>
          <li>
            Open Telegram → your channel → <b>Manage Channel</b>.
          </li>
          <li>
            Go to <b>Administrators</b> → <b>Add Admin</b> → search for{' '}
            <BotName>{PLATFORM_BOT}</BotName> and add it as an admin.
          </li>
          <li>
            Paste your channel&apos;s <b>@username</b> below.
          </li>
        </Steps>

        <Input
          placeholder="@mychannel"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          id="channel-chat-id-input"
        />

        {connect.isError && (
          <Error>
            {connect.error instanceof Error
              ? connect.error.message
              : 'Could not connect channel'}
          </Error>
        )}

        <Actions>
          <CancelBtn onClick={onClose} disabled={connect.isPending}>
            Cancel
          </CancelBtn>
          <ConnectBtn
            $disabled={!chatId.trim() || connect.isPending}
            onClick={handleSubmit}
            id="channel-connect-btn"
          >
            {connect.isPending && <Spinner />}
            {connect.isPending ? 'Connecting…' : 'Connect Channel'}
          </ConnectBtn>
        </Actions>
      </Dialog>
    </Overlay>
  )
}
const Spinner = styled.div`
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`