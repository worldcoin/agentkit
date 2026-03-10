import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dropping Air',
  description: 'Sybil-resistant token airdrop powered by World ID and AgentKit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-surface antialiased">
        <nav className="sticky top-0 z-50 border-b border-border bg-white">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
            <Link href="/" className="font-semibold text-text-primary">
              Dropping Air
            </Link>
            <div className="flex items-center gap-5">
              <Link
                href="/"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Claim
              </Link>
              <Link
                href="/register"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Register
              </Link>
              <Link
                href="/status"
                className="text-sm text-text-secondary transition-colors hover:text-text-primary"
              >
                Status
              </Link>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                Base
              </span>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-6 py-10">{children}</main>
      </body>
    </html>
  )
}
