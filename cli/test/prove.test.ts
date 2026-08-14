import { verifyMessage } from 'viem'
import { describe, expect, test } from 'bun:test'
import { signRequestBody } from '../src/prove.js'
import { privateKeyToAccount } from 'viem/accounts'

describe('request body proof', () => {
	test('returns a raw EIP-191 signature over the exact body', async () => {
		const account = privateKeyToAccount(`0x${'01'.padStart(64, '0')}`)
		const body = '{"hello":"world","unicode":"你好"}'
		const signature = await signRequestBody(body, {
			signMessage: message => account.signMessage({ message }),
		})

		expect(signature).toMatch(/^0x[0-9a-f]{130}$/)
		expect(await verifyMessage({ address: account.address, message: body, signature })).toBe(true)
	})

	test('supports the empty body used by GET requests', async () => {
		const account = privateKeyToAccount(`0x${'02'.padStart(64, '0')}`)
		const signature = await signRequestBody('', {
			signMessage: message => account.signMessage({ message }),
		})

		expect(await verifyMessage({ address: account.address, message: '', signature })).toBe(true)
	})
})
