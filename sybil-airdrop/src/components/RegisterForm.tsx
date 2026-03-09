'use client'

import { useState, useCallback } from 'react'
import {
	IDKitRequestWidget,
	orbLegacy,
	type IDKitResult,
	type IDKitRequestWidgetProps,
} from '@worldcoin/idkit'
import type { RpContext, ResponseItemV3 } from '@worldcoin/idkit'
import {
	createWalletClient,
	createPublicClient,
	custom,
	http,
	decodeAbiParameters,
} from 'viem'
import { base } from 'viem/chains'
import { AGENT_BOOK_ABI } from '@/lib/contracts'

type RegState =
	| { step: 'disconnected' }
	| { step: 'idle'; address: string }
	| { step: 'verifying'; address: string }
	| { step: 'submitting'; address: string }
	| { step: 'success'; address: string; txHash: string }
	| { step: 'error'; address: string; message: string }

const APP_ID = 'app_51925df0f1fa5388389b749e6a0f576c' as const
const ACTION = 'claim-token-dropping-air'

export default function RegisterForm() {
	const [state, setState] = useState<RegState>({ step: 'disconnected' })
	const [nonce, setNonce] = useState<bigint>(0n)
	const [rpContext, setRpContext] = useState<RpContext | null>(null)
	const [widgetOpen, setWidgetOpen] = useState(false)

	const agentBookAddress = process.env.NEXT_PUBLIC_AGENTBOOK_ADDRESS as `0x${string}` | undefined

	const getPublicClient = useCallback(() => {
		return createPublicClient({
			chain: base,
			transport: http('https://mainnet.base.org'),
		})
	}, [])

	const connect = async () => {
		const ethereum = (window as unknown as { ethereum?: { request: (...args: unknown[]) => Promise<unknown> } }).ethereum
		if (!ethereum) {
			alert('No wallet found. Install MetaMask or another wallet.')
			return
		}
		const client = createWalletClient({ chain: base, transport: custom(ethereum) })
		const [addr] = await client.requestAddresses()

		if (agentBookAddress) {
			const publicClient = getPublicClient()
			const n = await publicClient.readContract({
				address: agentBookAddress,
				abi: AGENT_BOOK_ABI,
				functionName: 'getNextNonce',
				args: [addr],
			})
			setNonce(n)
		}

		const res = await fetch('/api/rp-context')
		if (res.ok) {
			const data = await res.json()
			setRpContext(data.rp_context)
		}

		setState({ step: 'idle', address: addr })
	}

	const handleStartVerify = () => {
		if (!rpContext) return
		setWidgetOpen(true)
	}

	const handleSuccess = async (result: IDKitResult) => {
		if (state.step === 'disconnected') return
		const { address } = state
		setWidgetOpen(false)

		try {
			setState({ step: 'submitting', address })

			if (!agentBookAddress) {
				throw new Error('AgentBook contract not configured')
			}

			const v3Response = result.responses?.find(
				(r): r is ResponseItemV3 => 'merkle_root' in r
			)

			if (!v3Response) {
				throw new Error('No v3 proof received. Orb verification required.')
			}

			const root = BigInt(v3Response.merkle_root)
			const nullifierHash = BigInt(v3Response.nullifier)
			const proof = decodeProofFromAbi(v3Response.proof)

			const ethereum = (window as unknown as { ethereum?: { request: (...args: unknown[]) => Promise<unknown> } }).ethereum
			const walletClient = createWalletClient({ chain: base, transport: custom(ethereum!) })
			const publicClient = getPublicClient()

			const { request } = await publicClient.simulateContract({
				address: agentBookAddress,
				abi: AGENT_BOOK_ABI,
				functionName: 'register',
				args: [address as `0x${string}`, root, nonce, nullifierHash, proof],
				account: address as `0x${string}`,
			})

			const txHash = await walletClient.writeContract(request)
			setState({ step: 'success', address, txHash })
		} catch (e) {
			console.error(e)
			setState({
				step: 'error',
				address,
				message: (e as Error).message,
			})
		}
	}

	const isLoading = state.step === 'verifying' || state.step === 'submitting'

	return (
		<div className="rounded-xl border border-border bg-surface-raised p-6">
			<div className="mb-5">
				<h2 className="text-lg font-semibold text-text-primary">Register Agent</h2>
				<p className="text-sm text-text-secondary mt-1">
					Link your wallet to a World ID-verified human identity
				</p>
			</div>

			<div className="space-y-4">
				{state.step !== 'disconnected' && (
					<div className="rounded-lg bg-surface-overlay border border-border px-4 py-2.5 flex items-center justify-between">
						<span className="text-xs text-text-muted">Wallet</span>
						<span className="font-mono text-xs text-text-secondary">
							{state.address.slice(0, 6)}...{state.address.slice(-4)}
						</span>
					</div>
				)}

				{state.step === 'success' && (
					<div className="rounded-lg bg-success-bg border border-success/30 p-4">
						<p className="text-success font-medium mb-2">Registration successful!</p>
						<p className="text-sm text-text-secondary">
							<span className="text-text-muted">Tx:</span>{' '}
							<a
								href={`https://basescan.org/tx/${state.txHash}`}
								target="_blank"
								rel="noopener noreferrer"
								className="text-primary hover:underline font-mono text-xs"
							>
								{state.txHash.slice(0, 10)}...{state.txHash.slice(-8)}
							</a>
						</p>
					</div>
				)}

				{state.step === 'error' && (
					<div className="rounded-lg bg-error-bg border border-error/30 p-4">
						<p className="text-error font-medium mb-1">Registration failed</p>
						<p className="text-sm text-text-secondary">{state.message}</p>
					</div>
				)}

				{state.step === 'disconnected' ? (
					<button
						onClick={connect}
						className="w-full py-3 px-6 rounded-lg font-medium text-white transition-all
							bg-primary hover:bg-primary-dark active:scale-[0.98]
							focus:outline-none focus:ring-2 focus:ring-primary/50"
					>
						Connect Wallet
					</button>
				) : state.step === 'success' ? (
					<a
						href="/"
						className="block w-full py-3 px-6 rounded-lg font-medium text-center text-white transition-all
							bg-primary hover:bg-primary-dark"
					>
						Go to Claim Page
					</a>
				) : (
					<>
						<button
							onClick={handleStartVerify}
							disabled={isLoading || !rpContext || !agentBookAddress}
							className="w-full py-3 px-6 rounded-lg font-medium text-white transition-all
								bg-primary hover:bg-primary-dark active:scale-[0.98]
								disabled:opacity-50 disabled:cursor-not-allowed
								focus:outline-none focus:ring-2 focus:ring-primary/50"
						>
							{isLoading && (
								<svg className="animate-spin -ml-1 mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24">
									<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
									<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
								</svg>
							)}
							{state.step === 'idle' && 'Verify with World ID'}
							{state.step === 'verifying' && 'Verifying...'}
							{state.step === 'submitting' && 'Submitting Transaction...'}
							{state.step === 'error' && 'Try Again'}
						</button>

						{rpContext && (
							<IDKitRequestWidget
								app_id={APP_ID}
								action={ACTION}
								rp_context={rpContext}
								allow_legacy_proofs={true}
								preset={orbLegacy()}
								open={widgetOpen}
								onOpenChange={setWidgetOpen}
								onSuccess={handleSuccess}
							/>
						)}
					</>
				)}

				{state.step === 'disconnected' && (
					<p className="text-xs text-text-muted text-center">
						You need a World ID Orb verification to register.
					</p>
				)}
			</div>
		</div>
	)
}

function decodeProofFromAbi(proof: string): readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
	const decoded = decodeAbiParameters(
		Array.from({ length: 8 }, () => ({ type: 'uint256' as const })),
		proof as `0x${string}`
	)
	return decoded as unknown as readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint]
}
