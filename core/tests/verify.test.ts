import { describe, expect, it } from 'bun:test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createSignatureHeaders } from '../src/signature'
import { verifyRequest } from '../src/verify'

const NOW = 1755600000

type SignedRequestOptions = {
	method?: string
	url?: string
	body?: string
	requestUrl?: string
	requestMethod?: string
	requestBody?: string
	now?: number
	expiresInSeconds?: number
	keyid?: string
}

async function signedRequest(options: SignedRequestOptions = {}) {
	const account = privateKeyToAccount(generatePrivateKey())
	const method = options.method ?? 'POST'
	const url = options.url ?? 'https://api.example.com/data?x=1'
	const body = options.body ?? '{"a":1}'

	const headers = await createSignatureHeaders({
		method,
		url,
		body,
		address: options.keyid ?? account.address,
		signMessage: message => account.signMessage({ message }),
		now: options.now ?? NOW,
		expiresInSeconds: options.expiresInSeconds,
	})

	const requestMethod = options.requestMethod ?? method
	const requestBody = options.requestBody ?? body
	const request = new Request(options.requestUrl ?? url, {
		method: requestMethod,
		headers,
		...(requestMethod === 'GET' || requestMethod === 'HEAD' ? {} : { body: requestBody }),
	})

	return { account, request, headers }
}

function registered(account: { address: string }) {
	return {
		now: () => NOW + 1,
		lookupNullifierHash: async (address: string) => (address === account.address ? '0x1234' : null),
	}
}

