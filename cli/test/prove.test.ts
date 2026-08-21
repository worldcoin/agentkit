import { describe, expect, it } from 'bun:test'
import { verifyRequest } from '@worldcoin/agentkit-core'
import { privateKeyToAccount } from 'viem/accounts'
import { createProofHeaders } from '../src/prove.js'
import type { AgentSigner } from '../src/key.js'

function createSigner(privateKey: `0x${string}`): AgentSigner & { account: ReturnType<typeof privateKeyToAccount> } {
	const account = privateKeyToAccount(privateKey)
	return {
		account,
		address: account.address,
		signMessage: message => account.signMessage({ message }),
	}
}

function registeredLookup(signer: { address: string }) {
	return async (address: string) => (address === signer.address ? '0x1234' : null)
}

describe('createProofHeaders', () => {
	it('produces headers that pass core verification for the same request', async () => {
		const signer = createSigner(`0x${'01'.padStart(64, '0')}`)
		const body = '{"a":1}'
		const headers = await createProofHeaders({
			method: 'post',
			url: 'https://api.example.com/data?x=1',
			body,
			signer,
		})

		const request = new Request('https://api.example.com/data?x=1', { method: 'POST', headers, body })
		const result = await verifyRequest(request, { lookupNullifierHash: registeredLookup(signer) })

		expect(result.nullifierHash).toBe('0x1234')
		expect(result.address).toBe(signer.address)
	})

	it('signs bodyless GET requests with an empty-body digest', async () => {
		const signer = createSigner(`0x${'02'.padStart(64, '0')}`)
		const headers = await createProofHeaders({
			method: 'GET',
			url: 'https://api.example.com/data',
			body: '',
			signer,
		})

		expect(headers['Content-Digest']).toBe('sha-256=:47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=:')

		const request = new Request('https://api.example.com/data', { method: 'GET', headers })
		const result = await verifyRequest(request, { lookupNullifierHash: registeredLookup(signer) })

		expect(result.nullifierHash).toBe('0x1234')
	})

	it('rejects headers replayed against a different URL', async () => {
		const signer = createSigner(`0x${'03'.padStart(64, '0')}`)
		const body = '{"a":1}'
		const headers = await createProofHeaders({
			method: 'POST',
			url: 'https://api.example.com/data',
			body,
			signer,
		})

		const request = new Request('https://api.example.com/other', { method: 'POST', headers, body })
		await expect(verifyRequest(request, { lookupNullifierHash: registeredLookup(signer) })).rejects.toThrow(
			'Signature does not match the keyid address'
		)
	})
})
