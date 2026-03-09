import CampaignInfo from '@/components/CampaignInfo'
import ClaimForm from '@/components/ClaimForm'

export default function ClaimPage() {
	return (
		<div className="space-y-8">
			<div className="space-y-2">
				<h1 className="text-2xl font-semibold text-text-primary">Claim Airdrop</h1>
				<p className="text-text-secondary text-sm">
					Prove your agent is backed by a real human and claim your tokens. One claim per human.
				</p>
			</div>

			<CampaignInfo />
			<ClaimForm />

			<div className="rounded-xl border border-border bg-surface-raised p-5">
				<h3 className="text-sm font-semibold text-text-primary mb-3">How it works</h3>
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-text-muted">Step 1</p>
						<p className="text-sm text-text-secondary">
							<span className="text-text-primary font-medium">Register</span> your agent in the AgentBook with World ID.
						</p>
					</div>
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-text-muted">Step 2</p>
						<p className="text-sm text-text-secondary">
							<span className="text-text-primary font-medium">Sign</span> a challenge to prove wallet ownership.
						</p>
					</div>
					<div className="space-y-1.5">
						<p className="text-xs font-medium text-text-muted">Step 3</p>
						<p className="text-sm text-text-secondary">
							<span className="text-text-primary font-medium">Claim</span> tokens. The server verifies and sends them.
						</p>
					</div>
				</div>
			</div>
		</div>
	)
}
