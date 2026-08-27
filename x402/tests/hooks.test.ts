import type { Hex } from 'viem'
import { describe, expect, it } from 'bun:test'
import { AGENTKIT_HEADER } from '../src/protocol'
import type { AgentKitStorage } from '../src/storage'
import { createAgentkitHooksInternal } from '../src/hooks'

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678'
const SIGNATURE = `0x${'12'.repeat(65)}`
const URL = 'https://agentkit.example/protected'

function createAdapter(body: unknown = { hello: 'world' }, header = SIGNATURE, contentType?: string) {
	return {
		getHeader(name: string) {
			if (name.toLowerCase() === AGENTKIT_HEADER.toLowerCase()) return header
			if (name.toLowerCase() === 'content-type') return contentType
			return undefined
		},
		getUrl() {
			return URL
		},
		getBody() {
			return body
		},
	}
}

const dependencies = {
	verify: async () => 'human-1',
	recoverAddress: async (_body: Uint8Array, _signature: Hex) => ADDRESS,
}

describe('createAgentkitHooks', () => {
	it('passes the normalized adapter body and AgentKit header to core verify', async () => {
		const requests: Request[] = []
		const hooks = createAgentkitHooksInternal(
			{},
			{
				...dependencies,
				verify: async request => {
					requests.push(request)
					return 'human-1'
				},
			}
		)

		await expect(
			hooks.requestHook({
				adapter: createAdapter({ hello: 'world' }, SIGNATURE, 'application/json'),
				path: '/protected',
			})
		).resolves.toEqual({ grantAccess: true })
		expect(requests).toHaveLength(1)
		expect(requests[0]!.headers.get(AGENTKIT_HEADER)).toBe(SIGNATURE)
		expect(await requests[0]!.text()).toBe('{"hello":"world"}')
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
				resource: { url: URL },
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

	it('reports an unregistered signer separately from a malformed signature', async () => {
		const events: Array<Record<string, string>> = []
		const hooks = createAgentkitHooksInternal(
			{ onEvent: event => events.push(event as Record<string, string>) },
			{
				...dependencies,
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