describe('verifyRequest', () => {
	it('verifies a signed POST and returns the nullifier hash, address, and params', async () => {
		const { account, request } = await signedRequest()
		const lookups: string[] = []

		const result = await verifyRequest(request, {
			now: () => NOW + 1,
			lookupNullifierHash: async address => {
				lookups.push(address)
				return address === account.address ? '0x1234' : null
			},
		})

		expect(result.nullifierHash).toBe('0x1234')
		// viem accounts expose EIP-55 checksummed addresses; verifyRequest surfaces the same form.
		expect(result.address).toBe(account.address)
		expect(result.created).toBe(NOW)
		expect(result.expires).toBe(NOW + 300)
		expect(result.nonce.length).toBeGreaterThanOrEqual(16)
		expect(lookups).toEqual([account.address])
		expect(await request.text()).toBe('{"a":1}')
	})

	it('verifies a bodyless GET request', async () => {
		const { account, request } = await signedRequest({ method: 'GET', url: 'https://api.example.com/data', body: '' })
		const result = await verifyRequest(request, registered(account))
		expect(result.nullifierHash).toBe('0x1234')
	})

	it('rejects a request missing any signature header', async () => {
		for (const missing of ['Signature-Input', 'Signature', 'Content-Digest']) {
			const { request } = await signedRequest()
			const headers = new Headers(request.headers)
			headers.delete(missing)
			const stripped = new Request(request.url, { method: 'POST', headers, body: '{"a":1}' })
			await expect(verifyRequest(stripped, { now: () => NOW + 1 })).rejects.toThrow(`Missing ${missing} header`)
		}
	})

	it('rejects a tampered body', async () => {
		const { account, request } = await signedRequest({ requestBody: '{"a":2}' })
		await expect(verifyRequest(request, registered(account))).rejects.toThrow(
			'Content-Digest does not match the request body'
		)
	})

	it('rejects a forged digest that matches a tampered body', async () => {
		const { account, headers } = await signedRequest()
		const forged = await createSignatureHeaders({
			method: 'POST',
			url: 'https://api.example.com/data?x=1',
			body: '{"a":2}',
			address: account.address,
			signMessage: async () => `0x${'12'.repeat(65)}`,
			now: NOW,
		})
		const request = new Request('https://api.example.com/data?x=1', {
			method: 'POST',
			headers: { ...headers, 'Content-Digest': forged['Content-Digest'] },
			body: '{"a":2}',
		})

		await expect(verifyRequest(request, registered(account))).rejects.toThrow(/signature|keyid/i)
	})

	it.each([
		['method', { requestMethod: 'PUT' }],
		['path', { requestUrl: 'https://api.example.com/other?x=1' }],
		['query', { requestUrl: 'https://api.example.com/data?x=2' }],
		['removed query', { requestUrl: 'https://api.example.com/data' }],
		['authority', { requestUrl: 'https://evil.example.com/data?x=1' }],
		['port', { requestUrl: 'https://api.example.com:8443/data?x=1' }],
	])('rejects a signature replayed against a different %s', async (_name, overrides) => {
		const { account, request } = await signedRequest(overrides)
		await expect(verifyRequest(request, registered(account))).rejects.toThrow(
			'Signature does not match the keyid address'
		)
	})

	it('rejects an expired signature', async () => {
		const { account, request } = await signedRequest({ expiresInSeconds: 10 })
		await expect(verifyRequest(request, { ...registered(account), now: () => NOW + 11 })).rejects.toThrow(
			'Signature has expired'
		)
	})

	it('rejects a long client expiry beyond the server window', async () => {
		const { account, request } = await signedRequest({ expiresInSeconds: 3600 })
		await expect(verifyRequest(request, { ...registered(account), now: () => NOW + 400 })).rejects.toThrow(
			'Signature has expired'
		)
	})

	it('rejects a created timestamp too far in the future, but tolerates clock skew', async () => {
		const early = await signedRequest({ now: NOW + 60 })
		await expect(verifyRequest(early.request, { ...registered(early.account), now: () => NOW })).rejects.toThrow(
			'Signature created timestamp is in the future'
		)

		const skewed = await signedRequest({ now: NOW + 30 })
		const result = await verifyRequest(skewed.request, { ...registered(skewed.account), now: () => NOW })
		expect(result.nullifierHash).toBe('0x1234')
	})

	it('rejects a valid signature whose keyid names a different address', async () => {
		const other = privateKeyToAccount(generatePrivateKey())
		const { account, request } = await signedRequest({ keyid: other.address })
		await expect(verifyRequest(request, registered(account))).rejects.toThrow(
			'Signature does not match the keyid address'
		)
	})

	it('records the nonce once and rejects a replay via tryRecordNonce', async () => {
		const { account, request } = await signedRequest()
		const recorded: Array<{ nonce: string; address: string; created: number; expires: number }> = []

		const result = await verifyRequest(request, {
			...registered(account),
			tryRecordNonce: async details => {
				recorded.push(details)
				return true
			},
		})

		expect(recorded).toEqual([
			{ nonce: result.nonce, address: account.address, created: NOW, expires: NOW + 300 },
		])

		const replay = await signedRequest()
		await expect(
			verifyRequest(replay.request, { ...registered(replay.account), tryRecordNonce: async () => false })
		).rejects.toThrow('Signature nonce has already been used')
	})

	it('does not consume a nonce for a request whose signature fails', async () => {
		const { account, request } = await signedRequest({ requestBody: '{"a":2}' })
		const recorded: string[] = []

		await expect(
			verifyRequest(request, {
				...registered(account),
				tryRecordNonce: async details => {
					recorded.push(details.nonce)
					return true
				},
			})
		).rejects.toThrow('Content-Digest does not match the request body')
		expect(recorded).toEqual([])
	})

	it('throws when the recovered signer is not registered', async () => {
		const { request } = await signedRequest()
		await expect(
			verifyRequest(request, { now: () => NOW + 1, lookupNullifierHash: async () => null })
		).rejects.toThrow('Agent is not registered in AgentBook')
	})

	it('propagates AgentBook RPC failures', async () => {
		const { request } = await signedRequest()
		await expect(
			verifyRequest(request, {
				now: () => NOW + 1,
				lookupNullifierHash: async () => {
					throw new Error('World Chain unavailable')
				},
			})
		).rejects.toThrow('World Chain unavailable')
	})
})
