import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard — TelePost',
  description: 'Manage and schedule your Telegram channel posts.',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
