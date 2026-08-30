'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import { Send } from 'lucide-react'
import LoadingScreen from '@/components/common/LoadingScreen'
import { dbDate } from '@/lib/mockData'
import {
  useAdminSession,
  useAdminLogin,
  useAdminLogout,
  useAdminUsers,
  useAdminPlans,
  useAdminPayments,
  useApprovePayment,
  useRejectPayment,
  useGrantPlan,
  useRevokePlan,
  type AdminUserRow,
  type AdminPaymentRow,
} from '@/hooks/useAdmin'
import { paymentScreenshotUrl } from '@/hooks/usePayments'

// ─── Page shell ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const { data: authed, isLoading: sessionLoading } = useAdminSession()
  const logout = useAdminLogout()

  return (
    <Page id="admin-page">
      {sessionLoading ? (
        <LoadingScreen label="Checking admin access" />
      ) : authed ? (
        <>
          <TopBar>
            <Brand>
              <Mark>
                <Send strokeWidth={2.4} />
              </Mark>
              <Wordmark>
                <b>Tele</b>Post Admin
              </Wordmark>
            </Brand>
            <LogoutBtn
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              id="admin-logout-btn"
            >
              Log out
            </LogoutBtn>
          </TopBar>
          <UserRoster />
          <PaymentsReview />
        </>
      ) : (
        <LoginCard />
      )}
    </Page>
  )
}

// ─── Login card ──────────────────────────────────────────────────────────────

function LoginCard() {
  const login = useAdminLogin()
  const [email, setEmail] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !key.trim()) {
      setError('Enter both the admin e-mail and key.')
      return
    }
    setError(null)
    try {
      await login.mutateAsync({ email, key })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return (
    <Center>
      <LoginForm onSubmit={handleSubmit} id="admin-login-form">
        <FormLogo>
          <Mark>
            <Send strokeWidth={2.4} />
          </Mark>
          <Wordmark>
            <b>Tele</b>Post Admin
          </Wordmark>
        </FormLogo>
        <FormHint>
          Restricted area. Sign in with the deployment&apos;s configured admin
          credentials.
        </FormHint>

        <FieldLabel htmlFor="admin-email">Email</FieldLabel>
        <Input
          id="admin-email"
          type="email"
          autoComplete="username"
          placeholder="admin@yourdomain.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FieldLabel htmlFor="admin-key">Admin Key</FieldLabel>
        <Input
          id="admin-key"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••••••"
          value={key}
          onChange={(e) => setKey(e.target.value)}
        />

        {error && <ErrorText role="alert">{error}</ErrorText>}

        <SubmitBtn type="submit" disabled={login.isPending} id="admin-login-submit">
          {login.isPending ? 'Unlocking…' : 'Unlock Admin Panel'}
        </SubmitBtn>
      </LoginForm>
    </Center>
  )
}

// ─── Users roster ────────────────────────────────────────────────────────────

interface DraftState {
  planSlug: string
  months: number
}

const DEFAULT_DRAFT: DraftState = { planSlug: 'pro', months: 1 }

