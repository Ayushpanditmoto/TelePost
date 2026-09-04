"use client";

import React from "react";
import styled, { keyframes } from "styled-components";
import Link from "next/link";

// ----- Animations -----
const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-12px); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ----- Hero Section (split layout: copy left, dashboard preview right) -----
const HeroSection = styled.section`
  min-height: 100vh;
  display: flex;
  align-items: center;
  padding: 120px ${({ theme }) => theme.spacing["2xl"]} 96px;
  position: relative;
  overflow: hidden;
`

const HeroInner = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
  gap: 64px;
  align-items: center;

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: 1fr;
    gap: 56px;
    text-align: center;
   }
`;

const GradientOrb = styled.div<{
  $x: string;
  $y: string;
  $color: string;
  $size: string;
}>`
  position: absolute;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  left: ${({ $x }) => $x};
  top: ${({ $y }) => $y};
  background: ${({ $color }) => $color};
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.18;
  pointer-events: none;
`;

const GridPattern = styled.div`
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(33, 150, 243, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(33, 150, 243, 0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  pointer-events: none;
`;

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  animation: ${fadeUp} 0.6s ease both;
`;

const Pulse = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  display: inline-block;
  animation: pulse 2s ease-in-out infinite;

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }
`;

const Heading = styled.h1`
  font-size: clamp(36px, 7vw, 72px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  line-height: 1.1;
  letter-spacing: -1.5px;
  color: ${({ theme }) => theme.colors.text.primary};
  max-width: 900px;
  animation: ${fadeUp} 0.6s ease 0.1s both;

  span {
    background: linear-gradient(135deg, #2196f3, #64b5f6, #2196f3);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: ${shimmer} 3s linear infinite;
  }
`;

const Subheading = styled.p`
  font-size: clamp(16px, 2.5vw, 20px);
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
  margin: ${({ theme }) => theme.spacing.xl} auto 0;
  animation: ${fadeUp} 0.6s ease 0.2s both;
`;

const CTAGroup = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing["2xl"]};
  flex-wrap: wrap;
  justify-content: flex-start;
  animation: ${fadeUp} 0.6s ease 0.3s both;


  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    justify-content: center;
   }
`;

// Left column wrapper (keeps the original fade-up stagger).
const HeroCopy = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    align-items: center;
   }
`

// --- PRIMARY CTA BUTTON (now a styled Link) ---
const PrimaryBtn = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.default};
  box-shadow: 0 4px 20px rgba(33, 150, 243, 0.35);
  text-decoration: none;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(33, 150, 243, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

// --- SECONDARY CTA (already a styled Link) ---
const SecondaryBtn = styled(Link)`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.default};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  transition: all ${({ theme }) => theme.transition.default};
  text-decoration: none;

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.accentMuted};
  }
`;

const Stats = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: ${({ theme }) => theme.spacing["2xl"]};
  margin-top: ${({ theme }) => theme.spacing["3xl"]};
  animation: ${fadeUp} 0.6s ease 0.4s both;

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    gap: ${({ theme }) => theme.spacing.xl};
  }
`;

const Stat = styled.div`
  text-align: center;
`;

const StatValue = styled.div`
  font-size: ${({ theme }) => theme.font.size["2xl"]};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.5px;
`;

const StatLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
`;

const StatDivider = styled.div`
  width: 1px;
  height: 32px;
  background: ${({ theme }) => theme.colors.border.subtle};
`;

const PreviewWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 520px;
  justify-self: center;
  animation: ${fadeUp} 0.8s ease 0.5s both;


  // Glow behind the product shot.
  &::before {
    content: "";
    position: absolute;
    inset: -12%;
    background: radial-gradient(circle, rgba(33,150,243,0.25), transparent 65%);
    filter: blur(24px);
    z-index: 0;
    pointer-events: none;
   }

  // Slight tilt makes the mockup feel like a floating product shot.

  transform: rotate(-1.2deg);

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    transform: none;
   }
`;

