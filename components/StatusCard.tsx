'use client'

import { useState } from 'react'

interface ClaimInfo {
  txHash: string
  amount: string
  claimedAt: string
  explorerUrl: string
}

interface StatusResult {
  registered: boolean
  humanId: string | null
  claimed: boolean
  claim: ClaimInfo | null
}

export default function StatusCard() {
  const [address, setAddress] = useState('')
  const [status, setStatus] = useState<StatusResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCheck = async () => {
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      setError('Please enter a valid Ethereum address')
      return
    }

    setLoading(true)
    setError(null)
    setStatus(null)

    try {
      const res = await fetch(`/api/status?address=${address}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to check status')
      setStatus(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary">Check Status</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Look up registration and claim status by address
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={e => setAddress(e.target.value)}
            placeholder="0x..."
            className="flex-1 px-3 py-2 rounded-lg bg-white border border-border
							text-text-primary placeholder:text-text-muted font-mono text-sm
							focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50
							transition-colors"
          />
          <button
            onClick={handleCheck}
            disabled={loading}
            className="px-4 py-2 rounded-lg font-medium text-sm text-white transition-all
							bg-primary hover:bg-primary-dark active:scale-[0.98]
							disabled:opacity-50 disabled:cursor-not-allowed
							focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              'Check'
            )}
          </button>
        </div>

        {error && (
          <div className="rounded-lg bg-error-bg border border-error/30 p-3">
            <p className="text-error text-xs">{error}</p>
          </div>
        )}

        {status && (
          <div className="rounded-lg bg-surface-overlay border border-border p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Registered</span>
              <Badge active={status.registered} activeLabel="Yes" inactiveLabel="No" />
            </div>

            {status.humanId && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted">Human ID</span>
                <span className="font-mono text-xs text-text-secondary">{status.humanId}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-text-muted">Claimed</span>
              <Badge active={status.claimed} activeLabel="Yes" inactiveLabel="No" />
            </div>

            {status.claim && (
              <>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Transaction</span>
                  <a
                    href={status.claim.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline font-mono text-xs"
                  >
                    {status.claim.txHash.slice(0, 10)}...{status.claim.txHash.slice(-8)}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted">Date</span>
                  <span className="text-xs text-text-secondary">
                    {new Date(status.claim.claimedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Badge({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean
  activeLabel: string
  inactiveLabel: string
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-medium ${
        active
          ? 'bg-success/10 text-success'
          : 'bg-surface-overlay text-text-muted border border-border'
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  )
}
