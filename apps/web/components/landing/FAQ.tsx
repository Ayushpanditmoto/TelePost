"use client";

import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { ChevronDown, MessageCircle } from "lucide-react";

// ----- Animations -----
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

// ----- Section (clean background) -----
const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing["2xl"]};
  background: ${({ theme }) => theme.colors.bg.primary};
  position: relative;
`;

const Inner = styled.div`
  max-width: 720px;
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
  gap: 8px;
  padding: 6px 18px;
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
  font-size: clamp(32px, 4.5vw, 46px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.02em;
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
  line-height: 1.2;
`;

// ----- List (with separator) -----
const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border.subtle};
`;

// ----- Item (borders removed, only bottom separator) -----
const Item = styled.div<{ $open?: boolean }>`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.subtle};
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bg.secondary + "50"};
  }
`;

// ----- Question Button (clean, minimal) -----
const Question = styled.button`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.lg} 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;
  cursor: pointer;
  transition: color 0.2s ease;
  border: none;
  outline: none;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding: ${({ theme }) => theme.spacing.md} 0;
    font-size: ${({ theme }) => theme.font.size.sm};
  }
`;

// ----- Left side: icon + text -----
const QuestionContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconCircle = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accentMuted};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.text.accent};
  flex-shrink: 0;

  svg {
    width: 16px;
    height: 16px;
  }
`;

// ----- Chevron with rotation -----
const ChevronIcon = styled(ChevronDown)<{ $open: boolean }>`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.colors.text.muted};
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: ${({ $open }) => ($open ? "rotate(180deg)" : "rotate(0deg)")};
  flex-shrink: 0;
`;

// ----- Answer with smooth expand -----
const Answer = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? "300px" : "0")};
  overflow: hidden;
  transition: max-height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: max-height;
  animation: ${fadeIn} 0.3s ease both;
`;

const AnswerInner = styled.div`
  padding: 0 0 ${({ theme }) => theme.spacing.lg} 44px; /* align with text */
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.7;

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    padding-left: 0;
    padding-bottom: ${({ theme }) => theme.spacing.md};
  }
`;

// ----- Data (unchanged) -----
const FAQS = [
  {
    q: "Do I need to create my own Telegram bot?",
    a: "No. You don’t need BotFather, tokens, or API keys. Just add @Panditfxbot as an admin to your channel and you’re ready to schedule posts.",
  },
  {
    q: "Why add @Panditfxbot as an admin?",
    a: "Our bot publishes your scheduled posts. As an admin of your channel, it can post on your schedule — and nothing else. You can remove it any time.",
  },
  {
    q: "Is my channel safe?",
    a: "Yes. We only ask for the channel’s @username. We never ask for your bot token, your password, or access to your accounts. The bot can only post as an admin.",
  },
  {
    q: "What happens if a post fails to publish?",
    a: "Failed posts are clearly marked with an error message explaining what went wrong. You can retry them with one click, edit the content, or reschedule for a different time.",
  },
  {
    q: "Can I manage multiple Telegram channels?",
    a: "Yes — add @Panditfxbot as an admin to each channel and connect them all from the dashboard.",
  },
  {
    q: "Does scheduling work while I am offline?",
    a: "Yes. Scheduling is fully automated on the server side. A cron job checks for due posts every minute and publishes them through the bot — you do not need to be online.",
  },
  {
    q: "Can I use the bot on multiple channels?",
    a: "Yes. Add @Panditfxbot as an admin to as many channels as you manage, then connect each one from the dashboard.",
  },
  {
    q: "What timezones are supported?",
    a: "All standard IANA timezones. You pick your timezone in settings; all scheduled times are shown relative to it. Internally, everything is stored in UTC.",
  },
];

// ============================================
// Main Component
// ============================================
export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <Section id="faq">
      <Inner>
        <SectionLabel>
          <Label>✦ FAQ</Label>
        </SectionLabel>
        <SectionTitle>Common questions</SectionTitle>
        <List>
          {FAQS.map((faq, i) => (
            <Item key={i} $open={openIndex === i}>
              <Question onClick={() => toggle(i)} id={`faq-item-${i}`}>
                <QuestionContent>
                  <IconCircle>
                    <MessageCircle />
                  </IconCircle>
                  {faq.q}
                </QuestionContent>
                <ChevronIcon $open={openIndex === i} />
              </Question>
              <Answer $open={openIndex === i}>
                <AnswerInner>{faq.a}</AnswerInner>
              </Answer>
            </Item>
          ))}
        </List>
      </Inner>
    </Section>
  );
}