const PreviewFrame = styled.div`
  position: relative;
  z-index: 1;
  border-radius: ${({ theme }) => theme.radius.lg};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: ${({ theme }) => theme.colors.bg.secondary};
  overflow: hidden;
  box-shadow: ${({ theme }) => theme.shadow.xl};
  animation: ${float} 6s ease-in-out infinite;
`;

const PreviewBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  background: ${({ theme }) => theme.colors.bg.tertiary};
`

const PreviewBarLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`

const PreviewUrlPill = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bg.input};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
`

const LiveDot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.status.published};
  box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.status.publishedBg};
`;

const Dot = styled.div<{ $color: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const PreviewContent = styled.div`
  display: flex;
  height: 460px;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    height: 320px;
  }
`;

const PreviewLeft = styled.div`
  width: 220px;
  border-right: 1px solid ${({ theme }) => theme.colors.border.subtle};
  padding: ${({ theme }) => theme.spacing.md};
  flex-shrink: 0;

  @media (max-width: ${({ theme }) => theme.breakpoint.md}) {
    width: 140px;
  }
`;

const PreviewChannelLabel = styled.div`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  text-transform: uppercase;
  letter-spacing: 0.6px;
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  margin-bottom: ${({ theme }) => theme.spacing.md};
  padding-left: 4px;
`;

const PreviewChannel = styled.div<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: ${({ theme }) => theme.radius.sm};
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accentMuted : "transparent"};
  margin-bottom: 2px;
`;

const PreviewChannelAvatar = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
`;

const PreviewChannelName = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

const PreviewMemberCount = styled.span`
  margin-left: auto;
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const PreviewCenter = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PreviewFeedHeader = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
`;

const PreviewFeed = styled.div`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.md};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  overflow: hidden;
`;

const PreviewCard = styled.div<{ $highlighted?: boolean }>`
  background: ${({ $highlighted, theme }) =>
    $highlighted ? theme.colors.bg.messageSelected : theme.colors.bg.message};
  border-radius: ${({ theme }) => theme.radius.md};
  padding: 10px 12px;
  border: 1px solid
    ${({ $highlighted, theme }) =>
      $highlighted ? theme.colors.border.accent : "transparent"};
`;

const PreviewCardText = styled.div`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.primary};
  line-height: 1.5;
  margin-bottom: 6px;
`;

const PreviewCardMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const PreviewCardBadge = styled.span<{ $status: string }>`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ $status, theme }) =>
    $status === "scheduled"
      ? theme.colors.status.scheduled
      : $status === "published"
        ? theme.colors.status.published
        : theme.colors.status.draft};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`;

const PreviewCardTime = styled.span`
  font-size: ${({ theme }) => theme.font.size.xs};
  color: ${({ theme }) => theme.colors.text.timestamp};
`;

const PreviewComposer = styled.div`
  padding: 10px 16px;
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PreviewInput = styled.div`
  flex: 1;
  height: 32px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.bg.input};
  display: flex;
  align-items: center;
  padding: 0 12px;
`;

const PreviewInputText = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`;

