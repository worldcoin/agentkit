import { getAddress } from 'viem'
import { describe, expect, it } from 'bun:test'
import type { VerifiedAgentRequest } from '@worldcoin/agentkit-core'
import { AgentKitStorage } from '../src/storage'
import { createAgentkitHooksInternal } from '../src/hooks'

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const URL_ = 'https://agentkit.example/protected'
const SIGNATURE_INPUT =
	'agentkit=("@method" "@authority" "@path" "@query" "content-digest");created=1755600000;expires=1755600300;keyid="0x1234567890abcdef1234567890abcdef12345678";tag="agentkit"'
const SIGNATURE = `agentkit=:${'A'.repeat(87)}=:`
const CONTENT_DIGEST = 'sha-256=:47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=:'

const VERIFIED: VerifiedAgentRequest = {
	lookupId: 'human-1',
	address: ADDRESS,
	created: 1755600000,
	expires: 1755600300,
}

type AdapterOptions = {
	body?: unknown
	contentType?: string
	method?: string
}

function createAdapter(options: AdapterOptions = {}) {
	const headers: Record<string, string | undefined> = {
		'signature-input': SIGNATURE_INPUT,
		signature: SIGNATURE,
		'content-digest': CONTENT_DIGEST,
		'content-type': options.contentType,
	}

	return {
		getHeader(name: string) {
			return headers[name.toLowerCase()]
		},
		getMethod() {
			return options.method ?? 'POST'
		},
		getUrl() {
			return URL_
		},
		getBody() {
			return 'body' in options ? options.body : { hello: 'world' }
		},
	}
}

const dependencies = { verify: async () => VERIFIED }

