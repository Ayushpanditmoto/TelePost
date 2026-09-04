'use client'

import styled from 'styled-components'
import { useRouter } from 'next/navigation'
import { Settings as SettingsIcon } from 'lucide-react'
import { useMe, useLogout } from '@/hooks/useAuth'
import { useChannels, useRemoveChannel, useVerifyChannel } from '@/hooks/useChannels'
import ViewHeader from '@/components/dashboard/ViewHeader'

const Page = styled.main`
  min-height: 100%;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing['2xl']} clamp(20px, 4vw, 64px);
`

const Inner = styled.div`
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const Card = styled.section`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
`

const CardTitle = styled.h2`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  }
`

const Label = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const Value = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
`

const ChannelRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  }
`

const ChannelName = styled.span`
  flex: 1;
  min-width: 0;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Pill = styled.span<{ $verified: boolean }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  color: ${({ $verified, theme }) =>
    $verified ? theme.colors.status.published : theme.colors.status.scheduled};
  background: ${({ $verified, theme }) =>
    $verified
      ? theme.colors.status.publishedBg
      : theme.colors.status.scheduledBg};
`

const SmallBtn = styled.button<{ $danger?: boolean }>`
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $danger, theme }) =>
      $danger ? 'rgba(244,67,54,0.4)' : theme.colors.border.default};
  color: ${({ $danger, theme }) =>
    $danger ? theme.colors.status.failed : theme.colors.text.secondary};
  background: transparent;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:disabled {
    opacity: 0.5;
  }

  &:hover:not(:disabled) {
    border-color: ${({ $danger, theme }) =>
      $danger ? theme.colors.danger : theme.colors.border.accent};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.danger};
  font-size: ${({ theme }) => theme.font.size.xs};
`

const LogoutButton = styled.button`
  width: 100%;
  padding: 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid rgba(244, 67, 54, 0.4);
  color: ${({ theme }) => theme.colors.status.failed};
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.status.failedBg};
  }
`

export default function SettingsPage() {
  const router = useRouter()
  const { data: me } = useMe()
  const user = me?.user ?? null
  const { data: channels = [] } = useChannels()
  const logout = useLogout()
  const removeChannel = useRemoveChannel()
  const verifyChannel = useVerifyChannel()

  return (
    <Page>
      <Inner>
        <ViewHeader
          icon={SettingsIcon}
          eyebrow="Workspace preferences"
          title="Settings"
          subtitle="Manage your account, connected channels, and publishing access."
        />

        <Card>
          <CardTitle>Account</CardTitle>
          <Row>
            <Label>Name</Label>
            <Value>{user?.displayName ?? '—'}</Value>
          </Row>
          <Row>
            <Label>Telegram</Label>
            <Value>{user?.username ? `@${user.username}` : '—'}</Value>
          </Row>
          <Row>
            <Label>Publishing bot</Label>
            <Value>@Panditfxbot</Value>
          </Row>
          <Row>
            <Label>Pricing</Label>
            <Value>Free forever</Value>
          </Row>
        </Card>

        <Card>
          <CardTitle>Connected channels</CardTitle>
          {channels.length === 0 ? (
            <EmptyText>No channels connected yet.</EmptyText>
          ) : (
            channels.map((ch) => (
              <ChannelRow key={ch.id}>
                <ChannelName>
                  {ch.username ? `@${ch.username}` : ch.title}
                </ChannelName>
                <Pill $verified={ch.verified}>
                  {ch.verified ? 'verified' : 'unverified'}
                </Pill>
                {!ch.verified && (
                  <SmallBtn
                    onClick={() =>
                      verifyChannel.mutate(ch.id, {
                        onError: (e) =>
                          window.alert(
                            e instanceof Error ? e.message : 'Verify failed'
                          ),
                      })
                    }
                    disabled={verifyChannel.isPending}
                  >
                    Send test
                  </SmallBtn>
                )}
                <SmallBtn
                  $danger
                  disabled={removeChannel.isPending}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Disconnect ${ch.username ? `@${ch.username}` : ch.title}?`
                      )
                    ) {
                      removeChannel.mutate(ch.id)
                    }
                  }}
                >
                  Disconnect
                </SmallBtn>
              </ChannelRow>
            ))
          )}
          {removeChannel.error instanceof Error && (
            <ErrorText>{removeChannel.error.message}</ErrorText>
          )}
        </Card>

        <Card>
          <CardTitle>Session</CardTitle>
          <LogoutButton
            onClick={async () => {
              await logout()
              router.replace('/login')
            }}
          >
            Log out
          </LogoutButton>
        </Card>
      </Inner>
    </Page>
  )
}