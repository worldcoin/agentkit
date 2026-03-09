import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
	title: 'Dropping Air',
	description: 'Sybil-resistant token airdrop powered by World ID and AgentKit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-surface antialiased">
				<nav className="border-b border-border bg-white sticky top-0 z-50">
					<div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
						<a href="/" className="font-semibold text-text-primary">
							Dropping Air
						</a>
						<div className="flex items-center gap-5">
							<a href="/" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
								Claim
							</a>
							<a href="/register" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
								Register
							</a>
							<a href="/status" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
								Status
							</a>
							<span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
								Base
							</span>
						</div>
					</div>
				</nav>
				<main className="max-w-2xl mx-auto px-6 py-10">{children}</main>
			</body>
		</html>
	)
}
