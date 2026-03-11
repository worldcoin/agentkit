#!/usr/bin/env node
import './polyfill.js'
import { Cli, z } from 'incur'
import { createPublicClient, http, decodeAbiParameters } from 'viem'
import type { Hex } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import { createWorldBridgeStore } from '@worldcoin/idkit-core'
import type { ISuccessResult } from '@worldcoin/idkit-core'
import { solidityEncode } from '@worldcoin/idkit-core/hashing'
import qrcode from 'qrcode-terminal'

// ─── Config ──────────────────────────────────────────────────────────────────

const NETWORKS = {
	base: { chain: base, address: '0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4' as const },
	'base-sepolia': { chain: baseSepolia, address: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' as const },
} as const

const NETWORK_NAMES = Object.keys(NETWORKS) as [keyof typeof NETWORKS, ...Array<keyof typeof NETWORKS>]

const AGENT_BOOK_ABI = [
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'getNextNonce',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const

const APP_ID = 'app_a7c3e2b6b83927251a0db5345bd7146a'
const ACTION = 'agentbook-registration'
const DEFAULT_AUTO_API_URLS: Partial<Record<keyof typeof NETWORKS, string>> = {
	base: 'https://x402-worldchain.vercel.app',
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const cli = Cli.create('agentkit', {
	description: 'Register agent wallets with World ID-verified humans via AgentBook.',
	version: '0.1.0',
})

cli.command('register', {
	description: 'Register an agent wallet address with a World ID proof.',
	args: z.object({
		address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').describe('Agent wallet address'),
	}),
	options: z.object({
		network: z.enum(NETWORK_NAMES).default('base').describe('Target network'),
		auto: z.boolean().default(true).describe('Submit registration to the default relay or API_URL override'),
		manual: z.boolean().optional().describe('Print manual call data instead of submitting through a relay'),
	}),
	alias: { network: 'n', auto: 'a', manual: 'm' },
	env: z.object({
		API_URL: z
			.string()
			.optional()
			.describe('Override API base URL for registration relay; base mainnet defaults to https://x402-worldchain.vercel.app'),
	}),
	output: z.object({
		agent: z.string(),
		root: z.string(),
		nonce: z.string(),
		nullifierHash: z.string(),
		proof: z.array(z.string()),
		contract: z.string(),
		network: z.string(),
		txHash: z.string().optional(),
	}),
	examples: [
		{ args: { address: '0x1234567890abcdef1234567890abcdef12345678' }, description: 'Register on Base mainnet' },
		{
			args: { address: '0x1234567890abcdef1234567890abcdef12345678' },
			options: { network: 'base-sepolia' },
			description: 'Register on Sepolia',
		},
	],
	async run(c) {
		const agentAddress = c.args.address as `0x${string}`
		const deployment = NETWORKS[c.options.network]
		const shouldAuto = c.options.manual ? false : c.options.auto

		// 1. Read next nonce from AgentBook contract
		if (!c.agent) console.log(`Looking up next nonce for ${agentAddress}...`)

		const client = createPublicClient({ chain: deployment.chain, transport: http() })
		const nonce = await client.readContract({
			address: deployment.address,
			abi: AGENT_BOOK_ABI,
			functionName: 'getNextNonce',
			args: [agentAddress],
		})

		if (!c.agent) console.log(`Next nonce: ${nonce}`)

		// 2. Build the signal payload
		const signal = solidityEncode(['address', 'uint256'], [agentAddress, nonce])

		// 3. Create World ID verification request
		const worldID = createWorldBridgeStore()

		if (!c.agent) console.log('Creating World ID verification request...')

		await worldID.getState().createClient({
			app_id: APP_ID,
			action: ACTION,
			signal,
		})

		// 4. Print QR code and link
		const connectorURI = worldID.getState().connectorURI!
		if (c.agent) {
			console.log(`HUMAN ACTION REQUIRED: Scan or click this link in World App to verify: ${connectorURI}`)
		} else {
			console.log()
			console.log('Scan this QR code with World App or open the link:')
			console.log()
			qrcode.generate(connectorURI, { small: true })
			console.log()
			console.log(`  ${connectorURI}`)
			console.log()
			console.log('Waiting for verification...')
		}

		// 5. Poll until completion
		const completion = await waitForCompletion(worldID, 300_000)

		if (!completion.success) {
			return c.error({ code: 'VERIFICATION_FAILED', message: completion.error })
		}

		if (!c.agent) {
			console.log('Verification successful!')
			console.log(`Merkle root:     ${completion.proof.merkle_root}`)
			console.log(`Nullifier hash:  ${completion.proof.nullifier_hash}`)
		}

		const proof = normalizeProof(completion.proof)
		if (!proof) {
			return c.error({ code: 'INVALID_PROOF', message: 'Unexpected proof format returned by IDKit' })
		}

		// 6. Build registration data
		const registration = {
			agent: agentAddress,
			root: completion.proof.merkle_root,
			nonce: nonce.toString(),
			nullifierHash: completion.proof.nullifier_hash,
			proof,
			contract: deployment.address,
			network: c.options.network,
		}

		if (!shouldAuto) {
			if (!c.agent) {
				console.log()
				console.log('Submit this transaction on-chain:')
				console.log()
				console.log(`Contract: ${deployment.address}`)
				console.log(
					'Function: register(address agent, uint256 root, uint256 nonce, uint256 nullifierHash, uint256[8] proof)'
				)
			}

			return registration
		}

		const apiUrl = c.env.API_URL ?? DEFAULT_AUTO_API_URLS[c.options.network]
		if (!apiUrl) {
			return c.error({
				code: 'MISSING_API_URL',
				message: `No default registration relay is configured for network ${c.options.network}. Set API_URL to use --auto on this network.`,
			})
		}

		const registerUrl = `${apiUrl.replace(/\/$/, '')}/register`

		if (!c.agent) {
			console.log(`\nRegistering agent ${agentAddress}...`)
			console.log(`Relay: ${apiUrl}`)
		}

		const response = await fetch(registerUrl, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(registration),
		})

		if (!response.ok) {
			const body = await response.text()
			return c.error({ code: 'REGISTRATION_FAILED', message: `${response.status}: ${body}`, retryable: true })
		}

		const result = (await response.json()) as { txHash?: string }

		if (!c.agent) console.log('Registration complete!')

		return { ...registration, txHash: result.txHash }
	},
})

cli.serve()

export default cli

// ─── Helpers ─────────────────────────────────────────────────────────────────

type VerifyCompletion = { success: true; proof: ISuccessResult } | { success: false; error: string }

async function waitForCompletion(
	worldID: ReturnType<typeof createWorldBridgeStore>,
	timeoutMs: number
): Promise<VerifyCompletion> {
	const deadline = Date.now() + timeoutMs
	while (Date.now() < deadline) {
		await worldID.getState().pollForUpdates()

		const { result, errorCode } = worldID.getState()
		if (result) return { success: true, proof: result }
		if (errorCode) return { success: false, error: errorCode }

		await new Promise(resolve => setTimeout(resolve, 1_000))
	}

	return { success: false, error: 'timed out waiting for World ID completion' }
}

function normalizeProof(result: ISuccessResult): string[] | null {
	const rawProof = result.proof
	if (rawProof.startsWith('[')) {
		try {
			const parsed = JSON.parse(rawProof)
			if (Array.isArray(parsed)) return parsed as string[]
		} catch {
			// fall through to ABI decode
		}
	}

	try {
		const decoded = decodeAbiParameters([{ type: 'uint256[8]' }], rawProof as Hex)[0]
		return decoded.map(v => `0x${v.toString(16).padStart(64, '0')}`)
	} catch {
		return null
	}
}
