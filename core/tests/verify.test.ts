import { describe, expect, it } from 'bun:test'
import { isAddressEqual } from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { verifyRequest } from '../src/verify'

const encoder = new TextEncoder()

async function signedRequest(body: string) {
	const account = privateKeyToAccount(generatePrivateKey())
	const signature = await account.signMessage({ message: { raw: encoder.encode(body) } })
	const request = new Request('https://api.example.com/data', {
		method: 'POST',
		headers: { 'X-AgentKit': signature },
		body,
	})
	return { account, request, signature }
}

describe('verify', () => {
	it('recovers the signer from the exact request body and returns its nullifier hash', async () => {
		const body = JSON.stringify({ hello: 'world' })
		const { account, request } = await signedRequest(body)
		const addresses: string[] = []

		const nullifierHash = await verifyRequest(request, {
			async lookupNullifierHash(address) {
				addresses.push(address)
				return isAddressEqual(address as `0x${string}`, account.address) ? '0x1234' : null
			},
		})

		expect(nullifierHash).toBe('0x1234')
		expect(addresses).toHaveLength(1)
		expect(isAddressEqual(addresses[0] as `0x${string}`, account.address)).toBe(true)
		expect(await request.text()).toBe(body)
	})

	it('throws when the X-AgentKit header is missing', async () => {
		const request = new Request('https://api.example.com/data', { method: 'POST', body: 'hello' })
		await expect(verifyRequest(request)).rejects.toThrow('Missing X-AgentKit header')
	})

	it('throws when the header is not a valid signature', async () => {
		const request = new Request('https://api.example.com/data', {
			method: 'POST',
			headers: { 'X-AgentKit': 'not-a-signature' },
			body: 'hello',
		})
		await expect(verifyRequest(request)).rejects.toThrow('Invalid X-AgentKit signature')
	})

	it('rejects a signature copied onto a different body', async () => {
		const { account, signature } = await signedRequest('original')
		const request = new Request('https://api.example.com/data', {
			method: 'POST',
			headers: { 'X-AgentKit': signature },
			body: 'tampered',
		})

		await expect(
			verifyRequest(request, {
				lookupNullifierHash: async address =>
					isAddressEqual(address as `0x${string}`, account.address) ? '0x1234' : null,
			})
		).rejects.toThrow('Agent is not registered in AgentBook')
	})

	it('throws when the recovered signer is not registered', async () => {
		const { request } = await signedRequest('hello')
		await expect(verifyRequest(request, { lookupNullifierHash: async () => null })).rejects.toThrow(
			'Agent is not registered in AgentBook'
		)
	})

	it('propagates AgentBook RPC failures', async () => {
		const { request } = await signedRequest('hello')
		await expect(
			verifyRequest(request, {
				lookupNullifierHash: async () => {
					throw new Error('World Chain unavailable')
				},
			})
		).rejects.toThrow('World Chain unavailable')
	})
})
