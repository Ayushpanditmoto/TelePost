'use client'

import styled from 'styled-components'
import LeftPanel from '@/components/dashboard/LeftPanel'
import CenterPanel from '@/components/dashboard/CenterPanel'
import RightPanel from '@/components/dashboard/RightPanel'
import { useDashboardStore } from '@/store/dashboardStore'

const Shell = styled.div`
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.bg.primary};
`

export default function DashboardPage() {
  const { selectedPostId } = useDashboardStore()

  return (
    <Shell id="dashboard-shell">
      <LeftPanel />
      <CenterPanel />
      {selectedPostId && <RightPanel />}
    </Shell>
  )
}
