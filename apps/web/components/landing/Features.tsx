"use client";

import React from "react";
import styled from "styled-components";
import {
  Calendar,
  Users,
  Image,
  Repeat,
  Bot,
  Clock,
  History,
  Shield,
} from "lucide-react";

const ICON_MAP = {
  "Schedule Posts": Calendar,
  "Multiple Channels": Users,
  "Images & Videos": Image,
  "Recurring Posts": Repeat,
  "No Bot Setup Needed": Bot,
  "Timezone Support": Clock,
  "Post History": History,
  "Simple & Safe": Shield,
};

const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing["2xl"]};
  position: relative;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg.primary};

  &::before {
    content: "";
    position: absolute;
    top: -20%;
    right: -10%;
    width: 50%;
    height: 80%;
    background: radial-gradient(
      circle,
      ${({ theme }) => theme.colors.accent + "10"},
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
  }
`;

const Inner = styled.div`
  max-width: 1200px;
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
  margin-bottom: ${({ theme }) => theme.spacing.md};
  line-height: 1.2;
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 600px;
  margin: 0 auto ${({ theme }) => theme.spacing["4xl"]};
  line-height: 1.6;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${({ theme }) => theme.spacing.lg};
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: 1fr;
    gap: ${({ theme }) => theme.spacing.md};
  }
`;

// ----- Updated Card: center everything -----
const Card = styled.div`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing.xl};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center; /* center horizontally */
  text-align: center; /* center text */
  gap: ${({ theme }) => theme.spacing.sm};

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 2px;
    background: linear-gradient(
      135deg,
      ${({ theme }) => theme.colors.accent},
      transparent 60%
    );
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    mask:
      linear-gradient(#fff 0 0) content-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    -webkit-mask-composite: xor;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: ${({ theme }) => theme.colors.border.accent};
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);

    &::after {
      opacity: 1;
    }
  }

  &:hover .icon-wrapper {
    transform: scale(1.1) rotate(-2deg);
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
  }
`;

const IconWrapper = styled.div`
  width: 52px;
  height: 52px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accentMuted},
    ${({ theme }) => theme.colors.bg.tertiary}
  );
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  flex-shrink: 0;
  margin-bottom: ${({ theme }) => theme.spacing.sm}; /* reduced from md */
  color: ${({ theme }) => theme.colors.text.accent};

  svg {
    width: 24px;
    height: 24px;
    stroke-width: 1.8;
  }
`;

// Title and Desc remain unchanged but inherit text-align: center from Card
const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin: 0;
  letter-spacing: -0.3px;
`;

const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.6;
  margin: 0;
  max-width: 90%; /* optional: prevent overly long lines */
`;

const FEATURES = [
  {
    iconKey: "Schedule Posts",
    title: "Schedule Posts",
    desc: "Pick any date, time, and timezone. Your post goes out automatically — no manual intervention needed.",
  },
  {
    iconKey: "Multiple Channels",
    title: "Multiple Channels",
    desc: "Manage several Telegram channels from a single dashboard, with clear separation between them.",
  },
  {
    iconKey: "Images & Videos",
    title: "Images & Videos",
    desc: "Attach media to your posts. Preview exactly how they will appear in the channel before publishing.",
  },
  {
    iconKey: "Recurring Posts",
    title: "Recurring Posts",
    desc: "Set daily, weekly, or custom schedules. Perfect for consistent content routines and announcements.",
  },
  {
    iconKey: "No Bot Setup Needed",
    title: "No Bot Setup Needed",
    desc: "No BotFather, no tokens, no API keys. Just add @Panditfxbot as an admin to your channel and start posting.",
  },
  {
    iconKey: "Timezone Support",
    title: "Timezone Support",
    desc: "Schedule in your local timezone. All times stored in UTC — displayed exactly right for your audience.",
  },
  {
    iconKey: "Post History",
    title: "Post History",
    desc: "Full audit trail of every post — published, failed, cancelled. Retry failed posts with one click.",
  },
  {
    iconKey: "Simple & Safe",
    title: "Simple & Safe",
    desc: "We never ask for your bot token or credentials. You only add our bot as an admin — nothing more.",
  },
];

export default function Features() {
  return (
    <Section id="features">
      <Inner>
        <SectionLabel>
          <Label>✦ Features</Label>
        </SectionLabel>
        <SectionTitle>Everything you need to run your channel</SectionTitle>
        <SectionSubtitle>
          Built for creators who want a clean, reliable tool — not a bloated
          enterprise platform.
        </SectionSubtitle>
        <Grid>
          {FEATURES.map((feature) => {
            const IconComponent =
              ICON_MAP[feature.iconKey as keyof typeof ICON_MAP];
            return (
              <Card key={feature.title}>
                <IconWrapper className="icon-wrapper">
                  <IconComponent />
                </IconWrapper>
                <CardTitle>{feature.title}</CardTitle>
                <CardDesc>{feature.desc}</CardDesc>
              </Card>
            );
          })}
        </Grid>
      </Inner>
    </Section>
  );
}