function UserRoster() {
  const { data: users = [], isLoading, error } = useAdminUsers(true)
  const { data: plans = [] } = useAdminPlans(true)
  const grant = useGrantPlan()
  const revoke = useRevokePlan()

  // Per-row controls (plan choice + duration), keyed by user id.
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({})

  const getDraft = (id: string): DraftState => drafts[id] ?? DEFAULT_DRAFT

  const updateDraft = (id: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...getDraft(id), ...patch } }))
  }

  const handleGrant = async (user: AdminUserRow) => {
    const { planSlug, months } = getDraft(user.id)
    try {
      await grant.mutateAsync({ userId: user.id, planSlug, months })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to grant plan')
    }
  }

  const handleRevoke = async (user: AdminUserRow) => {
    const name = user.username ? `@${user.username}` : user.displayName
    if (!window.confirm(`Revoke paid access for ${name}? They drop back to Free.`)) return
    try {
      await revoke.mutateAsync(user.id)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to revoke')
    }
  }

  const grantingUserId: string | null =
    grant.isPending && grant.variables ? grant.variables.userId : null

  const isPaid = (slug: string | null) => Boolean(slug) && slug !== 'free'

  const planSlugs =
    plans.length > 0 ? plans.map((p) => p.slug) : ['free', 'pro', 'business']

  const formatDate = (iso: string) =>
    dbDate(iso)?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }) ?? '—'

  if (isLoading) {
    return (
      <RosterWrap>
        <RosterSkeleton>
          {[0, 1, 2].map((i) => (
            <BoneLine key={i} $delay={`${i * 0.08}s`} />
          ))}
        </RosterSkeleton>
      </RosterWrap>
    )
  }

  if (error) {
    return (
      <RosterWrap>
        <EmptyText>
          Couldn’t load users — {error instanceof Error ? error.message : 'unknown error'}
        </EmptyText>
      </RosterWrap>
    )
  }

  return (
    <RosterWrap>
      {users.length === 0 ? (
        <EmptyText>No users yet. Once someone logs in via Telegram they appear here.</EmptyText>
      ) : (
        <>
          <RosterSummary>
            {users.length} user{users.length === 1 ? '' : 's'} · newest first
          </RosterSummary>

          <List role="table">
            {users.map((u) => {
              const d = getDraft(u.id)
              const paid = isPaid(u.planSlug)
              const granting = grantingUserId === u.id
              return (
                <Row key={u.id} id={`admin-user-${u.telegramId}`}>
                  <Avatar>{(u.displayName || '?').charAt(0).toUpperCase()}</Avatar>

                  <UserIdentity>
                    <UserName>{u.username ? `@${u.username}` : u.displayName}</UserName>
                    <UserMeta>
                      ID {u.telegramId} · {u.channelCount} channel
                      {u.channelCount === 1 ? '' : 's'} · {u.postCount} post
                      {u.postCount === 1 ? '' : 's'} · joined {formatDate(u.createdAt)}
                    </UserMeta>
                  </UserIdentity>

                  <PlanBadge $slug={paid ? u.planSlug ?? '' : 'free'}>
                    {paid ? u.planName : 'Free'}
                  </PlanBadge>

                  <Expiry title={u.subscriptionExpiresAt ?? undefined}>
                    {paid && u.subscriptionExpiresAt
                      ? `until ${formatDate(u.subscriptionExpiresAt)}`
                      : 'no subscription'}
                  </Expiry>

                  <Controls>
                    <Select
                      value={d.planSlug}
                      onChange={(e) => updateDraft(u.id, { planSlug: e.target.value })}
                      aria-label={`Plan for ${u.displayName}`}
                      disabled={granting}
                      id={`grant-plan-${u.telegramId}`}
                    >
                      {planSlugs.map((slug) => (
                        <option key={slug} value={slug}>
                          {slug.toUpperCase()}
                        </option>
                      ))}
                    </Select>

                    <MonthsInput
                      type="number"
                      min={1}
                      max={36}
                      value={d.months}
                      onChange={(e) =>
                        updateDraft(u.id, {
                          months: Math.min(Math.max(Math.floor(Number(e.target.value) || 1), 1), 36),
                        })
                      }
                      aria-label={`Months for ${u.displayName}`}
                      disabled={granting}
                      id={`grant-months-${u.telegramId}`}
                    />
                    <MoUnit>mo</MoUnit>

                    <ActionBtn onClick={() => handleGrant(u)} disabled={granting} id={`grant-btn-${u.telegramId}`}>
                      {granting ? '…' : 'Grant'}
                    </ActionBtn>

                    {paid && (
                      <ActionBtn
                        $danger
                        onClick={() => handleRevoke(u)}
                        disabled={revoke.isPending && revoke.variables === u.id}
                        id={`revoke-btn-${u.telegramId}`}
                      >
                        Revoke
                      </ActionBtn>
                    )}
                  </Controls>
                </Row>
              )
            })}
          </List>
        </>
      )}
    </RosterWrap>
  )
}

// ─── Manual QR payment review ────────────────────────────────────────────────

