import { describe, expect, it } from 'bun:test'
import { AGENTKIT, buildAgentkitSchema } from '@worldcoin/agentkit-core'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createAgentkitClient, createAgentkitHooks, type AgentKitStorage } from '../src'
import type { AgentkitExtension } from '@worldcoin/agentkit-core'

const CHAIN_ID = 'eip155:8453'
const PROTECTED_URL = 'https://agentkit.example/protected'

function createExtension(url: string): AgentkitExtension {
	return {
		info: {
			domain: new URL(url).hostname,
			uri: url,
			version: '1',
			nonce: 'nonce1234',
			issuedAt: new Date().toISOString(),
			statement: 'Verify your agent is backed by a real human',
			resources: [url],
		},
		supportedChains: [{ chainId: CHAIN_ID, type: 'eip191' }],
		schema: buildAgentkitSchema(),
	}
}

function paymentRequired(extension: AgentkitExtension) {
	return {
		x402Version: 2,
		resource: {
			url: PROTECTED_URL,
			description: 'Protected',
			mimeType: 'application/json',
		},
		accepts: [
			{
				scheme: 'exact',
				network: CHAIN_ID,
				asset: 'asset',
				amount: '1',
				payTo: '0x0000000000000000000000000000000000000001',
				maxTimeoutSeconds: 60,
				extra: {},
			},
		],
		extensions: { [AGENTKIT]: extension },
	}
}

function createAdapter(request: Request) {
	return {
		getHeader(name: string) {
			return request.headers.get(name) ?? undefined
		},
		getUrl() {
			return request.url
		},
	}
}

describe('AgentKit client/server E2E', () => {
	it('uses the client SDK to satisfy an AgentKit-enabled 402 before payment fallback', async () => {
		const account = privateKeyToAccount(generatePrivateKey())
		const clientEvents: Array<Record<string, unknown>> = []
		const serverEvents: Array<Record<string, string>> = []
		const lookups: string[] = []
		const usageCalls: Array<{ endpoint: string; humanId: string; limit: number }> = []
		let requestCount = 0

		const storage: AgentKitStorage = {
			async tryIncrementUsage(endpoint, humanId, limit) {
				usageCalls.push({ endpoint, humanId, limit })
				return true
			},
		}
		const hooks = createAgentkitHooks({
			agentBook: {
				async lookupHuman(address) {
					lookups.push(address)
					return address.toLowerCase() === account.address.toLowerCase() ? 'human-1' : null
				},
			},
			mode: { type: 'free-trial', uses: 3 },
			storage,
			onEvent: event => serverEvents.push(event as Record<string, string>),
		})

		const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			requestCount += 1
			const request = new Request(input, init)
			const path = new URL(request.url).pathname
			const grant = await hooks.requestHook({ adapter: createAdapter(request), path })

			if (grant?.grantAccess) {
				return Response.json({ ok: true })
			}

			return Response.json(paymentRequired(createExtension(request.url)), { status: 402 })
		}

		const agentkit = createAgentkitClient({
			signer: {
				address: account.address,
				chainId: CHAIN_ID,
				type: 'eip191',
				signMessage: message => account.signMessage({ message }),
			},
			fetch,
			onEvent: event => clientEvents.push(event),
		})

		const response = await agentkit.fetch(PROTECTED_URL)
		const body = await response.json()

		expect(response.status).toBe(200)
		expect(body).toEqual({ ok: true })
		expect(requestCount).toBe(2)
		expect(lookups).toEqual([account.address])
		expect(usageCalls).toEqual([{ endpoint: '/protected', humanId: 'human-1', limit: 3 }])
		expect(clientEvents.map(event => event.type)).toEqual([
			'agentkit_detected',
			'agentkit_signed',
			'agentkit_retry_completed',
		])
		expect(serverEvents).toEqual([
			{
				type: 'agent_verified',
				resource: '/protected',
				address: account.address,
				humanId: 'human-1',
			},
		])
	})
})
