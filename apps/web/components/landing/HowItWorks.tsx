'use client'

import React from 'react'
import styled from 'styled-components'

const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing['2xl']};
  background: ${({ theme }) => theme.colors.bg.secondary};
`

const Inner = styled.div`
  max-width: 900px;
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
`

const SectionTitle = styled.h2`
  text-align: center;
  font-size: clamp(28px, 4vw, 42px);
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -0.5px;
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`

const Steps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  position: relative;
`

const StepLine = styled.div`
  position: absolute;
  left: 27px;
  top: 56px;
  bottom: 56px;
  width: 2px;
  background: linear-gradient(
    to bottom,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.border.subtle}
  );

  @media (max-width: ${({ theme }) => theme.breakpoint.sm}) {
    display: none;
  }
`

const Step = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.xl};
  padding: 24px 0;
  position: relative;
`

const StepNumber = styled.div<{ $active?: boolean }>`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.bg.tertiary};
  border: 2px solid ${({ $active, theme }) =>
    $active ? theme.colors.accent : theme.colors.border.subtle};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ $active, theme }) => ($active ? '#fff' : theme.colors.text.muted)};
  flex-shrink: 0;
  z-index: 1;
  position: relative;
  transition: all ${({ theme }) => theme.transition.default};
`

const StepContent = styled.div`
  padding-top: 12px;
`

const StepTitle = styled.h3`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`

const StepDesc = styled.p`
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: ${({ theme }) => theme.font.lineHeight.relaxed};
  max-width: 600px;
`

const STEPS = [
  {
    num: 1,
    title: 'Login with Telegram',
    desc: 'One click. No passwords. We verify your identity directly through Telegram — your data stays yours.',
    active: true,
  },
  {
    num: 2,
    title: 'Choose a plan',
    desc: 'Start for free with one channel. Upgrade to Pro or Business when you need more scale.',
    active: false,
  },
  {
    num: 3,
    title: 'Connect your Telegram bot',
    desc: 'Create a bot via BotFather, paste the token once. We validate and encrypt it — you never see it again.',
    active: false,
  },
  {
    num: 4,
    title: 'Connect your channel',
    desc: 'Add your bot as an admin of your channel, then connect it here. We verify access with a test message.',
    active: false,
  },
  {
    num: 5,
    title: 'Create and schedule posts',
    desc: 'Write your message, attach media, pick a time. Your bot publishes automatically — even while you sleep.',
    active: false,
  },
]

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
  )
}
