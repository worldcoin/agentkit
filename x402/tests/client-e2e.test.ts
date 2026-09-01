import { describe, expect, it } from 'bun:test'
import { createSignatureHeaders } from '../../core/src/signature'
import { verifyRequest } from '../../core/src/verify'
import { createAgentkitHooksInternal } from '../src/hooks'
import { createAgentkitClient, type AgentKitStorage } from '../src'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import {
	AGENTKIT,
	AGENTKIT_CONTENT_DIGEST_HEADER,
	AGENTKIT_SIGNATURE_HEADER,
	AGENTKIT_SIGNATURE_INPUT_HEADER,
} from '../src/protocol'

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
		getMethod() {
			return request.method
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
	it('signs the request and satisfies an AgentKit-enabled 402 before payment', async () => {
		const account = privateKeyToAccount(generatePrivateKey())
		const clientEvents: Array<Record<string, unknown>> = []
		const serverEvents: Array<Record<string, string>> = []
		const lookups: string[] = []
		const usageCalls: Array<{ endpoint: string; lookupId: string; limit: number }> = []
		let requestCount = 0

		const storage: AgentKitStorage = {
			async tryIncrementUsage(endpoint, lookupId, limit) {
				usageCalls.push({ endpoint, lookupId, limit })
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
						async lookupId(address) {
							lookups.push(address)
							return address === account.address ? 'human-1' : null
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
			signer: { address: account.address, signMessage: message => account.signMessage({ message }) },
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
		expect(usageCalls).toEqual([{ endpoint: '/protected', lookupId: 'human-1', limit: 3 }])
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
				lookupId: 'human-1',
			},
		])
	})

	it('rejects a tampered body under the same signature', async () => {
		const account = privateKeyToAccount(generatePrivateKey())
		const events: Array<Record<string, string>> = []
		const hooks = createAgentkitHooksInternal(
			{ onEvent: event => events.push(event as Record<string, string>) },
			{ verify: request => verifyRequest(request, { lookupId: async () => 'human-1' }) }
		)

		const headers = await createSignatureHeaders({
			method: 'POST',
			url: PROTECTED_URL,
			body: '{"hello":"world"}',
			address: account.address,
			signMessage: message => account.signMessage({ message }),
		})

		const adapter = (body: unknown) => ({
			getHeader(name: string) {
				const lower = name.toLowerCase()
				if (lower === 'content-type') return 'application/json'
				if (lower === 'signature-input') return headers['Signature-Input']
				if (lower === 'signature') return headers.Signature
				if (lower === 'content-digest') return headers['Content-Digest']
				return undefined
			},
			getMethod: () => 'POST',
			getUrl: () => PROTECTED_URL,
			getBody: () => body,
		})

		await expect(hooks.requestHook({ adapter: adapter({ hello: 'world' }), path: '/protected' })).resolves.toEqual({
			grantAccess: true,
		})
		// Until nonce-based single-use lands, a byte-identical replay inside the
		// five-minute window verifies again by design.
		await expect(hooks.requestHook({ adapter: adapter({ hello: 'world' }), path: '/protected' })).resolves.toEqual({
			grantAccess: true,
		})
		await expect(
			hooks.requestHook({ adapter: adapter({ hello: 'tampered' }), path: '/protected' })
		).resolves.toBeUndefined()

		expect(events.map(event => event.type)).toEqual(['agent_verified', 'agent_verified', 'validation_failed'])
		expect(events[2]!.error).toBe('Content-Digest does not match the request body')
	})

	it('uses standard signature header names distinct from the extension key', () => {
		expect(AGENTKIT).toBe('agentkit')
		expect(AGENTKIT_SIGNATURE_INPUT_HEADER).toBe('Signature-Input')
		expect(AGENTKIT_SIGNATURE_HEADER).toBe('Signature')
		expect(AGENTKIT_CONTENT_DIGEST_HEADER).toBe('Content-Digest')
	})
})
