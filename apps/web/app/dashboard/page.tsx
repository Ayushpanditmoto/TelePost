'use client'

import styled from 'styled-components'
import CenterPanel from '@/components/dashboard/CenterPanel'
import RightPanel from '@/components/dashboard/RightPanel'
import { useDashboardStore } from '@/store/dashboardStore'

const Workspace = styled.div`
  display: flex;
  width: 100%;
  height: 100%;
  min-width: 0;
`

export default function DashboardPage() {
  const { selectedPostId } = useDashboardStore()

  return (
    <Workspace>
      <CenterPanel />
      {selectedPostId && <RightPanel />}
    </Workspace>
  )
}
