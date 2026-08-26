import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Providers from './providers'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'TelePost — Schedule Your Telegram Content',
  description:
    'Create, schedule and manage Telegram channel posts from one simple dashboard. Automatic publishing through your own Telegram bot.',
  keywords: ['telegram', 'scheduler', 'channel', 'posts', 'automation', 'bot'],
  openGraph: {
    title: 'TelePost — Schedule Your Telegram Content',
    description: 'Create, schedule and manage Telegram channel posts from one simple dashboard.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={inter.variable} suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
