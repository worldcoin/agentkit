import { describe, expect, test } from 'bun:test'
import { verifyMessage } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
	AgentkitPayloadError,
	createAgentkitProof,
	createSiweMessage,
	parseAgentkitExtension,
	selectEip191Chain,
} from '../src/prove.js'

const payload = {
	agentkit: {
		info: {
			domain: 'api.example.com',
			uri: 'https://api.example.com/data',
			version: '1',
			nonce: 'abc123',
			issuedAt: '2025-01-01T00:00:00.000Z',
			statement: 'Verify your agent is backed by a real human',
		},
		supportedChains: [
			{ chainId: 'eip155:8453', type: 'eip1271' },
			{ chainId: 'eip155:8453', type: 'eip191' },
		],
		schema: { type: 'object' },
	},
}

describe('AgentKit extension parsing', () => {
	test('accepts structured and JSON payloads', () => {
		expect(parseAgentkitExtension(payload)).toEqual(payload)
		expect(parseAgentkitExtension(JSON.stringify(payload))).toEqual(payload)
	})

	test('rejects invalid JSON and line-break injection', () => {
		expect(() => parseAgentkitExtension('{')).toThrow(AgentkitPayloadError)
		expect(() =>
			parseAgentkitExtension({
				...payload,
				agentkit: { ...payload.agentkit, info: { ...payload.agentkit.info, nonce: 'abc\nURI: injected' } },
			})
		).toThrow('Must not contain line breaks')
	})
})

describe('SIWE construction', () => {
	test('selects the first EVM EIP-191 chain', () => {
		expect(selectEip191Chain(parseAgentkitExtension(payload).agentkit.supportedChains)).toEqual({
			chainId: 'eip155:8453',
			numericChainId: '8453',
		})
	})

	test('rejects payloads that do not support this EOA signer', () => {
		expect(() => selectEip191Chain([{ chainId: 'eip155:8453', type: 'eip1271' }])).toThrow(
			'The AgentKit extension does not support an EVM EIP-191 signer'
		)
	})

	test('formats required and optional fields in the documented order', () => {
		const info = {
			...payload.agentkit.info,
			expirationTime: '2025-01-01T00:05:00.000Z',
			notBefore: '2025-01-01T00:00:01.000Z',
			requestId: 'req-456',
			resources: ['https://api.example.com/tos'],
		}
		const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

		expect(createSiweMessage(info, address, '8453')).toBe(
			'api.example.com wants you to sign in with your Ethereum account:\n' +
				'0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\n' +
				'\n' +
				'Verify your agent is backed by a real human\n' +
				'\n' +
				'URI: https://api.example.com/data\n' +
				'Version: 1\n' +
				'Chain ID: 8453\n' +
				'Nonce: abc123\n' +
				'Issued At: 2025-01-01T00:00:00.000Z\n' +
				'Expiration Time: 2025-01-01T00:05:00.000Z\n' +
				'Not Before: 2025-01-01T00:00:01.000Z\n' +
				'Request ID: req-456\n' +
				'Resources:\n' +
				'- https://api.example.com/tos'
		)
	})

	test('uses one blank line between the address and URI when there is no statement', () => {
		const { statement: _, ...info } = payload.agentkit.info
		const message = createSiweMessage(info, '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', '8453')

		expect(message).toContain('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045\n\nURI:')
		expect(message.endsWith('\n')).toBe(false)
	})
})

test('creates a base64 AgentKit authorization with a valid EIP-191 signature', async () => {
	const account = privateKeyToAccount(`0x${'01'.padStart(64, '0')}`)
	const proof = await createAgentkitProof(payload, {
		address: account.address,
		signMessage: message => account.signMessage({ message }),
	})
	const decoded = JSON.parse(Buffer.from(proof.encoded, 'base64').toString('utf8'))

	expect(decoded).toEqual(proof.authorization)
	expect(decoded.address).toBe(account.address)
	expect(decoded.chainId).toBe('eip155:8453')
	expect(decoded.type).toBe('eip191')
	expect(
		await verifyMessage({ address: account.address, message: proof.message, signature: decoded.signature })
	).toBe(true)
})
