'use client'

import React, { useState, useEffect } from 'react'
import styled, { css } from 'styled-components'
import Link from 'next/link'

const Nav = styled.nav<{ $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: ${({ theme }) => theme.layout.navbarHeight};
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing['2xl']};
  transition: background ${({ theme }) => theme.transition.default},
    border-color ${({ theme }) => theme.transition.default},
    backdrop-filter ${({ theme }) => theme.transition.default};

  ${({ $scrolled, theme }) =>
    $scrolled
      ? css`
          background: rgba(14, 22, 33, 0.92);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid ${theme.colors.border.subtle};
        `
      : css`
          background: transparent;
          border-bottom: 1px solid transparent;
        `}
`

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.3px;
`

const LogoIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(135deg, #2196f3, #1565c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
`

const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    display: none;
  }
`

const NavLink = styled.a`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`

const TelegramLoginBtn = styled.button`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 8px 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: background ${({ theme }) => theme.transition.fast},
    transform ${({ theme }) => theme.transition.fast},
    box-shadow ${({ theme }) => theme.transition.fast};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-1px);
    box-shadow: ${({ theme }) => theme.shadow.glow};
  }

  &:active {
    transform: translateY(0);
  }
`

const TelegramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.93c-.12.54-.46.67-.93.42l-2.57-1.89-1.24 1.19c-.14.13-.25.25-.51.25l.18-2.59 4.72-4.26c.2-.18-.04-.28-.32-.1L7.6 14.44l-2.52-.79c-.54-.17-.55-.54.12-.8l9.85-3.79c.46-.17.86.11.59.74z"
      fill="currentColor"
    />
  </svg>
)

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <Nav $scrolled={scrolled}>
      <Inner>
        <Logo href="/">
          <LogoIcon>✈</LogoIcon>
          TelePost
        </Logo>

        <NavLinks>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </NavLinks>

        <NavActions>
          <TelegramLoginBtn id="navbar-login-btn">
            <TelegramIcon />
            Login with Telegram
          </TelegramLoginBtn>
        </NavActions>
      </Inner>
    </Nav>
  )
}
