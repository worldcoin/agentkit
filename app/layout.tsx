import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dropping Air',
  description: 'Sybil-resistant token airdrop powered by World ID and AgentKit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-surface antialiased">
        <div className="matrix-grid pointer-events-none fixed inset-0 opacity-20" />
        <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-8 pt-4 sm:px-6">
          <main className="flex-1 flex items-center justify-center w-full">{children}</main>
          <Analytics />
        </div>
      </body>
    </html>
  )
}
