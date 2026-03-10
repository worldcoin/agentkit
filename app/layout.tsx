import type { Metadata } from 'next'
import Link from 'next/link'
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
          <header className="mb-6 flex items-center justify-between border-b border-border/70 pb-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary">
                Agent Network
              </p>
              <h1 className="font-mono text-sm text-text-primary">Dropping Air Console</h1>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
        <Analytics />
      </body>
    </html>
  )
}
