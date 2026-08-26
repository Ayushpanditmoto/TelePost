'use client'

import React from 'react'
import styled from 'styled-components'
import { PLANS } from '@/lib/plans'

const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing['2xl']};
`

const Inner = styled.div`
  max-width: 1100px;
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
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const SectionSubtitle = styled.p`
  text-align: center;
  font-size: ${({ theme }) => theme.font.size.md};
  color: ${({ theme }) => theme.colors.text.secondary};
  margin-bottom: ${({ theme }) => theme.spacing['3xl']};
`

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing.xl};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: 1fr;
    max-width: 400px;
    margin: 0 auto;
  }
`

const PlanCard = styled.div<{ $highlighted?: boolean }>`
  background: ${({ $highlighted, theme }) =>
    $highlighted ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
  border: 2px solid ${({ $highlighted, theme }) =>
    $highlighted ? theme.colors.accent : theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing['2xl']};
  position: relative;
  transition: transform ${({ theme }) => theme.transition.default},
    box-shadow ${({ theme }) => theme.transition.default};

  ${({ $highlighted, theme }) =>
    $highlighted &&
    `
    box-shadow: 0 0 40px rgba(33, 150, 243, 0.2);
    transform: scale(1.02);
  `}

  &:hover {
    transform: ${({ $highlighted }) => ($highlighted ? 'scale(1.04)' : 'translateY(-4px)')};
    box-shadow: ${({ theme }) => theme.shadow.lg};
  }
`

const PopularBadge = styled.div`
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 16px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
`

const PlanName = styled.div`
  font-size: ${({ theme }) => theme.font.size.lg};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.md};
`

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const PriceAmount = styled.span`
  font-size: 42px;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -1px;
`

const PriceCurrency = styled.span`
  font-size: ${({ theme }) => theme.font.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
`

const PricePeriod = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
`

const Divider = styled.div`
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`

const FeatureList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing['2xl']};
`

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.4;
`

const CheckIcon = styled.span`
  color: ${({ theme }) => theme.colors.status.published};
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
`

const PlanBtn = styled.button<{ $highlighted?: boolean }>`
  width: 100%;
  padding: 13px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all ${({ theme }) => theme.transition.default};

  ${({ $highlighted, theme }) =>
    $highlighted
      ? `
    background: ${theme.colors.accent};
    color: #fff;
    box-shadow: 0 4px 20px rgba(33, 150, 243, 0.35);
    &:hover {
      background: ${theme.colors.accentHover};
      box-shadow: 0 8px 30px rgba(33, 150, 243, 0.5);
      transform: translateY(-1px);
    }
  `
      : `
    background: transparent;
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.default};
    &:hover {
      border-color: ${theme.colors.border.accent};
      background: ${theme.colors.accentMuted};
    }
  `}
`

export default function Pricing() {
  return (
    <Section id="pricing">
      <Inner>
        <SectionLabel>
          <Label>✦ Pricing</Label>
        </SectionLabel>
        <SectionTitle>Simple, transparent pricing</SectionTitle>
        <SectionSubtitle>
          Start free. Upgrade when you need more power.
        </SectionSubtitle>
        <Grid>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} $highlighted={plan.highlighted}>
              {plan.highlighted && <PopularBadge>Most Popular</PopularBadge>}
              <PlanName>{plan.name}</PlanName>
              <PlanPrice>
                {plan.price === 0 ? (
                  <PriceAmount>Free</PriceAmount>
                ) : (
                  <>
                    <PriceCurrency>$</PriceCurrency>
                    <PriceAmount>{plan.price}</PriceAmount>
                    <PricePeriod>/month</PricePeriod>
                  </>
                )}
              </PlanPrice>
              <Divider />
              <FeatureList>
                {plan.features.map((f) => (
                  <FeatureItem key={f}>
                    <CheckIcon>✓</CheckIcon>
                    {f}
                  </FeatureItem>
                ))}
              </FeatureList>
              <PlanBtn
                $highlighted={plan.highlighted}
                id={`pricing-${plan.slug}-btn`}
              >
                {plan.price === 0 ? 'Get Started Free' : `Get ${plan.name}`}
              </PlanBtn>
            </PlanCard>
          ))}
        </Grid>
      </Inner>
    </Section>
  )
}
