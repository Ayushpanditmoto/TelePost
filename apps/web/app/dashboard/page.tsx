'use client'

import CenterPanel from '@/components/dashboard/CenterPanel'
import RightPanel from '@/components/dashboard/RightPanel'
import { useDashboardStore } from '@/store/dashboardStore'

export default function DashboardPage() {
  const { selectedPostId } = useDashboardStore()

  return (
    <>
      <CenterPanel />
      {selectedPostId && <RightPanel />}
    </>
  )
}
