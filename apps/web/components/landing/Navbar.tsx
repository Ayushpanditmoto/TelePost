"use client";

import React, { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import Link from "next/link";
import { Send } from "lucide-react";
import { useMe } from "@/hooks/useAuth";

// ----- Navbar Container (glass on scroll) -----
const Nav = styled.nav<{ $scrolled: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: ${({ theme }) => theme.layout.navbarHeight};
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.spacing["2xl"]};
  transition: all ${({ theme }) => theme.transition.default};

  ${({ $scrolled, theme }) =>
    $scrolled
      ? css`
          background: ${theme.colors.bg.primary}cc;
          backdrop-filter: blur(16px) saturate(180%);
          -webkit-backdrop-filter: blur(16px) saturate(180%);
          border-bottom: 1px solid ${theme.colors.border.subtle};
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.06);
        `
      : css`
          background: transparent;
          border-bottom: 1px solid transparent;
          box-shadow: none;
        `}
`;

const Inner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

// ----- Logo (styled Link) -----
const Logo = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.3px;
  text-decoration: none;
`;

const LogoIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentHover}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  box-shadow: 0 2px 12px ${({ theme }) => theme.colors.accent}30;

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ----- Navigation Links -----
const NavLinks = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    display: none;
  }
`;

const NavLink = styled.a`
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.secondary};
  transition: color ${({ theme }) => theme.transition.fast};
  cursor: pointer;
  text-decoration: none;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${({ theme }) => theme.colors.accent};
    transition: width ${({ theme }) => theme.transition.fast};
  }

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
    &::after {
      width: 100%;
    }
  }
`;

// ----- Login Link (styled Link with button styles) -----
const LoginLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: 8px 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentHover}
  );
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.sm};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.fast};
  border: none;
  cursor: pointer;
  box-shadow: 0 2px 16px ${({ theme }) => theme.colors.accent}30;
  text-decoration: none;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 28px ${({ theme }) => theme.colors.accent}50;
  }

  &:active {
    transform: scale(0.97);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// Telegram SVG Icon (clean)
const TelegramIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
);

// ============================================
// Main Component
// ============================================
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  // Session-aware CTA: logged-in visitors get a direct link to the dashboard
  // instead of the Telegram login screen (/login itself redirects them too).
  const { data: user } = useMe();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <Nav $scrolled={scrolled}>
      <Inner>
        <Logo href="/">
          <LogoIcon>
            <Send />
          </LogoIcon>
          TelePost
        </Logo>

        <NavLinks>
          <NavLink href="#features">Features</NavLink>
          <NavLink href="#pricing">Pricing</NavLink>
          <NavLink href="#how-it-works">How it works</NavLink>
          <NavLink href="#faq">FAQ</NavLink>
        </NavLinks>

        <LoginLink href={user ? '/dashboard' : '/login'} id="navbar-login-btn">
          <TelegramIcon />
          {user ? 'Open Dashboard' : 'Login with Telegram'}
        </LoginLink>
      </Inner>
    </Nav>
  );
}
