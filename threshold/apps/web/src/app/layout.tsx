import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Threshold — Train smarter. Push your threshold.',
  description: 'AI-powered adaptive training for HYROX, powerlifting, bodybuilding, CrossFit, running and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
