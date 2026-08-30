"use client";

import React from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import { PLANS } from "@/lib/plans";

// ----- Section Styles (enhanced) -----
const Section = styled.section`
  padding: 100px ${({ theme }) => theme.spacing["2xl"]};
  background: linear-gradient(
    180deg,
    ${({ theme }) => theme.colors.bg.primary} 0%,
    ${({ theme }) => theme.colors.bg.secondary} 100%
  );
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -40%;
    left: -10%;
    width: 60%;
    height: 80%;
    background: radial-gradient(
      circle,
      ${({ theme }) => theme.colors.accent + "15"},
      transparent 70%
    );
    pointer-events: none;
    z-index: 0;
  }
`;

const Inner = styled.div`
  max-width: 1100px;
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
  font-size: clamp(32px, 5vw, 48px);
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
  margin-bottom: ${({ theme }) => theme.spacing["4xl"]};
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
`;

// ----- Grid & Cards -----
const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${({ theme }) => theme.spacing["2xl"]};
  align-items: start;

  @media (max-width: ${({ theme }) => theme.breakpoint.lg}) {
    grid-template-columns: 1fr;
    max-width: 420px;
    margin: 0 auto;
  }
`;

const PlanCard = styled.div<{ $highlighted?: boolean }>`
  background: ${({ $highlighted, theme }) =>
    $highlighted
      ? `linear-gradient(145deg, ${theme.colors.bg.tertiary}, ${theme.colors.bg.secondary})`
      : theme.colors.bg.secondary};
  border: 2px solid
    ${({ $highlighted, theme }) =>
      $highlighted ? theme.colors.accent : theme.colors.border.subtle};
  border-radius: ${({ theme }) => theme.radius.xl};
  padding: ${({ theme }) => theme.spacing["2xl"]};
  padding-top: ${({ $highlighted, theme }) =>
    $highlighted ? theme.spacing["3xl"] : theme.spacing["2xl"]};
  position: relative;
  transition:
    transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
  height: 100%;
  backdrop-filter: ${({ $highlighted }) =>
    $highlighted ? "blur(8px)" : "none"};
  box-shadow: ${({ $highlighted, theme }) =>
    $highlighted
      ? `0 12px 40px ${theme.colors.accent}30`
      : "0 4px 20px rgba(0,0,0,0.06)"};

  ${({ $highlighted, theme }) =>
    $highlighted &&
    `
    border-color: ${theme.colors.accent};
    box-shadow: 0 0 30px ${theme.colors.accent}25, 0 12px 40px ${theme.colors.accent}15;
  `}

  &:hover {
    transform: ${({ $highlighted }) =>
      $highlighted ? "scale(1.03)" : "translateY(-6px)"};
    box-shadow: ${({ $highlighted, theme }) =>
      $highlighted
        ? `0 20px 60px ${theme.colors.accent}40`
        : `0 12px 40px rgba(0,0,0,0.1)`};
  }
`;

// ----- Popular Badge (enhanced) -----
const PopularBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 20px;
  border-radius: ${({ theme }) => theme.radius.full};
  background: linear-gradient(
    135deg,
    ${({ theme }) => theme.colors.accent},
    ${({ theme }) => theme.colors.accentHover}
  );
  color: #fff;
  font-size: ${({ theme }) => theme.font.size.xs};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: 0.8px;
  text-transform: uppercase;
  white-space: nowrap;
  box-shadow: 0 4px 12px ${({ theme }) => theme.colors.accent}40;
`;

// ----- Plan Content -----
const PlanName = styled.div`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  letter-spacing: -0.3px;
`;

const PlanPrice = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: ${({ theme }) => theme.spacing.xl};
`;

const PriceAmount = styled.span`
  font-size: 48px;
  font-weight: ${({ theme }) => theme.font.weight.bold};
  color: ${({ theme }) => theme.colors.text.primary};
  letter-spacing: -2px;
  line-height: 1;
`;

const PriceCurrency = styled.span`
  font-size: ${({ theme }) => theme.font.size.lg};
  color: ${({ theme }) => theme.colors.text.secondary};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  align-self: flex-start;
  margin-top: 6px;
`;

const PricePeriod = styled.span`
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.muted};
  font-weight: ${({ theme }) => theme.font.weight.medium};
  margin-left: 2px;
`;

const Divider = styled.hr`
  border: none;
  height: 1px;
  background: ${({ theme }) => theme.colors.border.subtle};
  margin: ${({ theme }) => theme.spacing.lg} 0
    ${({ theme }) => theme.spacing.xl};
  opacity: 0.6;
`;

const FeatureList = styled.ul`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
  margin-bottom: ${({ theme }) => theme.spacing["3xl"]};
  flex: 1;
  padding: 0;
  list-style: none;
`;

const FeatureItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: ${({ theme }) => theme.font.size.sm};
  color: ${({ theme }) => theme.colors.text.secondary};
  line-height: 1.5;
`;

const CheckIcon = styled.span`
  color: ${({ theme }) => theme.colors.status.published};
  font-size: 16px;
  flex-shrink: 0;
  margin-top: 1px;
  font-weight: bold;
`;

// ----- CTA Button (gradient + hover) -----
const PlanBtn = styled.button<{ $highlighted?: boolean }>`
  width: 100%;
  padding: 14px;
  border-radius: ${({ theme }) => theme.radius.full};
  font-size: ${({ theme }) => theme.font.size.md};
  font-weight: ${({ theme }) => theme.font.weight.semibold};
  transition: all 0.25s ease;
  cursor: pointer;
  border: none;
  position: relative;
  overflow: hidden;

  ${({ $highlighted, theme }) =>
    $highlighted
      ? `
    background: linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.accentHover});
    color: #fff;
    box-shadow: 0 6px 24px ${theme.colors.accent}40;
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 40px ${theme.colors.accent}60;
    }
    &:active {
      transform: scale(0.97);
    }
  `
      : `
    background: ${theme.colors.bg.primary};
    color: ${theme.colors.text.primary};
    border: 1px solid ${theme.colors.border.default};
    &:hover {
      border-color: ${theme.colors.accent};
      background: ${theme.colors.accentMuted};
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
  `}/* Ripple effect on click (optional) – we skip for brevity */
`;

// ============================================
// Main Component
// ============================================
export default function Pricing() {
  const router = useRouter();
  return (
    <Section id="pricing">
      <Inner>
        <SectionLabel>
          <Label>✦ Pricing</Label>
        </SectionLabel>
        <SectionTitle>Choose the plan that fits your needs</SectionTitle>
        <SectionSubtitle>
          Start for free – upgrade anytime as your channel grows.
        </SectionSubtitle>
        <Grid>
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} $highlighted={plan.highlighted}>
              {plan.highlighted && <PopularBadge>⭐ Most Popular</PopularBadge>}
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
                onClick={() => {
                  if (plan.slug === "free") router.push("/login");
                  else router.push("/login?upgrade=" + plan.slug);
                }}
              >
                {plan.price === 0 ? "Start Free" : `Get ${plan.name}`}
              </PlanBtn>
            </PlanCard>
          ))}
        </Grid>
      </Inner>
    </Section>
  );
}
