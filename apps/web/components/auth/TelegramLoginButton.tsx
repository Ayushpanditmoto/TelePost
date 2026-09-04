'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { api, API_URL } from '@/lib/api'

// Bot username from BotFather (set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME).
const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'Panditfxbot'

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const TelegramBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 10px 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: #0088cc;
  color: #fff;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
  &:hover { background: #006fa3; }
  &:disabled { opacity: 0.6; cursor: waiting; }
`

const Spinner = styled.div`
  width: 16px; height: 16px;
  border: 2px solid rgba(255,255,255,0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`

const Hint = styled.p`
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 13px;
  text-align: center;
  max-width: 320px;
  line-height: 1.4;
`

export default function TelegramLoginButton() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStart = async () => {
    setBusy(true)
    setError(null)
    try {
      // 1) Ask the API for a one-time nonce + the bot deep-link.
      const { startLink, nonceId } = (await api('/api/auth/telegram/start', {
        method: 'POST',
      })) as { startLink: string; nonceId: string }

      // 2) Open @Panditfxbot in a popup so the user clicks "Start".
      //    (Desktop: new window; mobile: user stays in Telegram.)
      window.open(startLink, 'telegram_login', 'width=420,height=600')

      // 3) Poll until the bot sees /start and issues the session.
      const interval = setInterval(async () => {
        try {
          const res = await fetch(
            `${API_URL}/api/auth/telegram/start/status?nonce_id=${nonceId}`,
            { method: 'GET', credentials: 'include' }
          )
          if (res.ok) {
            clearInterval(interval)
            // The status response sets the session cookie. Read the session
            // back before navigating so the dashboard guard cannot see the
            // previous cached logged-out state during the route transition.
            const { user } = await api<{ user: import('@/lib/api').SessionUser }>(
              '/api/auth/me'
            )
            queryClient.setQueryData(['me'], { user })
            setBusy(false)
            router.push('/dashboard')
          } else if (res.status === 404) {
            clearInterval(interval)
            setBusy(false)
            setError('Login session expired — try again.')
          } else if (res.status === 410) {
            clearInterval(interval)
            setBusy(false)
            setError('This login session was already used — try again.')
          }
          // 202 pending → keep polling.
        } catch {
          clearInterval(interval)
          setBusy(false)
          setError('Couldn’t reach the server.')
        }
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setBusy(false)
    }
  }

  const devMode = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true'

  return (
    <Wrap>
      <TelegramBtn onClick={handleStart} disabled={busy}>
        {busy ? <Spinner /> : '👆'}  {devMode ? 'Start Bot to Log In (dev)' : 'Log in with Telegram'}
      </TelegramBtn>
      {error && <Hint style={{ color: '#ef4444' }}>{error}</Hint>}
      {!devMode && !BOT_USERNAME && (
        <Hint>Telegram login is not configured — set NEXT_PUBLIC_TELEGRAM_BOT_USERNAME in your env.</Hint>
      )}
    </Wrap>
  )
}