describe('createAgentkitHooks', () => {
	it('passes the real method, URL, signature headers, and normalized body to core verify', async () => {
		const requests: Request[] = []
		const hooks = createAgentkitHooksInternal(
			{},
			{
				verify: async request => {
					requests.push(request)
					return VERIFIED
				},
			}
		)

		await expect(
			hooks.requestHook({ adapter: createAdapter({ contentType: 'application/json' }), path: '/protected' })
		).resolves.toEqual({ grantAccess: true })

		expect(requests).toHaveLength(1)
		expect(requests[0]!.method).toBe('POST')
		expect(requests[0]!.url).toBe(URL_)
		expect(requests[0]!.headers.get('Signature-Input')).toBe(SIGNATURE_INPUT)
		expect(requests[0]!.headers.get('Signature')).toBe(SIGNATURE)
		expect(requests[0]!.headers.get('Content-Digest')).toBe(CONTENT_DIGEST)
		expect(await requests[0]!.text()).toBe('{"hello":"world"}')
	})

	it('builds a bodyless verification request for GET without throwing', async () => {
		const requests: Request[] = []
		const hooks = createAgentkitHooksInternal(
			{},
			{
				verify: async request => {
					requests.push(request)
					return VERIFIED
				},
			}
		)

		await expect(
			hooks.requestHook({ adapter: createAdapter({ method: 'GET', body: undefined }), path: '/protected' })
		).resolves.toEqual({ grantAccess: true })

		expect(requests[0]!.method).toBe('GET')
		expect(requests[0]!.body).toBeNull()
	})

	it('verifies a bodyless GET that carries a JSON content type', async () => {
		const requests: Request[] = []
		const hooks = createAgentkitHooksInternal(
			{},
			{
				verify: async request => {
					requests.push(request)
					return VERIFIED
				},
			}
		)

		await expect(
			hooks.requestHook({
				adapter: createAdapter({ method: 'GET', body: undefined, contentType: 'application/json' }),
				path: '/protected',
			})
		).resolves.toEqual({ grantAccess: true })

		expect(requests[0]!.body).toBeNull()
	})

	it('treats a missing body as the signed empty body regardless of content type', async () => {
		const requests: Request[] = []
		const hooks = createAgentkitHooksInternal(
			{},
			{
				verify: async request => {
					requests.push(request)
					return VERIFIED
				},
			}
		)

		await expect(
			hooks.requestHook({
				adapter: createAdapter({ method: 'DELETE', body: undefined, contentType: 'application/json' }),
				path: '/protected',
			})
		).resolves.toEqual({ grantAccess: true })

		expect(await requests[0]!.text()).toBe('')
	})

	it('ignores requests without a Signature-Input header', async () => {
		const hooks = createAgentkitHooksInternal({}, dependencies)
		const adapter = { ...createAdapter(), getHeader: () => undefined }

		await expect(hooks.requestHook({ adapter, path: '/protected' })).resolves.toBeUndefined()
	})

	it('uses the lookup ID to grant free-trial access', async () => {
		const usageCalls: Array<{ endpoint: string; lookupId: string; limit: number }> = []
		const events: Array<Record<string, string>> = []
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
				onEvent: event => events.push(event as Record<string, string>),
			},
			dependencies
		)

		const result = await hooks.requestHook({ adapter: createAdapter(), path: '/protected' })

		expect(result).toEqual({ grantAccess: true })
		expect(usageCalls).toEqual([{ endpoint: '/protected', lookupId: 'human-1', limit: 3 }])
		expect(events).toEqual([
			{
				type: 'agent_verified',
				resource: '/protected',
				address: ADDRESS,
				lookupId: 'human-1',
			},
		])
	})

	it('uses the lookup ID to recover discounted underpayments', async () => {
		const usageCalls: Array<{ endpoint: string; lookupId: string; limit: number }> = []
		const events: Array<Record<string, string>> = []
		const storage: AgentKitStorage = {
			async tryIncrementUsage(endpoint, lookupId, limit) {
				usageCalls.push({ endpoint, lookupId, limit })
				return true
			},
		}

		const hooks = createAgentkitHooksInternal(
			{
				mode: { type: 'discount', percent: 50, uses: 2 },
				storage,
				onEvent: event => events.push(event as Record<string, string>),
			},
			dependencies
		)

		const requestResult = await hooks.requestHook({ adapter: createAdapter(), path: '/protected' })
		const requirements = { amount: '100' }
		const verifyResult = await hooks.verifyFailureHook?.({
			paymentPayload: {
				resource: { url: URL_ },
				payload: { authorization: { from: ADDRESS, value: '50' } },
			},
			requirements,
			error: new Error('invalid_exact_evm_payload_authorization_value: discounted payment'),
		})

		expect(requestResult).toBeUndefined()
		expect(verifyResult).toEqual({ recovered: true, result: { isValid: true, payer: ADDRESS } })
		expect(requirements.amount).toBe('50')
		expect(usageCalls).toEqual([{ endpoint: '/protected', lookupId: 'human-1', limit: 2 }])
		expect(events).toEqual([
			{
				type: 'discount_applied',
				resource: '/protected',
				address: ADDRESS,
				lookupId: 'human-1',
			},
		])
	})

	it('matches pending discounts case-insensitively across address representations', async () => {
		// Core surfaces EIP-55 checksummed addresses while payment payloads may carry any casing.
		const checksummed = getAddress(ADDRESS)
		const hooks = createAgentkitHooksInternal(
			{
				mode: { type: 'discount', percent: 50, uses: 2 },
				storage: { tryIncrementUsage: async () => true },
			},
			{ verify: async () => ({ ...VERIFIED, address: checksummed }) }
		)

		await hooks.requestHook({ adapter: createAdapter(), path: '/protected' })
		const verifyResult = await hooks.verifyFailureHook?.({
			paymentPayload: {
				resource: { url: URL_ },
				payload: { authorization: { from: ADDRESS.toUpperCase().replace('0X', '0x'), value: '50' } },
			},
			requirements: { amount: '100' },
			error: new Error('invalid_exact_evm_payload_authorization_value: discounted payment'),
		})

		expect(verifyResult).toEqual({ recovered: true, result: { isValid: true, payer: checksummed } })
	})

	it('reports an unregistered signer separately from a malformed signature', async () => {
		const events: Array<Record<string, string>> = []
		const hooks = createAgentkitHooksInternal(
			{ onEvent: event => events.push(event as Record<string, string>) },
			{
				verify: async () => {
					throw Object.assign(new Error('Agent is not registered in AgentBook'), {
						code: 'AGENT_NOT_REGISTERED',
						address: ADDRESS,
					})
				},
			}
		)

		await hooks.requestHook({ adapter: createAdapter(), path: '/protected' })
		expect(events).toEqual([{ type: 'agent_not_verified', resource: '/protected', address: ADDRESS }])
	})
})
