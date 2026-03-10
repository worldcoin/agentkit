import RegisterForm from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold text-text-primary">Register Your Agent</h1>
        <p className="text-text-secondary max-w-2xl">
          Verify your identity with World ID and link your wallet to the AgentBook. This is
          required before you can claim the airdrop.
        </p>
      </div>

      <RegisterForm />

      <div className="rounded-xl border border-border bg-surface-raised p-6">
        <h3 className="text-sm font-semibold text-text-primary mb-3">What happens</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              1
            </div>
            <p className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">Connect</span> your wallet to
              identify the agent address.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              2
            </div>
            <p className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">Verify</span> with World ID using
              your Orb-verified identity.
            </p>
          </div>
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
              3
            </div>
            <p className="text-sm text-text-secondary">
              <span className="text-text-primary font-medium">Register</span> on-chain. Your
              wallet is linked to your anonymous human ID.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
