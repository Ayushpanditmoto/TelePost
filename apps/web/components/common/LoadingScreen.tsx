'use client'

import React from 'react'
import styled, { keyframes } from 'styled-components'
import { Send } from 'lucide-react'

// Branded full-screen splash shown while the session/user query resolves
// (e.g. right after a hard reload). Replaces the old plain "Loading…" text.
const breathe = keyframes`
  0%, 100% { transform: scale(1); box-shadow: 0 4px 16px rgba(33, 150, 243, 0.4); }
  50% { transform: scale(1.07); box-shadow: 0 8px 28px rgba(33, 150, 243, 0.6); }
`

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`

const dotBounce = keyframes`
  0%, 80%, 100% { opacity: 0.25; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-5px); }
`

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  background: ${({ theme }) => theme.colors.bg.primary};
`

const SplashLogo = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 15px;
  background: linear-gradient(135deg, #37a5f7 0%, #1565c0 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.4);
  animation: ${breathe} 1.6s ease-in-out infinite;

  svg {
    width: 26px;
    height: 26px;
    color: #fff;
    filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25));
  }
`

const SplashWordmark = styled.div`
  font-size: ${({ theme }) => theme.font.size.xl};
  font-weight: ${({ theme }) => theme.font.weight.bold};
  letter-spacing: -0.5px;
  color: ${({ theme }) => theme.colors.text.primary};
  animation: ${fadeUp} 0.4s ease 0.1s both;

  b {
    background: linear-gradient(90deg, #64b5f6, #2196f3);
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`

const DotsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  animation: ${fadeUp} 0.4s ease 0.2s both;
`

const Dot = styled.span<{ $delay: string }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.accent};
  animation: ${dotBounce} 1.2s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay};
`

export default function LoadingScreen({ label }: { label?: string }) {
  return (
    <Overlay role="status" aria-label={label ?? 'Loading'} id="loading-screen">
      <SplashLogo>
        <Send strokeWidth={2.4} />
      </SplashLogo>
      <SplashWordmark>
        <b>Tele</b>Post
      </SplashWordmark>
      <DotsRow>
        <Dot $delay="0s" />
        <Dot $delay="0.15s" />
        <Dot $delay="0.3s" />
      </DotsRow>
    </Overlay>
  )
}