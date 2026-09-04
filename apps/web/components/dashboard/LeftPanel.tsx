'use client'

import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Send } from 'lucide-react'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMe, useLogout } from '@/hooks/useAuth'
import { useChannels } from '@/hooks/useChannels'
import { API_URL } from '@/lib/api'
import { formatMemberCount } from '@/lib/mockData'
import AddChannelDialog from './AddChannelDialog'

const slideDown = keyframes`
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
`

const itemIn = keyframes`
  from { opacity: 0; transform: translateX(-12px); }
  to { opacity: 1; transform: translateX(0); }
`

const riseIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

const Panel = styled.aside`
  width: ${({ theme }) => theme.layout.leftPanelWidth};
  height: 100vh;
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
`

const PanelHeader = styled.div`
  padding: 20px 16px 12px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  animation: ${slideDown} 0.35s ease both;
`

// ─── TelePost brand mark ──────────────────────────────────────────────────────
const AppLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  text-decoration: none;
  width: fit-content;
`

const LogoMark = styled.span`
  position: relative;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, #37a5f7 0%, #1565c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  /* colored glow + inner highlight give the tile depth */
  box-shadow:
    0 4px 16px rgba(33, 150, 243, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  transition:
    transform ${({ theme }) => theme.transition.default} cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow ${({ theme }) => theme.transition.default} ease;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.28), transparent 55%);
    pointer-events: none;
  }

  svg {
    width: 17px;
    height: 17px;
    color: #fff;
    position: relative;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
  }

  ${AppLogo}:hover & {
    transform: scale(1.08) rotate(-8deg);
    box-shadow:
      0 6px 24px rgba(33, 150, 243, 0.55),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }
`

const Wordmark = styled.span`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: -0.3px;
  line-height: 1;

  b {
    background: linear-gradient(90deg, #64b5f6, #2196f3);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid transparent;
  transition:
    border-color ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.accentMuted};
  }
`

const SearchIcon = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
`

const SearchInput = styled.input`
  flex: 1;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  background: none;
  border: none;
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.text.muted};
  }
`

const ScrollArea = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: ${({ theme }) => theme.spacing.md} 0;
`

const SectionLabel = styled.div<{ $delay?: string }>`
  padding: 4px 16px 8px;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  animation: ${itemIn} 0.3s ease ${({ $delay }) => $delay ?? '0.05s'} both;
`

const ChannelItem = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 13px 8px 16px;
  border-radius: 0;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentMuted : 'transparent'};
  border-left: 3px solid ${({ $active, theme }) =>
    $active ? theme.colors.accent : 'transparent'};
  opacity: 0;
  animation: ${itemIn} 0.3s ease both;
  transition:
    background ${({ theme }) => theme.transition.fast},
    border-color ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};
  text-align: left;

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.accentMuted : theme.colors.bg.tertiary};
    transform: translateX(2px);
  }
`

const ChannelAvatar = styled.div<{ $color: string }>`
  position: relative;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: #fff;
  flex-shrink: 0;
  overflow: hidden;

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`

const ChannelInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const ChannelName = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const ChannelMeta = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

const AddChannelBtn = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  opacity: 0;
  animation: ${itemIn} 0.3s ease 0.18s both;
  transition:
    color ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    transform: translateX(2px);
  }
`

const AddIcon = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px dashed ${({ theme }) => theme.colors.border.default};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
  transition:
    border-color ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.default} cubic-bezier(0.34, 1.56, 0.64, 1),
    background ${({ theme }) => theme.transition.fast};

  ${AddChannelBtn}:hover & {
    border-color: ${({ theme }) => theme.colors.accent};
    background: ${({ theme }) => theme.colors.accentMuted};
    transform: rotate(90deg);
  }
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
  margin: ${({ theme }) => theme.spacing.md} 0;
`

const NavItem = styled(Link)<{ $active?: boolean; $delay?: string }>`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme, $active }) =>
    $active ? theme.colors.text.primary : theme.colors.text.secondary};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.bg.tertiary : 'transparent'};
  opacity: 0;
  animation: ${itemIn} 0.3s ease ${({ $delay }) => $delay ?? '0.22s'} both;
  transition:
    all ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast};
  border-radius: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    transform: translateX(2px);
  }
`

const NavIcon = styled.span`
  font-size: 16px;
  width: 20px;
  text-align: center;
`

const UserSection = styled.div`
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.lg};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${riseIn} 0.35s ease 0.1s both;
`

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2196f3, #1565c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(33, 150, 243, 0.35);
  transition: transform ${({ theme }) => theme.transition.default} cubic-bezier(0.34, 1.56, 0.64, 1);

  ${UserSection}:hover & {
    transform: scale(1.1);
  }
`

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`

const UserName = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
`

const UserPlan = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.accent};
`

const LogoutBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: 14px;
  flex-shrink: 0;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.status.failed};
    background: ${({ theme }) => theme.colors.status.failedBg};
  }
`

// ─── Shimmer skeletons (React Query initial loads) ───────────────────────────
const shimmerSweep = keyframes`
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
`

const skeletonIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const Bone = styled.div<{ $w?: string; $h?: string; $round?: string }>`
  width: ${({ $w }) => $w ?? '100%'};
  height: ${({ $h }) => $h ?? '12px'};
  border-radius: ${({ $round }) => $round ?? '6px'};
  background-color: ${({ theme }) => theme.colors.bg.tertiary};
  background-image: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.05) 35%,
    rgba(255, 255, 255, 0.13) 50%,
    rgba(255, 255, 255, 0.05) 65%,
    transparent 100%
  );
  background-size: 200% 100%;
  background-repeat: no-repeat;
  animation: ${shimmerSweep} 1.4s ease-in-out infinite;
