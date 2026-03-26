import { describe, expect, it } from 'bun:test'
import type { AgentkitPayload } from '../src/types'
import { validateAgentkitMessage } from '../src/validate'

function buildPayload(overrides: Partial<AgentkitPayload> = {}): AgentkitPayload {
	return {
		domain: 'x402-worldchain.vercel.app',
		address: '0x1234567890abcdef1234567890abcdef12345678',
		uri: 'https://x402-worldchain.vercel.app/generate',
		version: '1',
		chainId: 'eip155:480',
		type: 'eip191',
		nonce: 'nonce',
		issuedAt: new Date().toISOString(),
		signature: '0xsignature',
		...overrides,
	}
}

describe('validateAgentkitMessage', () => {
	it('accepts https agentkit URIs when the server sees an internal http URL behind a proxy', async () => {
		const result = await validateAgentkitMessage(
			buildPayload(),
			'http://x402-worldchain.vercel.app/generate'
		)

		expect(result).toEqual({ valid: true })
	})

	it('rejects mismatched hosts', async () => {
		const result = await validateAgentkitMessage(
			buildPayload({ uri: 'https://evil.example/generate' }),
			'http://x402-worldchain.vercel.app/generate'
		)

		expect(result.valid).toBe(false)
		expect(result.error).toBe('URI mismatch: expected host "x402-worldchain.vercel.app", got "evil.example"')
	})

	it('rejects mismatched ports', async () => {
		const result = await validateAgentkitMessage(
			buildPayload({ uri: 'https://x402-worldchain.vercel.app:444/generate' }),
			'http://x402-worldchain.vercel.app/generate'
		)

		expect(result.valid).toBe(false)
		expect(result.error).toBe('URI mismatch: expected host "x402-worldchain.vercel.app", got "x402-worldchain.vercel.app:444"')
	})
})
