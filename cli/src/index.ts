#!/usr/bin/env node
import './polyfill.js'
import { Cli, z } from 'incur'
import { homedir } from 'node:os'
import type { Hex } from 'viem'
import qrcode from 'qrcode-terminal'
import { worldchain } from 'viem/chains'
import type { ISuccessResult } from '@worldcoin/idkit-core'
import { createWorldBridgeStore } from '@worldcoin/idkit-core'
import { solidityEncode } from '@worldcoin/idkit-core/hashing'
import { createPublicClient, http, decodeAbiParameters } from 'viem'
import { requestBodyInputSchema, signRequestBody } from './prove.js'
import { AgentKeyNotFoundError, getAgentkitKeyPath, loadAgentSigner, loadOrCreateAgentIdentity } from './key.js'

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
		outputs: [{ internalType: 'uint256', name: 'lookupId', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const

const APP_ID = 'app_a7c3e2b6b83927251a0db5345bd7146a'
const ACTION = 'agentbook-registration'
const REGISTRATION_RELAY_URL = 'https://x402-worldchain.vercel.app/register'
const AGENT_BOOK_NETWORK = 'eip155:480'
const AGENTKIT_KEY_PATH = getAgentkitKeyPath(process.env.XDG_CONFIG_HOME, homedir())

// ─── CLI ─────────────────────────────────────────────────────────────────────

const cli = Cli.create('agentkit', {
	description: 'Register an agent in AgentBook with World ID.',
	version: '0.1.0',
})

cli.command('status', {
	description: 'Check whether an agent is registered in AgentBook.',
	args: z.object({
		address: z
			.string()
			.regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid public key representation')
			.describe('Agent public key representation'),
	}),
	outputPolicy: 'agent-only',
	output: z.object({
		agent: z.string(),
		registered: z.boolean(),
		lookupId: z.string().nullable(),
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

		let lookupIdRaw: bigint
		try {
			lookupIdRaw = await client.readContract({
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

		const lookupId = lookupIdRaw === 0n ? null : bigintToHex(lookupIdRaw)
		const result = {
			agent: agentAddress,
			registered: lookupId !== null,
			lookupId,
			contract: AGENT_BOOK_CONTRACT,
			network: AGENT_BOOK_NETWORK,
		}

		if (!c.agent) {
			const status = result.registered ? '\x1b[32mregistered\x1b[0m' : '\x1b[33munregistered\x1b[0m'
			console.log()
			console.log(`  Agent:   \x1b[36m${result.agent}\x1b[0m`)
			console.log(`  Status:  ${status}`)
			if (result.lookupId) console.log(`  Lookup ID: \x1b[90m${result.lookupId}\x1b[0m`)
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
			const identity = await loadOrCreateAgentIdentity(AGENTKIT_KEY_PATH)
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

		let existingLookupId: bigint
		try {
			existingLookupId = await client.readContract({
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

		if (existingLookupId !== 0n) {
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
	description: 'Sign a request body with this registered agent.',
	args: z.object({
		body: requestBodyInputSchema,
	}),
	output: z.object({
		signature: z.string().describe('Hexadecimal AgentKit signature'),
	}),
	async run(c) {
		let signer
		try {
			signer = await loadAgentSigner(AGENTKIT_KEY_PATH)
		} catch (err) {
			return c.error({
				code: err instanceof AgentKeyNotFoundError ? 'KEY_NOT_FOUND' : 'IDENTITY_LOAD_FAILED',
				message: err instanceof AgentKeyNotFoundError
					? err.message
					: err instanceof Error
						? err.message
						: 'Unable to load the local agent identity',
			})
		}

		const client = createPublicClient({ chain: worldchain, transport: http() })
		let lookupId: bigint
		try {
			lookupId = await client.readContract({
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

		if (lookupId === 0n) {
			return c.error({
				code: 'AGENT_NOT_REGISTERED',
				message: 'This agent is not registered. Run `agentkit register` first.',
			})
		}

		try {
			return { signature: await signRequestBody(c.args.body, signer) }
		} catch (err) {
			return c.error({
				code: 'SIGNING_FAILED',
				message: err instanceof Error ? err.message : 'Unable to sign the request body',
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
