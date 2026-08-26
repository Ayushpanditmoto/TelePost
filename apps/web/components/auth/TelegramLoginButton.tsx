'use client'

import React, { useCallback, useEffect, useRef } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// Bot username from BotFather (set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME).
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

interface TelegramLoginResponse {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    OnTelegramAuth?: (user: TelegramLoginResponse) => void
  }
}

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const WidgetSlot = styled.div`
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
`

export default function TelegramLoginButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const slotRef = useRef<HTMLDivElement>(null)

  const handleAuth = useCallback(
    async (fields: Record<string, unknown>) => {
      await api('/api/auth/telegram', {
        method: 'POST',
        body: JSON.stringify(fields),
      })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/dashboard')
    },
    [queryClient, router]
  )

  useEffect(() => {
    if (!BOT_USERNAME) return
    window.OnTelegramAuth = (user) => {
      void handleAuth(user as unknown as Record<string, unknown>)
    }

    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.async = true
    script.setAttribute('data-telegram-login', BOT_USERNAME)
    script.setAttribute('data-size', 'large')
    script.setAttribute('data-radius', '8')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-request-access', 'write')
    script.setAttribute('data-onauth', 'OnTelegramAuth(user)')
    slotRef.current?.appendChild(script)

    return () => {
      delete window.OnTelegramAuth
    }
  }, [handleAuth])

  const devMode = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true'

  return (
    <Wrap>
      {BOT_USERNAME ? (
        <WidgetSlot ref={slotRef} id="telegram-widget-slot" />
      ) : devMode ? (
        <p style={{ color: '#708499', fontSize: 12 }}>
          Real Telegram login needs a deployed domain (BotFather /setdomain) —
          use local Dev Login below.
        </p>
      ) : (
        <p style={{ color: '#a8b8c8', fontSize: 13 }}>
          Telegram login is not configured — set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.
        </p>
      )}
    </Wrap>
  )
}
