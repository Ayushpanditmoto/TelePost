'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMe, useLogout } from '@/hooks/useAuth'
import { useChannels, useRemoveChannel, useVerifyChannel } from '@/hooks/useChannels'
import {
  usePaymentConfig,
  useMyPayments,
  useRequestPayment,
  useCancelPayment,
  usePublicPlans,
  type PaymentConfig,
} from '@/hooks/usePayments'

const Page = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing['2xl']};
`

const Inner = styled.div`
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const BackLink = styled(Link)`
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  text-decoration: none;
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Title = styled.h1`
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const Card = styled.section`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
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
        <TopBar>
          <BackLink href="/dashboard">← Back to dashboard</BackLink>
        </TopBar>
        <Title>Settings</Title>

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
            <Label>Plan</Label>
            <Value>{me?.plan?.name ?? 'Free'}</Value>
          </Row>
        </Card>

        <PlanAndBilling />

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

// ─── Plan & Billing (manual QR payment) ──────────────────────────────────────

function PlanAndBilling() {
  const { data: me } = useMe()
  const { data: config } = usePaymentConfig()
  const enabled = Boolean(config?.configured)
  const { data: plans = [] } = usePublicPlans(enabled)
  const { data: payments = [] } = useMyPayments(enabled)
  const requestPayment = useRequestPayment()
  const cancelPayment = useCancelPayment()

  const [openSlug, setOpenSlug] = useState<string | null>(null)

  const currentSlug = me?.plan?.slug ?? 'free'
  const paidPlans = plans
    .filter((p) => p.price > 0 && p.active && p.slug !== currentSlug)
    .sort((a, b) => a.price - b.price)
  const pending = payments.find((p) => p.status === 'pending')

  const openPlan = openSlug ? (paidPlans.find((p) => p.slug === openSlug) ?? null) : null

  return (
    <Card>
      <CardTitle>Plan &amp; Billing</CardTitle>

      {!enabled ? (
        <EmptyText>
          Payments are currently paused. Contact the admin to upgrade manually.
        </EmptyText>
      ) : (
        <>
          {me?.plan && me.plan.slug !== 'free' && (
            <Row>
              <Label>Current plan</Label>
              <Value>{me.plan.name} ✓</Value>
            </Row>
          )}

          {paidPlans.map((p) => (
            <PlanRow key={p.id}>
              <PlanInfo>
                <PlanNameRow>
                  <Value>{p.name}</Value>
                  <PriceTag>
                    ${p.price}/{p.currency}
                  </PriceTag>
                </PlanNameRow>
              </PlanInfo>
              {!pending ? (
                <SmallBtn onClick={() => setOpenSlug(p.slug)}>Upgrade</SmallBtn>
              ) : (
                <SmallBtn disabled title="You already have a payment awaiting review">
                  Awaiting review
                </SmallBtn>
              )}
            </PlanRow>
          ))}

          {pending && (
            <Row>
              <Label>Your pending payment</Label>
              <Value>
                {pending.planName} · ${pending.amount} {pending.currency}
              </Value>
              <SmallBtn
                $danger
                disabled={cancelPayment.isPending}
                onClick={() => cancelPayment.mutate(pending.id)}
              >
                Cancel
              </SmallBtn>
            </Row>
          )}

          {payments.length > 0 && (
            <>
              <SectionDivider />
              <Row>
                <Label>Payment history</Label>
                <Value>{payments.length}</Value>
              </Row>
              {payments.map((p) => (
                <Row key={p.id}>
                  <Value>
                    {p.planName} · ${p.amount} {p.currency}
                  </Value>
                  <StatusPill $status={p.status}>
                    {p.status === 'confirmed'
                      ? 'Confirmed ✓'
                      : p.status === 'pending'
                      ? 'Pending'
                      : p.status === 'failed'
                      ? 'Failed'
                      : 'Expired'}
                  </StatusPill>
                </Row>
              ))}
              {payments[0]?.rejectionReason && (
                <ErrorText>Rejected: {payments[0].rejectionReason}</ErrorText>
              )}
            </>
          )}
        </>
      )}

      {openSlug && openPlan && (
        <UpgradeModal
          plan={openPlan}
          config={config}
          submitting={requestPayment.isPending}
          onSubmit={async (file, note) => {
            await requestPayment.mutateAsync({ planSlug: openPlan.slug, file, note })
            setOpenSlug(null)
          }}
          onClose={() => setOpenSlug(null)}
        />
      )}
    </Card>
  )
}

interface UpgradeModalProps {
  plan: { slug: string; name: string; price: number; currency: string }
  config: PaymentConfig | undefined
  submitting: boolean
  onSubmit: (file: File, note: string) => Promise<void>
  onClose: () => void
}

function UpgradeModal({ plan, config, submitting, onSubmit, onClose }: UpgradeModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)

  const qrSrc =
    config?.qrUrl ||
    (config?.address
      ? `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(
          config.address
        )}`
      : null)

  const handleSubmit = async () => {
    setError(null)
    if (!file) {
      setError('Attach a screenshot of your payment to continue.')
      return
    }
    try {
      await onSubmit(file, note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit payment')
    }
  }

  return (
    <Overlay onClick={onClose}>
      <Dialog onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <DialogTitle>
          Upgrade to {plan.name} — ${plan.price} {plan.currency}
        </DialogTitle>

        {config?.network && <Hint>Network: {config.network}</Hint>}

        {qrSrc && (
          // eslint-disable-next-line @next/next/no-img-element
          <QrImg src={qrSrc} alt="Payment QR code" />
        )}

        {config?.address && (
          <AddressBox>
            <AddressLabel>Send to this address</AddressLabel>
            <AddressText>{config.address}</AddressText>
          </AddressBox>
        )}

        {config?.note && <Hint>{config.note}</Hint>}

        <FieldLabel htmlFor="payment-screenshot">Payment screenshot</FieldLabel>
        <FileInput
          id="payment-screenshot"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />

        <FieldLabel htmlFor="payment-note">Note (optional)</FieldLabel>
        <NoteInput
          id="payment-note"
          placeholder="e.g. sent 19 USDT via TrustWallet"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {error && <ErrorText role="alert">{error}</ErrorText>}

        <DialogActions>
          <SmallBtn onClick={onClose} disabled={submitting}>
            Close
          </SmallBtn>
          <SmallBtn $primary onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit for review'}
          </SmallBtn>
        </DialogActions>
      </Dialog>
    </Overlay>
  )
}

const SmallBtn = styled.button<{ $danger?: boolean; $primary?: boolean }>`
  padding: 5px 12px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $danger, $primary, theme }) =>
      $primary
        ? theme.colors.accent
        : $danger
        ? 'rgba(244,67,54,0.4)'
        : theme.colors.border.default};
  color: ${({ $danger, $primary, theme }) =>
    $primary
      ? '#fff'
      : $danger
      ? theme.colors.status.failed
      : theme.colors.text.secondary};
  background: ${({ $primary, theme }) => ($primary ? theme.colors.accent : 'transparent')};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.fast};

  &:disabled {
    opacity: 0.5;
  }

  &:hover:not(:disabled) {
    border-color: ${({ $danger, $primary, theme }) =>
      $primary
        ? theme.colors.accent
        : $danger
        ? theme.colors.danger
        : theme.colors.border.accent};
    background: ${({ $danger, $primary, theme }) =>
      $primary ? theme.colors.accent : theme.colors.accentMuted};
  }
