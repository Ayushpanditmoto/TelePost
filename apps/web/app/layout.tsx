import type { Metadata } from 'next'
import Providers from './providers'

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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
