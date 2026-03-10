'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createWalletClient, custom } from 'viem'
import { base } from 'viem/chains'
import { SiweMessage } from 'siwe'

type ClaimState =
  | { step: 'disconnected' }
  | { step: 'idle'; address: string }
  | { step: 'fetching-challenge'; address: string }
  | { step: 'signing'; address: string }
  | { step: 'submitting'; address: string }
  | { step: 'success'; address: string; txHash: string; explorerUrl: string }
  | { step: 'error'; address: string; message: string }

export default function ClaimForm() {
  const [state, setState] = useState<ClaimState>({ step: 'disconnected' })

  const connect = async () => {
    const ethereum = (
      window as unknown as { ethereum?: { request: (...args: unknown[]) => Promise<unknown> } }
    ).ethereum
    if (!ethereum) {
      alert('No wallet found. Please install MetaMask or another wallet extension.')
      return
    }
    const client = createWalletClient({ chain: base, transport: custom(ethereum) })
    const [addr] = await client.requestAddresses()
    setState({ step: 'idle', address: addr })
  }

  const claim = async () => {
    if (state.step === 'disconnected') return
    const { address } = state

    try {
      setState({ step: 'fetching-challenge', address })
      const challengeRes = await fetch('/api/challenge')
      if (!challengeRes.ok) throw new Error('Failed to fetch challenge')
      const challenge = await challengeRes.json()

      setState({ step: 'signing', address })
      const ethereum = (
        window as unknown as {
          ethereum?: { request: (...args: unknown[]) => Promise<unknown> }
        }
      ).ethereum
      const client = createWalletClient({ chain: base, transport: custom(ethereum!) })

      const chainIdNum = parseInt(challenge.chainId.split(':')[1])
      const message = new SiweMessage({
        domain: challenge.domain,
        address,
        statement: 'Verify your agent is backed by a real human to claim the airdrop',
        uri: challenge.uri,
        version: '1',
        chainId: chainIdNum,
        nonce: challenge.nonce,
        issuedAt: challenge.issuedAt,
        expirationTime: challenge.expirationTime,
      })

      const signature = await client.signMessage({
        account: address as `0x${string}`,
        message: message.prepareMessage(),
      })

      const payloadData = {
        domain: message.domain,
        address: message.address,
        statement: message.statement,
        uri: message.uri,
        version: message.version,
        chainId: challenge.chainId,
        nonce: message.nonce,
        issuedAt: message.issuedAt,
        expirationTime: message.expirationTime,
        signature,
        type: 'eip191' as const,
      }

      const payload = btoa(JSON.stringify(payloadData))

      setState({ step: 'submitting', address })
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Claim failed')

      setState({
        step: 'success',
        address,
        txHash: data.txHash,
        explorerUrl: `https://basescan.org/tx/${data.txHash}`,
      })
    } catch (e) {
      console.error(e)
      setState({
        step: 'error',
        address,
        message: (e as Error).message,
      })
    }
  }

  const isLoading =
    state.step === 'fetching-challenge' ||
    state.step === 'signing' ||
    state.step === 'submitting'

  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-text-primary">Prove & Claim</h2>
        <p className="mt-1 text-xs text-text-secondary">
          Sign a challenge to verify your agent is human-backed
        </p>
      </div>

      <div className="space-y-4">
        {state.step !== 'disconnected' && (
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <StepIndicator
              active={state.step === 'fetching-challenge'}
              done={['signing', 'submitting', 'success'].includes(state.step)}
              label="Challenge"
            />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator
              active={state.step === 'signing'}
              done={['submitting', 'success'].includes(state.step)}
              label="Sign"
            />
            <div className="flex-1 h-px bg-border" />
            <StepIndicator
              active={state.step === 'submitting'}
              done={state.step === 'success'}
              label="Claim"
            />
          </div>
        )}

        {state.step !== 'disconnected' && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-surface-overlay px-4 py-3">
            <span className="text-xs text-text-muted">Connected</span>
            <span className="font-mono text-xs text-text-secondary">
              {state.address.slice(0, 6)}...{state.address.slice(-4)}
            </span>
          </div>
        )}

        {state.step === 'success' && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="mb-1 text-sm font-medium text-primary">Airdrop claimed!</p>
            <a
              href={state.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono text-xs"
            >
              {state.txHash.slice(0, 10)}...{state.txHash.slice(-8)}
            </a>
          </div>
        )}

        {state.step === 'error' && (
          <div className="rounded-xl border border-border bg-surface-overlay p-4">
            <p className="mb-1 text-sm font-medium text-text-primary">Failed</p>
            <p className="text-xs text-text-secondary">{state.message}</p>
          </div>
        )}

        {state.step === 'disconnected' ? (
          <button
            onClick={connect}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            Connect Wallet
          </button>
        ) : (
          <button
            onClick={claim}
            disabled={isLoading || state.step === 'success'}
            className="w-full rounded-xl bg-primary px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {isLoading && (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 inline"
                fill="none"
                viewBox="0 0 24 24"
              >
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
            )}
            {state.step === 'idle' && 'Prove Humanity & Claim'}
            {state.step === 'fetching-challenge' && 'Fetching Challenge...'}
            {state.step === 'signing' && 'Waiting for Signature...'}
            {state.step === 'submitting' && 'Submitting...'}
            {state.step === 'success' && 'Claimed'}
            {state.step === 'error' && 'Try Again'}
          </button>
        )}

        {state.step !== 'disconnected' && (
          <Link
            href="/agent-challenge"
            className="block text-center text-xs text-text-secondary underline-offset-4 transition-colors hover:text-primary hover:underline"
          >
            Try Agent Capability Challenge
          </Link>
        )}

        {state.step === 'disconnected' && (
          <p className="text-xs text-text-muted text-center">
            Your agent must be{' '}
            <Link href="/register" className="text-primary hover:underline">
              registered
            </Link>{' '}
            first.
          </p>
        )}
      </div>
    </div>
  )
}

function StepIndicator({
  active,
  done,
  label,
}: {
  active: boolean
  done: boolean
  label: string
}) {
  return (
    <span
      className={`px-2 py-0.5 rounded text-xs transition-colors ${
        done
          ? 'bg-primary/10 text-primary'
          : active
            ? 'bg-primary/10 text-primary'
            : 'bg-surface-overlay text-text-muted'
      }`}
    >
      {label}
    </span>
  )
}