`

const PlanRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} 0;

  & + & {
    border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  }
`

const PlanInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`

const PlanNameRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`

const PriceTag = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  padding: 1px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accentMuted};
`

const StatusPill = styled.span<{ $status: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  padding: 2px 8px;
  border-radius: ${({ theme }) => theme.radius.full};
  white-space: nowrap;
  color: ${({ $status, theme }) =>
    $status === 'confirmed'
      ? theme.colors.status.published
      : $status === 'pending'
      ? theme.colors.status.scheduled
      : theme.colors.status.failed};
  background: ${({ $status, theme }) =>
    $status === 'confirmed'
      ? theme.colors.status.publishedBg
      : $status === 'pending'
      ? theme.colors.status.scheduledBg
      : theme.colors.status.failedBg};
`

const SectionDivider = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border.default};
  margin: ${({ theme }) => theme.spacing.sm} 0;
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.lg};
  z-index: 1000;
`

const Dialog = styled.div`
  max-width: 420px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
`

const DialogTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const Hint = styled.p`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: 1.5;
`

const QrImg = styled.img`
  width: 180px;
  height: 180px;
  align-self: center;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: #fff;
  object-fit: contain;
`

const AddressBox = styled.div`
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg.primary};
  border: 1px dashed ${({ theme }) => theme.colors.border.default};
`

const AddressLabel = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`

const AddressText = styled.p`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.primary};
  word-break: break-all;
  margin-top: 4px;
  font-family: ui-monospace, monospace;
`

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: ${({ theme }) => theme.spacing.sm};
`

const FileInput = styled.input`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.secondary};
`

const NoteInput = styled.textarea`
  resize: vertical;
  min-height: 56px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  background: ${({ theme }) => theme.colors.bg.primary};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const DialogActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-top: ${({ theme }) => theme.spacing.sm};
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