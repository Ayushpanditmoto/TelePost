'use client'

import styled from 'styled-components'
import DashboardGuard from '@/components/dashboard/DashboardGuard'
import LeftPanel from '@/components/dashboard/LeftPanel'

const Shell = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg.primary};
`

const Viewport = styled.div`
  flex: 1;
  min-width: 0;
  height: 100vh;
  overflow: auto;
`

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardGuard>
      <Shell id="dashboard-shell">
        <LeftPanel />
        <Viewport>{children}</Viewport>
      </Shell>
    </DashboardGuard>
  )
}
