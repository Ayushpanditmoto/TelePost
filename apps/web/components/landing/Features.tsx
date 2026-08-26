"use client";

import React from "react";
import styled from "styled-components";

const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing["2xl"]};
  position: relative;
`;

const Inner = styled.div`
  max-width: 1200px;
  margin: 0 auto;
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
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.5px;
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  max-width: 560px;
  margin: 0 auto ${({ theme }) => theme.spacing["3xl"]};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: ${({ theme }) => theme.spacing.lg};

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: ${({ theme }) => theme.colors.bg.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.lg};
  padding: ${({ theme }) => theme.spacing.xl};
  transition:
    border-color ${({ theme }) => theme.transition.default},
    transform ${({ theme }) => theme.transition.default},
    box-shadow ${({ theme }) => theme.transition.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.accent};
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadow.md};
  }
`;

const IconWrapper = styled.div`
  width: 44px;
  height: 44px;
  border-radius: ${({ theme }) => theme.radius.md};
  background: ${({ theme }) => theme.colors.accentMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const CardTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const CardDesc = styled.p`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
`;

const FEATURES = [
  {
    icon: "📅",
    title: "Schedule Posts",
    desc: "Pick any date, time, and timezone. Your post goes out automatically — no manual intervention needed.",
  },
  {
    icon: "📢",
    title: "Multiple Channels",
    desc: "Manage several Telegram channels from a single dashboard, with clear separation between them.",
  },
  {
    icon: "🖼️",
    title: "Images & Videos",
    desc: "Attach media to your posts. Preview exactly how they will appear in the channel before publishing.",
  },
  {
    icon: "🔁",
    title: "Recurring Posts",
    desc: "Set daily, weekly, or custom schedules. Perfect for consistent content routines and announcements.",
  },
  {
    icon: "🤖",
    title: "No Bot Setup Needed",
    desc: "No BotFather, no tokens, no API keys. Just add @Panditfxbot as an admin to your channel and start posting.",
  },
  {
    icon: "🕓",
    title: "Timezone Support",
    desc: "Schedule in your local timezone. All times stored in UTC — displayed exactly right for your audience.",
  },
  {
    icon: "📜",
    title: "Post History",
    desc: "Full audit trail of every post — published, failed, cancelled. Retry failed posts with one click.",
  },
  {
    icon: "🔐",
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
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <IconWrapper>{f.icon}</IconWrapper>
              <CardTitle>{f.title}</CardTitle>
              <CardDesc>{f.desc}</CardDesc>
            </Card>
          ))}
        </Grid>
      </Inner>
    </Section>
  );
}