const PreviewSendBtn = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
`;

// ============================================
// Main Component
// ============================================
export default function Hero() {
  return (
    <HeroSection id="hero">
      <GridPattern />
      <GradientOrb $x="10%" $y="20%" $color="#2196f3" $size="600px" />
      <GradientOrb $x="70%" $y="60%" $color="#1565c0" $size="400px" />

      <HeroInner>
        <HeroCopy>
        <Badge>
        <Pulse />
        Telegram Channel Management
      </Badge>

      <Heading>
        Schedule your Telegram content. <span>Automatically.</span>
      </Heading>

      <Subheading>
        Create, schedule and manage Telegram channel posts from one simple
        dashboard. Your bot publishes. You stay in control.
      </Subheading>

      <CTAGroup>
        <PrimaryBtn href="/login" id="hero-get-started-btn">
          ✈ Get Started Free
        </PrimaryBtn>
        <SecondaryBtn href="#features" id="hero-view-features-btn">
          Explore Features →
        </SecondaryBtn>
      </CTAGroup>

      <Stats>
        <Stat>
          <StatValue>10K+</StatValue>
          <StatLabel>Posts Scheduled</StatLabel>
        </Stat>
        <StatDivider />
        <Stat>
          <StatValue>500+</StatValue>
          <StatLabel>Channels Managed</StatLabel>
        </Stat>
        <StatDivider />
        <Stat>
          <StatValue>99.9%</StatValue>
          <StatLabel>Uptime</StatLabel>
        </Stat>
      </Stats>
      </HeroCopy>

      <PreviewWrapper>
        <PreviewFrame>
          <PreviewBar>
            <PreviewBarLeft>
              <Dot $color="#ff5f57" />
              <Dot $color="#febc2e" />
              <Dot $color="#28c840" />
            </PreviewBarLeft>
            <PreviewUrlPill>
              <LiveDot />
              telegrampost.vercel.app
            </PreviewUrlPill>
          </PreviewBar>
          <PreviewContent>
            <PreviewLeft>
              <PreviewChannelLabel>Channels</PreviewChannelLabel>
              <PreviewChannel $active>
                <PreviewChannelAvatar $color="#2196f3">C</PreviewChannelAvatar>
                <PreviewChannelName>@CryptoTrading</PreviewChannelName>
                <PreviewMemberCount>12.4K</PreviewMemberCount>
              </PreviewChannel>
              <PreviewChannel>
                <PreviewChannelAvatar $color="#9c27b0">M</PreviewChannelAvatar>
                <PreviewChannelName>@MarketSignals</PreviewChannelName>
                <PreviewMemberCount>8.9K</PreviewMemberCount>
              </PreviewChannel>
              <PreviewChannel>
                <PreviewChannelAvatar $color="#f44336">N</PreviewChannelAvatar>
                <PreviewChannelName>@DailyNews</PreviewChannelName>
                <PreviewMemberCount>31.2K</PreviewMemberCount>
              </PreviewChannel>
            </PreviewLeft>
            <PreviewCenter>
              <PreviewFeedHeader>@CryptoTrading</PreviewFeedHeader>
              <PreviewFeed>
                <PreviewCard $highlighted>
                  <PreviewCardText>
                    📈 BTC is approaching yesterday&apos;s high at $68,420.
                    Watch for a breakout...
                  </PreviewCardText>
                  <PreviewCardMeta>
                    <PreviewCardBadge $status="scheduled">
                      🕐 Scheduled · 9:00 PM
                    </PreviewCardBadge>
                    <PreviewCardTime>Today</PreviewCardTime>
                  </PreviewCardMeta>
                </PreviewCard>
                <PreviewCard>
                  <PreviewCardText>
                    📊 Daily Trading Recap — Market closed green. BTC +3.2%, ETH
                    +4.1%...
                  </PreviewCardText>
                  <PreviewCardMeta>
                    <PreviewCardBadge $status="published">
                      ✓ Published
                    </PreviewCardBadge>
                    <PreviewCardTime>11:00 PM</PreviewCardTime>
                  </PreviewCardMeta>
                </PreviewCard>
                <PreviewCard>
                  <PreviewCardText>
                    ⚡️ New Signal: ETH/USDT · Entry: $3,420
                  </PreviewCardText>
                  <PreviewCardMeta>
                    <PreviewCardBadge $status="draft">○ Draft</PreviewCardBadge>
                    <PreviewCardTime>—</PreviewCardTime>
                  </PreviewCardMeta>
                </PreviewCard>
              </PreviewFeed>
              <PreviewComposer>
                <span>📎</span>
                <PreviewInput>
                  <PreviewInputText>Write a message...</PreviewInputText>
                </PreviewInput>
                <PreviewSendBtn>➤</PreviewSendBtn>
              </PreviewComposer>
            </PreviewCenter>
          </PreviewContent>
        </PreviewFrame>
      </PreviewWrapper>
    </HeroInner>
    </HeroSection>
  );
}