function PaymentsReview() {
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')
  const { data: payments = [], isLoading, error } = useAdminPayments(
    true,
    filter === 'pending' ? 'pending' : undefined
  )
  const approve = useApprovePayment()
  const reject = useRejectPayment()
  const [monthsDraft, setMonthsDraft] = useState<Record<string, number>>({})

  const monthsFor = (id: string) => monthsDraft[id] ?? 1
  const setMonths = (id: string, value: number) =>
    setMonthsDraft((prev) => ({ ...prev, [id]: value }))

  const handleApprove = async (p: AdminPaymentRow) => {
    if (!window.confirm(`Approve ${p.planName} ($${p.amount} ${p.currency}) for ${p.userDisplay}?`)) return
    try {
      await approve.mutateAsync({ id: p.id, months: monthsFor(p.id) })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handleReject = async (p: AdminPaymentRow) => {
    const reason = window.prompt('Reason for rejection (optional):', 'Payment not verified')
    if (reason === null) return
    try {
      await reject.mutateAsync({ id: p.id, reason: reason || undefined })
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  return (
    <RosterWrap>
      <RosterSummary>
        Payments ·{' '}
        <FilterLink $active={filter === 'pending'} onClick={() => setFilter('pending')}>
          Pending queue
        </FilterLink>{' '}
        ·{' '}
        <FilterLink $active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </FilterLink>
      </RosterSummary>

      {isLoading ? (
        <RosterSummary>Loading payments…</RosterSummary>
      ) : error ? (
        <EmptyText>Couldn’t load payments — {error instanceof Error ? error.message : 'unknown error'}</EmptyText>
      ) : payments.length === 0 ? (
        <EmptyText>No {filter === 'pending' ? 'pending ' : ''}payments right now.</EmptyText>
      ) : (
        <List>
          {payments.map((p) => {
            const isPending = p.status === 'pending'
            const approving = approve.isPending && approve.variables?.id === p.id
            const rejecting = reject.isPending && reject.variables?.id === p.id
            return (
              <Row key={p.id} id={`admin-payment-${p.id}`}>
                <Avatar>{(p.userDisplay || '?').charAt(0).toUpperCase()}</Avatar>

                <UserIdentity>
                  <UserName>{p.userDisplay}</UserName>
                  <UserMeta>
                    {p.planName} · ${p.amount} {p.currency} ·{' '}
                    {dbDate(p.createdAt)?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    }) ?? '—'}
                    {p.note ? ` · note: ${p.note}` : ''}
                  </UserMeta>
                </UserIdentity>

                {p.hasScreenshot && (
                  <ScreenshotBtn
                    onClick={() => window.open(paymentScreenshotUrl(p.id), '_blank')}
                    title="Open payment screenshot"
                  >
                    View screenshot
                  </ScreenshotBtn>
                )}

                <PaymentStatus $status={p.status}>
                  {isPending
                    ? 'Pending'
                    : p.status === 'confirmed'
                    ? 'Confirmed ✓'
                    : p.status === 'failed'
                    ? `Failed — ${p.rejectionReason ?? 'rejected'}`
                    : 'Expired'}
                </PaymentStatus>

                {isPending && (
                  <Controls>
                    <MonthsInput
                      type="number"
                      min={1}
                      max={12}
                      value={monthsFor(p.id)}
                      onChange={(e) =>
                        setMonths(p.id, Math.min(Math.max(Math.floor(Number(e.target.value) || 1), 1), 12))
                      }
                      disabled={approving || rejecting}
                      aria-label="Months to grant"
                      id={`payment-months-${p.id}`}
                    />
                    <MoUnit>mo</MoUnit>
                    <ActionBtn $approve onClick={() => handleApprove(p)} disabled={approving || rejecting} id={`approve-${p.id}`}>
                      {approving ? '…' : 'Approve'}
                    </ActionBtn>
                    <ActionBtn $danger onClick={() => handleReject(p)} disabled={approving || rejecting} id={`reject-${p.id}`}>
                      {rejecting ? '…' : 'Reject'}
                    </ActionBtn>
                  </Controls>
                )}
              </Row>
            )
          })}
        </List>
      )}
    </RosterWrap>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const Page = styled.main`
  min-height: 100vh;
  background: ${({ theme }) => theme.colors.bg.primary};
  padding: ${({ theme }) => theme.spacing['2xl']};
`

const Center = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`

const TopBar = styled.header`
  max-width: 980px;
  margin: 0 auto ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const Mark = styled.span`
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #37a5f7 0%, #1565c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 16px rgba(33, 150, 243, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);

  svg {
    width: 17px;
    height: 17px;
    color: #fff;
  }
`

const Wordmark = styled.span`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: -0.3px;
  color: ${({ theme }) => theme.colors.text.primary};

  b {
    background: linear-gradient(90deg, #64b5f6, #2196f3);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const LogoutBtn = styled.button`
  padding: 7px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid rgba(244, 67, 54, 0.4);
  color: ${({ theme }) => theme.colors.status.failed};
  background: transparent;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.status.failedBg};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const LoginForm = styled.form`
  width: 100%;
  max-width: 400px;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing['2xl']};
  display: flex;
  flex-direction: column;
`

const FormLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const FormHint = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.font.size.xs};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.sm};
  outline: none;
  transition: border-color ${({ theme }) => theme.transition.fast};

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
`

const ErrorText = styled.p`
  color: ${({ theme }) => theme.colors.status.failed};
  font-size: ${({ theme }) => theme.font.size.sm};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const SubmitBtn = styled.button`
  width: 100%;
  padding: 11px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: none;
  background: linear-gradient(135deg, #2196f3, #1565c0);
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  cursor: pointer;
  box-shadow: ${({ theme }) => theme.shadow.glow};
  transition:
    filter ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const RosterWrap = styled.section`
  max-width: 980px;
  margin: 0 auto;
`

const RosterSummary = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.lg};
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  flex-wrap: wrap;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.default};
  }
`

const Avatar = styled.span`
  width: 38px;
  height: 38px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #2a3d50;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
`

const UserIdentity = styled.div`
  min-width: 180px;
  flex: 1.4;
`

const UserName = styled.div`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`

const UserMeta = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-top: 2px;
`

const PlanBadge = styled.span<{ $slug: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.6px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  white-space: nowrap;

  ${({ $slug, theme }) =>
    $slug === 'pro'
      ? `color: ${theme.colors.status.publishing}; background: ${theme.colors.status.publishingBg};`
      : $slug === 'business'
        ? `color: ${theme.colors.status.published}; background: ${theme.colors.status.publishedBg};`
        : `color: ${theme.colors.text.muted}; background: rgba(112,132,153,0.12);`}
`

const Expiry = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.timestamp};
  min-width: 120px;
