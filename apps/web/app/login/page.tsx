'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import AuthGuard from '@/components/auth/AuthGuard'
import TelegramLoginButton from '@/components/auth/TelegramLoginButton'
import { api } from '@/lib/api'

// Dev login is only offered when the worker runs with ENVIRONMENT=development
// (the endpoint refuses otherwise) and no real bot is configured.
const DEV_LOGIN_ENABLED = process.env.NEXT_PUBLIC_DEV_LOGIN === 'true'

const Page = styled.main`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing.xl};
`

const Card = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const LogoIcon = styled.span`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(135deg, #2196f3, #1565c0);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  text-align: center;
  line-height: 1.5;
`

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
`

const DevForm = styled.form`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`

const DevInput = styled.input`
  width: 100%;
  padding: 10px 14px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg.input};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const DevButton = styled.button`
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px dashed ${({ theme }) => theme.colors.border.accent};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};

  &:hover {
    background: ${({ theme }) => theme.colors.accentMuted};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.status.failed};
  font-size: ${({ theme }) => theme.font.size.xs};
`

export default function LoginPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [devUsername, setDevUsername] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const devLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await api('/api/auth/dev', {
        method: 'POST',
        body: JSON.stringify({ username: devUsername || undefined }),
      })
      await queryClient.invalidateQueries({ queryKey: ['me'] })
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthGuard>
      <Page>
        <Card>
          <Logo href="/">
            <LogoIcon>✈</LogoIcon>
            TelePost
          </Logo>
          <Title>Log in to TelePost</Title>
          <Subtitle>
            Sign in with Telegram to schedule posts for your channels. No bot
            setup needed — just add <b>@Panditfxbot</b> as an admin.
          </Subtitle>

          <TelegramLoginButton />

          {DEV_LOGIN_ENABLED && (
            <>
              <Divider />
              <DevForm onSubmit={devLogin}>
                <DevInput
                  placeholder="Dev username (optional)"
                  value={devUsername}
                  onChange={(e) => setDevUsername(e.target.value)}
                  aria-label="Dev username"
                />
                <DevButton type="submit" disabled={busy} id="dev-login-btn">
                  {busy ? 'Signing in…' : '🛠 Dev login (local only)'}
                </DevButton>
                {error && <ErrorText>{error}</ErrorText>}
              </DevForm>
            </>
          )}
        </Card>
      </Page>
    </AuthGuard>
  )
}
