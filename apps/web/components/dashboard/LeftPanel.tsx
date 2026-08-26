'use client'

import React, { useState } from 'react'
import styled from 'styled-components'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDashboardStore } from '@/store/dashboardStore'
import { useMe, useLogout } from '@/hooks/useAuth'
import { useChannels } from '@/hooks/useChannels'
import AddChannelDialog from './AddChannelDialog'

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
`

const AppLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  text-decoration: none;
  margin-bottom: 16px;
`

const LogoIcon = styled.div`
  width: 28px;
  height: 28px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(135deg, #2196f3, #1565c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  flex-shrink: 0;
`

const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ theme }) => theme.colors.bg.input};
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

const SectionLabel = styled.div`
  padding: 4px 16px 8px;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
`

const ChannelItem = styled.button<{ $active: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 16px;
  border-radius: 0;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentMuted : 'transparent'};
  border-left: 3px solid ${({ $active, theme }) =>
    $active ? theme.colors.accent : 'transparent'};
  transition: background ${({ theme }) => theme.transition.fast};
  text-align: left;

  &:hover {
    background: ${({ $active, theme }) =>
      $active ? theme.colors.accentMuted : theme.colors.bg.tertiary};
  }
`

const ChannelAvatar = styled.div<{ $color: string }>`
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
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
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
  transition: border-color ${({ theme }) => theme.transition.fast};

  ${AddChannelBtn}:hover & {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
  margin: ${({ theme }) => theme.spacing.md} 0;
`

const NavItem = styled(Link)<{ $active?: boolean }>`
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
  transition: all ${({ theme }) => theme.transition.fast};
  border-radius: 0;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
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

const AVATAR_COLORS = ['#2196f3', '#9c27b0', '#f44336', '#4caf50', '#ff9800']

export default function LeftPanel() {
  const router = useRouter()
  const { selectedChannelId, setSelectedChannelId, clearSelectedPost } =
    useDashboardStore()
  const { data: user } = useMe()
  const { data: channels = [] } = useChannels()
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
        <AppLogo href="/">
          <LogoIcon>✈</LogoIcon>
          TelePost
        </AppLogo>
        <SearchBox>
          <SearchIcon>🔍</SearchIcon>
          <SearchInput placeholder="Search..." id="channel-search-input" />
        </SearchBox>
      </PanelHeader>

      <ScrollArea>
        <SectionLabel>Channels</SectionLabel>

        {channels.length === 0 ? (
          <ChannelMeta style={{ padding: '4px 16px 12px' }}>
            No channels yet — add one below.
          </ChannelMeta>
        ) : (
          channels.map((channel, i) => (
            <ChannelItem
              key={channel.id}
              $active={selectedChannelId === channel.id}
              onClick={() => handleChannelClick(channel.id)}
              id={`channel-item-${channel.id}`}
            >
              <ChannelAvatar
                $color={AVATAR_COLORS[i % AVATAR_COLORS.length] ?? '#2196f3'}
              >
                {channel.title.charAt(0)}
              </ChannelAvatar>
              <ChannelInfo>
                <ChannelName>
                  {channel.username ? `@${channel.username}` : channel.title}
                </ChannelName>
                <ChannelMeta>{channel.title}</ChannelMeta>
              </ChannelInfo>
            </ChannelItem>
          ))
        )}

        <AddChannelBtn onClick={() => setShowAddChannel(true)} id="add-channel-btn">
          <AddIcon>+</AddIcon>
          Add Channel
        </AddChannelBtn>

        <Divider />
        <SectionLabel>Navigation</SectionLabel>

        <NavItem href="/dashboard/calendar" id="nav-calendar">
          <NavIcon>📅</NavIcon>
          Calendar
        </NavItem>
        <NavItem href="/dashboard/media" id="nav-media">
          <NavIcon>🖼️</NavIcon>
          Media
        </NavItem>
        <NavItem href="/dashboard/history" id="nav-history">
          <NavIcon>📜</NavIcon>
          History
        </NavItem>
        <NavItem href="/dashboard/settings" id="nav-settings">
          <NavIcon>⚙️</NavIcon>
          Settings
        </NavItem>
      </ScrollArea>

      <UserSection>
        <UserAvatar>{(user?.displayName ?? 'A').charAt(0).toUpperCase()}</UserAvatar>
        <UserInfo>
          <UserName>@{user?.username ?? 'username'}</UserName>
          <UserPlan>Free Plan</UserPlan>
        </UserInfo>
        <LogoutBtn
          onClick={handleLogout}
          title="Log out"
          id="logout-btn"
          disabled={loggingOut}
        >
          ⎋
        </LogoutBtn>
      </UserSection>

      <AddChannelDialog
        open={showAddChannel}
        onClose={() => setShowAddChannel(false)}
      />
    </Panel>
  )
}
