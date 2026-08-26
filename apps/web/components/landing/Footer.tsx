'use client'

import React from 'react'
import styled from 'styled-components'
import Link from 'next/link'

const CTASection = styled.section`
  padding: 120px ${({ theme }) => theme.spacing['2xl']};
  text-align: center;
  position: relative;
  overflow: hidden;
`

const Glow = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 600px;
  height: 400px;
  background: radial-gradient(ellipse, rgba(33, 150, 243, 0.15), transparent 70%);
  pointer-events: none;
`

const Title = styled.h2`
  font-size: clamp(28px, 5vw, 52px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -1px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  position: relative;
`

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.font.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
  position: relative;
`

const CTAGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  flex-wrap: wrap;
  position: relative;
`

const PrimaryBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.default};
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.35);

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 40px rgba(33, 150, 243, 0.5);
  }
`

const SecondaryLink = styled(Link)`
  padding: 16px 36px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.default};
  display: inline-block;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`

const FooterSection = styled.footer`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  padding: ${({ theme }) => theme.spacing['3xl']} ${({ theme }) => theme.spacing['2xl']};
`

const FooterInner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing['2xl']};
  flex-wrap: wrap;
`

const FooterBrand = styled.div`
  max-width: 280px;
`

const FooterLogo = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const LogoIcon = styled.div`
  width: 30px;
  height: 30px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: linear-gradient(135deg, #2196f3, #1565c0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
`

const FooterTagline = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
`

const FooterLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing['3xl']};
  flex-wrap: wrap;
`

const FooterGroup = styled.div``

const FooterGroupTitle = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const FooterLink = styled.a`
  display: block;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.text.primary};
  }
`

const FooterBottom = styled.div`
  max-width: 1200px;
  margin: ${({ theme }) => theme.spacing['2xl']} auto 0;
  padding-top: ${({ theme }) => theme.spacing.xl};
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.md};
`

const Copyright = styled.p`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <>
      <CTASection id="cta">
        <Glow />
        <Title>Start scheduling your Telegram content.</Title>
        <Subtitle>Join creators who publish smarter, not harder.</Subtitle>
        <CTAGroup>
          <PrimaryBtn id="footer-cta-btn">✈ Get Started Free</PrimaryBtn>
          <SecondaryLink href="#pricing" id="footer-pricing-link">
            View Plans
          </SecondaryLink>
        </CTAGroup>
      </CTASection>

      <FooterSection>
        <FooterInner>
          <FooterBrand>
            <FooterLogo href="/">
              <LogoIcon>✈</LogoIcon>
              TelePost
            </FooterLogo>
            <FooterTagline>
              Schedule and manage Telegram channel posts automatically through your own bot.
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
  )
}
