import nacl from 'tweetnacl'
import { describe, expect, it } from 'bun:test'
import { createAgentkitHooks } from '../src/hooks'
import type { AgentkitPayload } from '../src/types'
import type { AgentKitStorage } from '../src/storage'
import { SOLANA_MAINNET, encodeBase58, formatSIWSMessage } from '../src/solana'

function createSignedRequest(url = 'https://agentkit.example/protected') {
	const keyPair = nacl.sign.keyPair()
	const address = encodeBase58(keyPair.publicKey)
	const unsignedPayload = {
		domain: new URL(url).hostname,
		address,
		uri: url,
		version: '1',
		chainId: SOLANA_MAINNET,
		type: 'ed25519',
		nonce: 'nonce-123',
		issuedAt: new Date().toISOString(),
	} satisfies Omit<AgentkitPayload, 'signature'>

	const message = formatSIWSMessage(unsignedPayload, address)
	const signature = encodeBase58(nacl.sign.detached(new TextEncoder().encode(message), keyPair.secretKey))
	const payload: AgentkitPayload = { ...unsignedPayload, signature }

	return {
		address,
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
	it('uses tryIncrementUsage to grant free-trial access', async () => {
		const request = createSignedRequest()
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
		const request = createSignedRequest()
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
