import { describe, expect, it } from 'bun:test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createAgentkitHooks } from '../src/hooks'
import type { AgentkitPayload } from '@worldcoin/agentkit-core'
import type { AgentKitStorage } from '../src/storage'
import { formatSIWEMessage } from '@worldcoin/agentkit-core'

const CHAIN_ID = 'eip155:8453'

async function createSignedRequest(url = 'https://agentkit.example/protected') {
	const account = privateKeyToAccount(generatePrivateKey())
	const address = account.address
	const unsignedPayload = {
		domain: new URL(url).hostname,
		address,
		uri: url,
		version: '1',
		chainId: CHAIN_ID,
		type: 'eip191',
		nonce: 'nonce1234',
		issuedAt: new Date().toISOString(),
	} satisfies Omit<AgentkitPayload, 'signature'>

	const message = formatSIWEMessage(unsignedPayload, address)
	const signature = await account.signMessage({ message })
	const payload: AgentkitPayload = { ...unsignedPayload, signature }

	return {
		address,
		header: Buffer.from(JSON.stringify(payload)).toString('base64'),
		path: new URL(url).pathname,
		url,
	}
}

function createSmartWalletRequest(
	url = 'https://agentkit.example/protected',
	overrides: Partial<AgentkitPayload> = {}
) {
	const payload: AgentkitPayload = {
		domain: new URL(url).hostname,
		address: '0x1111111111111111111111111111111111111111',
		uri: url,
		version: '1',
		chainId: CHAIN_ID,
		type: 'eip1271',
		nonce: 'nonce1234',
		issuedAt: new Date().toISOString(),
		signature: '0x1234',
		...overrides,
	}

	return {
		header: Buffer.from(JSON.stringify(payload)).toString('base64'),
		path: new URL(url).pathname,
		url,
	}
}

function createAdapter(url: string, header: string) {
	return {
		getHeader(name: string) {
			return name.toLowerCase() === 'agentkit' ? header : undefined
		},
		getUrl() {
			return url
		},
	}
}