`

const ChannelSkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  animation: ${skeletonIn} ${({ theme }) => theme.transition.default} ease both;
`

const AvatarBone = styled(Bone)`
  && {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    flex-shrink: 0;
  }
`

const BoneLines = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const AVATAR_COLORS = ['#2196f3', '#9c27b0', '#f44336', '#4caf50', '#ff9800']

export default function LeftPanel() {
  const router = useRouter()
  const pathname = usePathname()
  const { selectedChannelId, setSelectedChannelId, clearSelectedPost } =
    useDashboardStore()
  const { data: me, isLoading: meLoading } = useMe()
  const user = me?.user ?? null
  const { data: channels = [], isLoading: channelsLoading } = useChannels()
  const logout = useLogout()
  const [loggingOut, setLoggingOut] = React.useState(false)
  const [showAddChannel, setShowAddChannel] = useState(false)

  // Auto-select the first real channel once the list loads.
  React.useEffect(() => {
    if (!selectedChannelId && channels.length > 0 && channels[0]) {
      setSelectedChannelId(channels[0].id)
    }
  }, [selectedChannelId, channels, setSelectedChannelId])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    router.replace('/login')
  }

  const handleChannelClick = (id: string) => {
    setSelectedChannelId(id)
    clearSelectedPost()
  }

  return (
    <Panel>
      <PanelHeader>
        <AppLogo href="/" id="left-panel-logo">
          <LogoMark>
            <Send strokeWidth={2.4} />
          </LogoMark>
          <Wordmark>
            <b>Tele</b>Post
          </Wordmark>
        </AppLogo>
        <SearchBox>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput placeholder="Search..." id="channel-search-input" />
        </SearchBox>
      </PanelHeader>

      <ScrollArea>
        <SectionLabel $delay="0.06s">Channels</SectionLabel>

        {channelsLoading ? (
          <div id="channels-skeleton">
            {[0, 1, 2, 3].map((i) => (
              <ChannelSkeletonRow
                key={i}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <AvatarBone />
                <BoneLines>
                  <Bone $w="118px" $h="12px" />
                  <Bone $w="84px" $h="10px" />
                </BoneLines>
              </ChannelSkeletonRow>
            ))}
          </div>
        ) : channels.length === 0 ? (
          <ChannelMeta style={{ padding: '4px 16px 12px' }}>
            No channels yet — add one below.
          </ChannelMeta>
        ) : (
          channels.map((channel, i) => (
            <ChannelItem
              key={channel.id}
              $active={selectedChannelId === channel.id}
              style={{ animationDelay: `${Math.min(0.08 + i * 0.05, 0.45)}s` }}
              onClick={() => handleChannelClick(channel.id)}
              id={`channel-item-${channel.id}`}
            >
              <ChannelAvatar
                $color={AVATAR_COLORS[i % AVATAR_COLORS.length] ?? '#2196f3'}
              >
                {channel.title.charAt(0)}
                {/* Always request the photo — groups connected before the
                    photo feature lack photo_key, and this GET triggers the
                    worker's one-time lazy cache. onError falls back to the
                    letter tile underneath (404 = no photo available). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${API_URL}/api/channels/${channel.id}/photo`}
                  alt=""
                  loading="lazy"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </ChannelAvatar>
              <ChannelInfo>
                <ChannelName>
                  {channel.username ? `@${channel.username}` : channel.title}
                </ChannelName>
                <ChannelMeta>
                  {formatMemberCount(channel.memberCount)
                    ? `${formatMemberCount(channel.memberCount)} members`
                    : channel.title}
                </ChannelMeta>
              </ChannelInfo>
            </ChannelItem>
          ))
        )}

        <AddChannelBtn onClick={() => setShowAddChannel(true)} id="add-channel-btn">
          <AddIcon>+</AddIcon>
          Add Channel
        </AddChannelBtn>

        <Divider />
        <SectionLabel $delay="0.28s">Navigation</SectionLabel>

        <NavItem href="/dashboard/calendar" $active={pathname === '/dashboard/calendar'} $delay="0.3s" id="nav-calendar">
          <NavIcon>📅</NavIcon>
          Calendar
        </NavItem>
        <NavItem href="/dashboard/history" $active={pathname === '/dashboard/history'} $delay="0.34s" id="nav-history">
          <NavIcon>📜</NavIcon>
          History
        </NavItem>
        <NavItem href="/dashboard/settings" $active={pathname === '/dashboard/settings'} $delay="0.38s" id="nav-settings">
          <NavIcon>⚙️</NavIcon>
          Settings
        </NavItem>
      </ScrollArea>

      <UserSection>
        {meLoading ? (
          <>
            <AvatarBone style={{ width: 32, height: 32 }} />
            <UserInfo>
              <Bone $w="92px" $h="11px" />
              <Bone $w="52px" $h="9px" />
            </UserInfo>
          </>
        ) : (
          <>
            <UserAvatar>{(user?.displayName ?? 'A').charAt(0).toUpperCase()}</UserAvatar>
            <UserInfo>
              <UserName>@{user?.username ?? 'username'}</UserName>
              <UserPlan>Free forever</UserPlan>
            </UserInfo>
            <LogoutBtn
              onClick={handleLogout}
              title="Log out"
              id="logout-btn"
              disabled={loggingOut}
            >
              ⎋
            </LogoutBtn>
          </>
        )}
      </UserSection>

      <AddChannelDialog
        open={showAddChannel}
        onClose={() => setShowAddChannel(false)}
      />
    </Panel>
  )
}
