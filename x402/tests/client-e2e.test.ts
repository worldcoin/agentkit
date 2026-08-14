import { describe, expect, it } from 'bun:test'
import { verifyRequest } from '../../core/src/verify'
import { createAgentkitHooksInternal } from '../src/hooks'
import { AGENTKIT, AGENTKIT_HEADER } from '../src/protocol'
import { createAgentkitClient, type AgentKitStorage } from '../src'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

const CHAIN_ID = 'eip155:8453'
const PROTECTED_URL = 'https://agentkit.example/protected'

function paymentRequired() {
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
		extensions: { [AGENTKIT]: { mode: { type: 'free-trial', uses: 3 } } },
	}
}

function createAdapter(request: Request, body: unknown) {
	return {
		getHeader(name: string) {
			if (name.toLowerCase() === 'content-type') return request.headers.get('content-type') ?? undefined
			return request.headers.get(name) ?? undefined
		},
		getUrl() {
			return request.url
		},
		getBody() {
			return body
		},
	}
}

describe('AgentKit client/server E2E', () => {
	it('signs the request body and satisfies an AgentKit-enabled 402 before payment', async () => {
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
		const hooks = createAgentkitHooksInternal(
			{
				mode: { type: 'free-trial', uses: 3 },
				storage,
				onEvent: event => serverEvents.push(event as Record<string, string>),
			},
			{
				verify: request =>
					verifyRequest(request, {
						async lookupNullifierHash(address) {
							lookups.push(address)
							return address.toLowerCase() === account.address.toLowerCase() ? 'human-1' : null
						},
					}),
			}
		)

		const fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
			requestCount += 1
			const request = new Request(input, init)
			const path = new URL(request.url).pathname
			const text = await request.clone().text()
			const body = text === '' ? undefined : JSON.parse(text)
			const grant = await hooks.requestHook({ adapter: createAdapter(request, body), path })

			if (grant?.grantAccess) return Response.json({ ok: true })
			return Response.json(paymentRequired(), { status: 402 })
		}

		const agentkit = createAgentkitClient({
			signer: { signMessage: message => account.signMessage({ message }) },
			fetch,
			onEvent: event => clientEvents.push(event),
		})

		const response = await agentkit.fetch(PROTECTED_URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{\n  "hello": "world"\n}',
		})
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

	it('does not treat the lowercase extension key as the request header name', () => {
		expect(AGENTKIT).toBe('agentkit')
		expect(AGENTKIT_HEADER).toBe('X-AgentKit')
	})
})