describe('createAgentkitHooks', () => {
	it('atomically consumes a nonce so concurrent replays grant access once', async () => {
		const request = await createSignedRequest()
		const consumedNonces = new Set<string>()
		let usageCount = 0
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage() {
				usageCount += 1
				return true
			},
			async consumeNonce(nonce) {
				if (consumedNonces.has(nonce)) return false
				consumedNonces.add(nonce)
				return true
			},
		}

		const hooks = createAgentkitHooks({
			agentBook: { lookupHuman: async () => 'human-1' },
			mode: { type: 'free-trial', uses: 3 },
			storage,
			onEvent: event => events.push(event as Record<string, string>),
		})

		const context = {
			adapter: createAdapter(request.url, request.header),
			path: request.path,
		}
		const results = await Promise.all([hooks.requestHook(context), hooks.requestHook(context)])

		expect(results.filter(result => result?.grantAccess)).toHaveLength(1)
		expect(usageCount).toBe(1)
		expect(events.filter(event => event.type === 'validation_failed')).toHaveLength(1)
	})

	it('rejects known replays before smart-wallet RPC signature verification', async () => {
		const request = createSmartWalletRequest()
		let rpcCalls = 0
		const rpcServer = Bun.serve({
			hostname: '127.0.0.1',
			port: 0,
			async fetch(rpcRequest) {
				rpcCalls += 1
				const body = (await rpcRequest.json()) as { id: number }
				return Response.json({ jsonrpc: '2.0', id: body.id, result: '0x01' })
			},
		})
		let consumeCalls = 0
		let lookupCalls = 0
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage() {
				return true
			},
			async hasUsedNonce() {
				return true
			},
			async consumeNonce() {
				consumeCalls += 1
				return true
			},
		}

		try {
			const hooks = createAgentkitHooks({
				agentBook: {
					async lookupHuman() {
						lookupCalls += 1
						return 'human-1'
					},
				},
				storage,
				rpcUrl: rpcServer.url.toString(),
				onEvent: event => events.push(event as Record<string, string>),
			})

			const result = await hooks.requestHook({
				adapter: createAdapter(request.url, request.header),
				path: request.path,
			})

			expect(result).toBeUndefined()
			expect(rpcCalls).toBe(0)
			expect(consumeCalls).toBe(0)
			expect(lookupCalls).toBe(0)
			expect(events).toEqual([
				{
					type: 'validation_failed',
					resource: request.path,
					error: 'Nonce validation failed (possible replay attack)',
				},
			])
		} finally {
			rpcServer.stop(true)
		}
	})

	it('rejects a nonce that expires during smart-wallet signature verification', async () => {
		const originalDateNow = Date.now
		const issuedAt = originalDateNow()
		const maxAgeMs = 5 * 60 * 1000
		let currentTime = issuedAt + maxAgeMs - 1
		const request = createSmartWalletRequest('https://agentkit.example/protected', {
			issuedAt: new Date(issuedAt).toISOString(),
		})
		let rpcCalls = 0
		const rpcServer = Bun.serve({
			hostname: '127.0.0.1',
			port: 0,
			async fetch(rpcRequest) {
				rpcCalls += 1
				currentTime = issuedAt + maxAgeMs
				const body = (await rpcRequest.json()) as { id: number }
				return Response.json({ jsonrpc: '2.0', id: body.id, result: '0x01' })
			},
		})
		let consumeCalls = 0
		let lookupCalls = 0
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage() {
				return true
			},
			async consumeNonce() {
				consumeCalls += 1
				return true
			},
		}

		Date.now = () => currentTime
		try {
			const hooks = createAgentkitHooks({
				agentBook: {
					async lookupHuman() {
						lookupCalls += 1
						return 'human-1'
					},
				},
				storage,
				rpcUrl: rpcServer.url.toString(),
				onEvent: event => events.push(event as Record<string, string>),
			})

			const result = await hooks.requestHook({
				adapter: createAdapter(request.url, request.header),
				path: request.path,
			})

			expect(result).toBeUndefined()
			expect(rpcCalls).toBe(1)
			expect(consumeCalls).toBe(0)
			expect(lookupCalls).toBe(0)
			expect(events).toEqual([
				{
					type: 'validation_failed',
					resource: request.path,
					error: 'Message expired',
				},
			])
		} finally {
			Date.now = originalDateNow
			rpcServer.stop(true)
		}
	})

	it('keeps legacy nonce check-and-record storage working', async () => {
		const request = await createSignedRequest()
		const usedNonces = new Set<string>()
		let nonceChecks = 0
		let recordCalls = 0
		let lookupCalls = 0
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage() {
				return true
			},
			async hasUsedNonce(nonce) {
				nonceChecks += 1
				return usedNonces.has(nonce)
			},
			async recordNonce(nonce) {
				recordCalls += 1
				usedNonces.add(nonce)
			},
		}
		const hooks = createAgentkitHooks({
			agentBook: {
				async lookupHuman() {
					lookupCalls += 1
					return 'human-1'
				},
			},
			storage,
			onEvent: event => events.push(event as Record<string, string>),
		})
		const context = {
			adapter: createAdapter(request.url, request.header),
			path: request.path,
		}

		expect(await hooks.requestHook(context)).toEqual({ grantAccess: true })
		expect(await hooks.requestHook(context)).toBeUndefined()
		expect(nonceChecks).toBe(2)
		expect(recordCalls).toBe(1)
		expect(lookupCalls).toBe(1)
		expect(events.map(event => event.type)).toEqual(['agent_verified', 'validation_failed'])
	})

	it('uses tryIncrementUsage to grant free-trial access', async () => {
		const request = await createSignedRequest()
		const usageCalls: Array<{ endpoint: string; humanId: string; limit: number }> = []
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage(endpoint, humanId, limit) {
				usageCalls.push({ endpoint, humanId, limit })
				return true
			},
		}

		const hooks = createAgentkitHooks({
			agentBook: { lookupHuman: async () => 'human-1' },
			mode: { type: 'free-trial', uses: 3 },
			storage,
			onEvent: event => events.push(event as Record<string, string>),
		})

		const result = await hooks.requestHook({
			adapter: createAdapter(request.url, request.header),
			path: request.path,
		})

		expect(result).toEqual({ grantAccess: true })
		expect(usageCalls).toEqual([{ endpoint: request.path, humanId: 'human-1', limit: 3 }])
		expect(events).toEqual([
			{
				type: 'agent_verified',
				resource: request.path,
				address: request.address,
				humanId: 'human-1',
			},
		])
	})

	it('uses tryIncrementUsage to recover discounted underpayments', async () => {
		const request = await createSignedRequest()
		const usageCalls: Array<{ endpoint: string; humanId: string; limit: number }> = []
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage(endpoint, humanId, limit) {
				usageCalls.push({ endpoint, humanId, limit })
				return true
			},
		}

		const hooks = createAgentkitHooks({
			agentBook: { lookupHuman: async () => 'human-1' },
			mode: { type: 'discount', percent: 50, uses: 2 },
			storage,
			onEvent: event => events.push(event as Record<string, string>),
		})

		const requestResult = await hooks.requestHook({
			adapter: createAdapter(request.url, request.header),
			path: request.path,
		})
		const requirements = { amount: '100' }
		const verifyResult = await hooks.verifyFailureHook?.({
			paymentPayload: {
				resource: { url: request.url },
				payload: {
					authorization: {
						from: request.address,
						value: '50',
					},
				},
			},
			requirements,
			error: new Error('invalid_exact_evm_payload_authorization_value: discounted payment'),
		})

		expect(requestResult).toBeUndefined()
		expect(verifyResult).toEqual({
			recovered: true,
			result: { isValid: true, payer: request.address },
		})
		expect(requirements.amount).toBe('50')
		expect(usageCalls).toEqual([{ endpoint: request.path, humanId: 'human-1', limit: 2 }])
		expect(events).toEqual([
			{
				type: 'discount_applied',
				resource: request.path,
				address: request.address,
				humanId: 'human-1',
			},
		])
	})
})
