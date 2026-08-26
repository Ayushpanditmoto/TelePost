"use client";

import React from "react";
import styled from "styled-components";

// ----- Section (with subtle gradient and decorative glow) -----
const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing["2xl"]};
  background: ${({ theme }) => theme.colors.bg.secondary};
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -30%;
    right: -10%;
    width: 50%;
    height: 70%;
    background: radial-gradient(
      circle,
      ${({ theme }) => theme.colors.accent + "12"},
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
  }
`;

const Inner = styled.div`
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const SectionLabel = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const Label = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 18px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  backdrop-filter: blur(4px);
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(32px, 4.5vw, 46px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
  line-height: 1.2;
`;

// ----- Steps container (with animated connecting line) -----
const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
`;

const StepLine = styled.div`
  position: absolute;
  left: 27px;
  top: 56px;
  bottom: 56px;
  width: 3px;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.border.subtle} 80%
  );
  border-radius: 2px;
  opacity: 0.6;

  /* Subtle pulsing animation for the line */
  @keyframes pulseLine {
    0% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
    100% {
      opacity: 0.4;
    }
  }
  animation: pulseLine 3s ease-in-out infinite;

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: none;
  }
`;

// ----- Individual Step (with hover lift) -----
const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: 28px 0;
  position: relative;
  transition:
    transform 0.2s ease,
    background 0.2s ease;
  border-radius: ${({ theme }) => theme.radius.lg};

  &:hover {
    transform: translateX(6px);
    background: ${({ theme }) => theme.colors.bg.tertiary + "30"};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    gap: ${({ theme }) => theme.spacing.lg};
    padding: 20px 0;
  }
`;

// ----- Step Number (with gradient, glow, and active state) -----
const StepNumber = styled.div<{ $active?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  flex-shrink: 0;
  z-index: 2;
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  ${({ $active, theme }) =>
    $active
      ? `
    background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover});
    color: #fff;
    box-shadow: 0 6px 24px ${theme.colors.accent}50;
    border: 2px solid ${theme.colors.accent};
    &::after {
      content: '✓';
      position: absolute;
      bottom: -6px;
      right: -6px;
      background: ${theme.colors.status.published};
      color: #fff;
      font-size: 10px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
  `
      : `
    background: ${theme.colors.bg.primary};
    color: ${theme.colors.text.muted};
    border: 2px solid ${theme.colors.border.subtle};
  `}

  /* Hover effect for non-active numbers */
  ${({ $active, theme }) =>
    !$active &&
    `
    &:hover {
      border-color: ${theme.colors.border.accent};
      color: ${theme.colors.text.primary};
      transform: scale(1.05);
    }
  `}
`;

// ----- Step Content (with better typography) -----
const StepContent = styled.div`
  padding-top: 8px;
  flex: 1;
`;

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  display: flex;
  align-items: center;
  gap: 8px;

  /* Small emoji/icon before title – optional, can be added via data */
  &::before {
    content: "→";
    color: ${({ theme }) => theme.colors.accent};
    font-size: 20px;
    opacity: 0.6;
    transition: transform 0.2s ease;
  }

  ${Step}:hover &::before {
    transform: translateX(4px);
    opacity: 1;
  }
`;

const StepDesc = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  max-width: 600px;
  margin-bottom: 0;
`;

// ----- Step data (with optional icon/emoji) -----
const STEPS = [
  {
    num: 1,
    title: "Login with Telegram",
    desc: "One click. No passwords. We verify your identity directly through Telegram — your data stays yours.",
    active: true,
  },
  {
    num: 2,
    title: "Add @Panditfxbot to your channel",
    desc: "No bot setup needed. Open your channel, go to Administrators, and add @Panditfxbot as an admin.",
    active: false,
  },
  {
    num: 3,
    title: "Connect your channel",
    desc: "Paste your channel’s @username in the dashboard. We instantly verify the bot has access.",
    active: false,
  },
  {
    num: 4,
    title: "Create and schedule posts",
    desc: "Write your message, attach media, pick a time. We publish automatically — even while you sleep.",
    active: false,
  },
];

// ============================================
// Main Component
// ============================================
export default function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Inner>
        <SectionLabel>
          <Label>✦ How It Works</Label>
        </SectionLabel>
        <SectionTitle>Up and running in 5 minutes</SectionTitle>
        <Steps>
          <StepLine />
          {STEPS.map((step) => (
            <Step key={step.num}>
              <StepNumber $active={step.active}>{step.num}</StepNumber>
              <StepContent>
                <StepTitle>{step.title}</StepTitle>
                <StepDesc>{step.desc}</StepDesc>
              </StepContent>
            </Step>
          ))}
        </Steps>
      </Inner>
    </Section>
  );
}
