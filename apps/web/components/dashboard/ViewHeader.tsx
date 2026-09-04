'use client'

import type { LucideIcon } from 'lucide-react'
import styled from 'styled-components'

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.lg};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  padding-bottom: ${({ theme }) => theme.spacing.xl};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`

const HeadingGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.md};
`

const IconWrap = styled.div`
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radius.md};
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentMuted};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
`

const Copy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`

const Eyebrow = styled.div`
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.7px;
  text-transform: uppercase;
`

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: ${({ theme }) => theme.font.size['2xl']};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: 1.2;
`

const Subtitle = styled.p`
  max-width: 520px;
  color: ${({ theme }) => theme.colors.text.muted};
  font-size: ${({ theme }) => theme.font.size.sm};
  line-height: ${({ theme }) => theme.font.lineHeight.normal};
`

const BackLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
  padding: 8px 12px;
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  border-radius: ${({ theme }) => theme.radius.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.xs};
  text-decoration: none;
  transition: all ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

export default function ViewHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
}: {
  icon: LucideIcon
  eyebrow: string
  title: string
  subtitle: string
}) {
  return (
    <Header>
      <HeadingGroup>
        <IconWrap><Icon size={19} strokeWidth={2} /></IconWrap>
        <Copy>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Title>{title}</Title>
          <Subtitle>{subtitle}</Subtitle>
        </Copy>
      </HeadingGroup>
      <BackLink href="/dashboard">← Feed</BackLink>
    </Header>
  )
}
