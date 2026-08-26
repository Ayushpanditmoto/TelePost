"use client";

import React from "react";
import styled from "styled-components";
import Link from "next/link";
import { Send, ArrowRight, Sparkles } from "lucide-react";

// ----- CTA Section -----
const CTASection = styled.section`
  padding: 120px ${({ theme }) => theme.spacing["2xl"]};
  text-align: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(
    145deg,
    ${({ theme }) => theme.colors.bg.primary} 0%,
    ${({ theme }) => theme.colors.bg.secondary} 100%
  );
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

const Glow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 700px;
  height: 500px;
  background: radial-gradient(
    ellipse,
    ${({ theme }) => theme.colors.accent + "20"},
    transparent 70%
  );
  pointer-events: none;
  animation: floatGlow 6s ease-in-out infinite;

  @keyframes floatGlow {
    0%,
    100% {
      transform: translate(-50%, -50%) scale(1);
    }
    50% {
      transform: translate(-50%, -55%) scale(1.1);
    }
  }
`;

// ----- Small decorative badge with icon -----
const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accentMuted};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.lg};

  svg {
    width: 14px;
    height: 14px;
  }
`;

const Title = styled.h2`
  font-size: clamp(32px, 5vw, 52px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  margin-bottom: ${({ theme }) => theme.spacing.md};
  position: relative;
  line-height: 1.2;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
  position: relative;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

const CTAGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  position: relative;
`;

const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 40px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentHover}
  );
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 24px ${({ theme }) => theme.colors.accent + "40"};
  border: none;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 48px ${({ theme }) => theme.colors.accent + "60"};
  }

  &:active {
    transform: scale(0.97);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const SecondaryLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all 0.25s ease;
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.accentMuted};
    transform: translateY(-2px);
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

// ----- Footer Section -----
const FooterSection = styled.footer`
  background: ${({ theme }) => theme.colors.bg.tertiary};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  padding: ${({ theme }) => theme.spacing["4xl"]}
    ${({ theme }) => theme.spacing["2xl"]}
    ${({ theme }) => theme.spacing["3xl"]};
`;

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${({ theme }) => theme.spacing["3xl"]};

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing["2xl"]};
  }
`;

const FooterBrand = styled.div`
  max-width: 320px;
`;

const FooterLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  text-decoration: none;
`;

const LogoIcon = styled.div`
  width: 36px;
  height: 36px;
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
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.accent + "30"};

  svg {
    width: 18px;
    height: 18px;
  }
`;

const FooterTagline = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: 1.7;
  margin-bottom: 0;
`;

const FooterLinks = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FooterGroup = styled.div``;

const FooterGroupTitle = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const FooterLink = styled.a`
  display: block;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: color ${({ theme }) => theme.transition.fast};
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: ${({ theme }) => theme.spacing["3xl"]} auto 0;
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`;

const Copyright = styled.p`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  margin: 0;
`;

// ============================================
// Main Component
// ============================================
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <>
      <CTASection id="cta">
        <Glow />

        {/* Added: decorative badge with Sparkles icon */}
        <Badge>
          <Sparkles size={14} />
          Get started today
        </Badge>

        <Title>Start scheduling your Telegram content.</Title>
        <Subtitle>Join creators who publish smarter, not harder.</Subtitle>

        <CTAGroup>
          <PrimaryBtn id="footer-cta-btn">
            <Send size={20} />
            Get Started Free
          </PrimaryBtn>
          <SecondaryLink href="#pricing" id="footer-pricing-link">
            View Plans
            <ArrowRight size={18} />
          </SecondaryLink>
        </CTAGroup>
      </CTASection>

      <FooterSection>
        <FooterInner>
          <FooterBrand>
            <FooterLogo href="/">
              <LogoIcon>
                <Send size={18} />
              </LogoIcon>
              TelePost
            </FooterLogo>
            <FooterTagline>
              Schedule and manage Telegram channel posts automatically through
              your own bot.
            </FooterTagline>
          </FooterBrand>

          <FooterLinks>
            <FooterGroup>
              <FooterGroupTitle>Product</FooterGroupTitle>
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="#how-it-works">How it works</FooterLink>
              <FooterLink href="#faq">FAQ</FooterLink>
            </FooterGroup>
            <FooterGroup>
              <FooterGroupTitle>Legal</FooterGroupTitle>
              <FooterLink href="#">Privacy Policy</FooterLink>
              <FooterLink href="#">Terms of Service</FooterLink>
            </FooterGroup>
          </FooterLinks>
        </FooterInner>

        <FooterBottom>
          <Copyright>© {year} TelePost. All rights reserved.</Copyright>
          <Copyright>Not affiliated with Telegram Messenger.</Copyright>
        </FooterBottom>
      </FooterSection>
    </>
  );
}
