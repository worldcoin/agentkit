#!/usr/bin/env node
import './polyfill.js'
import { Cli, z } from 'incur'
import { createPublicClient, http, decodeAbiParameters } from 'viem'
import type { Hex } from 'viem'
import { worldchain } from 'viem/chains'
import { createWorldBridgeStore } from '@worldcoin/idkit-core'
import type { ISuccessResult } from '@worldcoin/idkit-core'
import { solidityEncode } from '@worldcoin/idkit-core/hashing'
import qrcode from 'qrcode-terminal'
import { loadAgentSigner, loadOrCreateAgentIdentity } from './key.js'
import {
	AgentkitPayloadError,
	agentkitExtensionInputSchema,
	createAgentkitProof,
	parseAgentkitExtension,
} from './prove.js'

// ─── Config ──────────────────────────────────────────────────────────────────

const AGENT_BOOK_CONTRACT = '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' as const

const AGENT_BOOK_ABI = [
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'getNextNonce',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'lookupHuman',
		outputs: [{ internalType: 'uint256', name: 'humanId', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const

const APP_ID = 'app_a7c3e2b6b83927251a0db5345bd7146a'
const ACTION = 'agentbook-registration'
const REGISTRATION_RELAY_URL = 'https://x402-worldchain.vercel.app/register'
const AGENT_BOOK_NETWORK = 'eip155:480'

// ─── CLI ─────────────────────────────────────────────────────────────────────

const cli = Cli.create('agentkit', {
	description: 'Register an agent with a World ID-verified human via AgentBook.',
	version: '0.1.0',
})

cli.command('status', {
	description: 'Check whether an agent wallet is registered in AgentBook.',
	args: z.object({
		address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address').describe('Agent wallet address'),
	}),
	outputPolicy: 'agent-only',
	output: z.object({
		agent: z.string(),
		registered: z.boolean(),
		humanId: z.string().nullable(),
		contract: z.string(),
		network: z.string(),
	}),
	examples: [
		{
			args: { address: '0x1234567890abcdef1234567890abcdef12345678' },
			description: 'Check AgentBook registration status',
		},
	],
	async run(c) {
		const agentAddress = c.args.address as `0x${string}`
		const client = createPublicClient({ chain: worldchain, transport: http() })

		if (!c.agent) console.log(`  Looking up AgentBook status for ${agentAddress}...`)

		let humanIdRaw: bigint
		try {
			humanIdRaw = await client.readContract({
				address: AGENT_BOOK_CONTRACT,
				abi: AGENT_BOOK_ABI,
				functionName: 'lookupHuman',
				args: [agentAddress],
			})
		} catch (err) {
			return c.error({
				code: 'STATUS_LOOKUP_FAILED',
				message: err instanceof Error ? err.message : 'Unable to look up AgentBook status',
				retryable: true,
			})
		}

		const humanId = humanIdRaw === 0n ? null : bigintToHex(humanIdRaw)
		const result = {
			agent: agentAddress,
			registered: humanId !== null,
			humanId,
			contract: AGENT_BOOK_CONTRACT,
			network: AGENT_BOOK_NETWORK,
		}

		if (!c.agent) {
			const status = result.registered ? '\x1b[32mregistered\x1b[0m' : '\x1b[33munregistered\x1b[0m'
			console.log()
			console.log(`  Agent:   \x1b[36m${result.agent}\x1b[0m`)
			console.log(`  Status:  ${status}`)
			if (result.humanId) console.log(`  Human:   \x1b[90m${result.humanId}\x1b[0m`)
			console.log(`  Network: World Chain (${result.network})`)
			console.log(`  Contract: \x1b[90m${result.contract}\x1b[0m`)
			console.log()
		}

		return result
	},
})

cli.command('register', {
	description: 'Register this agent with a World ID proof.',
	outputPolicy: 'agent-only',
	output: z.object({
		registered: z.boolean().describe('Whether this agent is registered'),
		alreadyRegistered: z.boolean().describe('Whether registration was already complete before this run'),
	}),
	async run(c) {
		if (!c.agent) console.log('  Preparing this agent...')

		let agentAddress: `0x${string}`
		try {
			const identity = await loadOrCreateAgentIdentity()
			agentAddress = identity.address
			if (!c.agent && identity.created) console.log('  \x1b[32m✓ Local identity created\x1b[0m')
		} catch (err) {
			return c.error({
				code: 'IDENTITY_SETUP_FAILED',
				message: err instanceof Error ? err.message : 'Unable to set up the local agent identity',
			})
		}

		const client = createPublicClient({ chain: worldchain, transport: http() })

		if (!c.agent) console.log('  Checking registration status...')

		let existingHumanId: bigint
		try {
			existingHumanId = await client.readContract({
				address: AGENT_BOOK_CONTRACT,
				abi: AGENT_BOOK_ABI,
				functionName: 'lookupHuman',
				args: [agentAddress],
			})
		} catch (err) {
			return c.error({
				code: 'REGISTRATION_LOOKUP_FAILED',
				message: err instanceof Error ? err.message : 'Unable to check registration status',
				retryable: true,
			})
		}

		if (existingHumanId !== 0n) {
			if (!c.agent) {
				console.log()
				console.log('  \x1b[32m\x1b[1m✓ This agent is already registered\x1b[0m')
				console.log()
			}
			return { registered: true, alreadyRegistered: true }
		}

		// 1. Read next nonce from AgentBook contract
		if (!c.agent) console.log('  Starting registration...')

		const nonce = await client.readContract({
			address: AGENT_BOOK_CONTRACT,
			abi: AGENT_BOOK_ABI,
			functionName: 'getNextNonce',
			args: [agentAddress],
		})

		// 2. Build the signal payload
		const signal = solidityEncode(['address', 'uint256'], [agentAddress, nonce])

		// 3. Create World ID verification request
		const worldID = createWorldBridgeStore()

		if (!c.agent) console.log('  Creating World ID verification request...')

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
			qrcode.generate(connectorURI, { small: true })
			console.log()
			console.log(`  ${connectorURI}`)
			console.log()
			console.log('  Waiting for verification...')
		}

		// 5. Poll until completion
		const completion = await waitForCompletion(worldID, 300_000)

		if (!completion.success) {
			return c.error({ code: 'VERIFICATION_FAILED', message: completion.error })
		}

		if (!c.agent) {
			console.log()
			console.log('  \x1b[32m\x1b[1m✓ World ID verified\x1b[0m')
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
			contract: AGENT_BOOK_CONTRACT,
		}

		if (!c.agent) {
			console.log()
			console.log('  Completing registration...')
		}

		const response = await fetch(REGISTRATION_RELAY_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(registration),
		})

		if (!response.ok) {
			const body = await response.text()
			return c.error({ code: 'REGISTRATION_FAILED', message: `${response.status}: ${body}`, retryable: true })
		}

		if (!c.agent) {
			console.log()
			console.log('  \x1b[32m\x1b[1m✓ This agent is registered\x1b[0m')
			console.log()
		}

		return { registered: true, alreadyRegistered: false }
	},
})

cli.command('prove', {
	description: 'Sign an x402 AgentKit challenge with this registered agent.',
	args: z.object({
		payload: agentkitExtensionInputSchema,
	}),
	output: z.object({
		signature: z.string().describe('Base64-encoded AgentKit authorization value'),
	}),
	async run(c) {
		let extension
		try {
			extension = parseAgentkitExtension(c.args.payload)
		} catch (err) {
			return c.error({
				code: 'INVALID_AGENTKIT_PAYLOAD',
				message: err instanceof Error ? err.message : 'Invalid AgentKit extension payload',
			})
		}

		let signer
		try {
			signer = await loadAgentSigner()
		} catch (err) {
			const keyMissing = hasErrorCode(err, 'ENOENT')
			return c.error({
				code: keyMissing ? 'KEY_NOT_FOUND' : 'IDENTITY_LOAD_FAILED',
				message: keyMissing
					? 'No AgentKit key is available. Run `agentkit register` first.'
					: err instanceof Error
						? err.message
						: 'Unable to load the local agent identity',
			})
		}

		const client = createPublicClient({ chain: worldchain, transport: http() })
		let humanId: bigint
		try {
			humanId = await client.readContract({
				address: AGENT_BOOK_CONTRACT,
				abi: AGENT_BOOK_ABI,
				functionName: 'lookupHuman',
				args: [signer.address],
			})
		} catch (err) {
			return c.error({
				code: 'REGISTRATION_LOOKUP_FAILED',
				message: err instanceof Error ? err.message : 'Unable to check registration status',
				retryable: true,
			})
		}

		if (humanId === 0n) {
			return c.error({
				code: 'AGENT_NOT_REGISTERED',
				message: 'This agent is not registered. Run `agentkit register` first.',
			})
		}

		try {
			const proof = await createAgentkitProof(extension, signer)
			return { signature: proof.encoded }
		} catch (err) {
			return c.error({
				code: err instanceof AgentkitPayloadError ? 'INVALID_AGENTKIT_PAYLOAD' : 'SIGNING_FAILED',
				message: err instanceof Error ? err.message : 'Unable to sign the AgentKit challenge',
			})
		}
	},
})

cli.serve()

export default cli

// ─── Helpers ─────────────────────────────────────────────────────────────────

type VerifyCompletion = { success: true; proof: ISuccessResult } | { success: false; error: string }

function bigintToHex(value: bigint): string {
	return `0x${value.toString(16)}`
}

function hasErrorCode(error: unknown, code: string): boolean {
	return error instanceof Error && 'code' in error && error.code === code
}

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