`

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  margin-left: auto;
`

const Select = styled.select`
  padding: 7px 10px;
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.xs};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
  &:disabled {
    opacity: 0.5;
  }
`

const MonthsInput = styled.input`
  padding: 7px 10px;
  width: 58px;
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size.xs};
  outline: none;
  -moz-appearance: textfield;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    border-color: ${({ theme }) => theme.colors.border.accent};
  }
  &:disabled {
    opacity: 0.5;
  }
`

const MoUnit = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  margin-left: -6px;
`

const ActionBtn = styled.button<{ $danger?: boolean; $approve?: boolean }>`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid
    ${({ $approve, $danger, theme }) =>
      $approve
        ? theme.colors.status.published
        : $danger
        ? 'rgba(244,67,54,0.4)'
        : theme.colors.border.accent};
  color: ${({ $approve, $danger, theme }) =>
    $approve
      ? theme.colors.status.published
      : $danger
      ? theme.colors.status.failed
      : theme.colors.text.accent};
  background: transparent;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${({ $approve, theme }) =>
      $approve ? theme.colors.status.publishedBg : theme.colors.accentMuted};
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const FilterLink = styled.button<{ $active: boolean }>`
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: ${({ $active, theme }) =>
    $active ? theme.colors.text.accent : theme.colors.text.muted};
  text-decoration: ${({ $active }) => ($active ? 'underline' : 'none')};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.accent};
  }
`

const ScreenshotBtn = styled.button`
  padding: 7px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  color: ${({ theme }) => theme.colors.text.accent};
  background: transparent;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  cursor: pointer;
  transition: all ${({ theme }) => theme.transition.fast};
  white-space: nowrap;

  &:hover {
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

const PaymentStatus = styled.span<{ $status: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  padding: 3px 10px;
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

const RosterSkeleton = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const BoneLine = styled.div<{ $delay: string }>`
  height: 64px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.bg.secondary};
  animation: shimmer 1.4s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay};

  @keyframes shimmer {
    0%, 100% { opacity: 0.55; }
    50% { opacity: 1; }
  }
`

const EmptyText = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  padding: ${({ theme }) => theme.spacing['3xl']} 0;
  text-align: center;
`