'use client'

import React, { useState } from 'react'
import styled from 'styled-components'

const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.colors.bg.secondary};
`

const Inner = styled.div`
  max-width: 720px;
  margin: 0 auto;
`

const SectionLabel = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`

const Label = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 5px 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  border: 1px solid ${({ theme }) => theme.colors.border.accent};
  background: ${({ theme }) => theme.colors.accentMuted};
  color: ${({ theme }) => theme.colors.text.accent};
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
`

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.5px;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`

const Item = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.md};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg.primary};
  transition: border-color ${({ theme }) => theme.transition.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.border.default};
  }
`

const Question = styled.button`
  width: 100%;
  text-align: left;
  padding: ${({ theme }) => theme.spacing.lg} ${({ theme }) => theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.spacing.md};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  color: ${({ theme }) => theme.colors.text.primary};
  background: transparent;
  transition: color ${({ theme }) => theme.transition.fast};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Chevron = styled.span<{ $open: boolean }>`
  font-size: 12px;
  color: ${({ theme }) => theme.colors.text.muted};
  transition: transform ${({ theme }) => theme.transition.fast};
  transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'rotate(0deg)')};
  flex-shrink: 0;
`

const Answer = styled.div<{ $open: boolean }>`
  max-height: ${({ $open }) => ($open ? '300px' : '0')};
  overflow: hidden;
  transition: max-height ${({ theme }) => theme.transition.slow};
`

const AnswerInner = styled.div`
  padding: 0 ${({ theme }) => theme.spacing.xl} ${({ theme }) => theme.spacing.lg};
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
`

const FAQS = [
  {
    q: 'Do I need to create a Telegram bot?',
    a: 'Yes — but it takes under a minute. Message @BotFather on Telegram, create a bot, and paste the token into TelePost. We validate it, encrypt it, and handle everything from there.',
  },
  {
    q: 'Is my bot token safe?',
    a: 'Absolutely. Your token is validated once during connection, then encrypted using AES-256-GCM. We never return it in API responses, never log it, and never store it in plain text. Only the publishing engine decrypts it temporarily to send messages.',
  },
  {
    q: 'What happens if a post fails to publish?',
    a: 'Failed posts are clearly marked with an error message explaining what went wrong. You can retry them with one click, edit the content, or reschedule for a different time.',
  },
  {
    q: 'Can I manage multiple Telegram channels?',
    a: 'Yes — depending on your plan. The Free plan supports 1 channel. Pro supports 5, and Business supports up to 20. Each channel connects through your own bot.',
  },
  {
    q: 'Does scheduling work while I am offline?',
    a: 'Yes. Scheduling is fully automated on the server side. A cron job checks for due posts every minute and publishes them through your bot — you do not need to be online.',
  },
  {
    q: 'Can I use the same bot for multiple channels?',
    a: 'Yes. One bot can be added as admin on multiple channels. Just make sure it has permission to post messages in each one.',
  },
  {
    q: 'What timezones are supported?',
    a: 'All standard IANA timezones. You pick your timezone in settings; all scheduled times are shown relative to it. Internally, everything is stored in UTC.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i)

  return (
    <Section id="faq">
      <Inner>
        <SectionLabel>
          <Label>✦ FAQ</Label>
        </SectionLabel>
        <SectionTitle>Common questions</SectionTitle>
        <List>
          {FAQS.map((faq, i) => (
            <Item key={i}>
              <Question onClick={() => toggle(i)} id={`faq-item-${i}`}>
                {faq.q}
                <Chevron $open={openIndex === i}>▼</Chevron>
              </Question>
              <Answer $open={openIndex === i}>
                <AnswerInner>{faq.a}</AnswerInner>
              </Answer>
            </Item>
          ))}
        </List>
      </Inner>
    </Section>
  )
}
