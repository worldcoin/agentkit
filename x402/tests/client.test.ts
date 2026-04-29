import { describe, expect, it } from 'bun:test'
import { createAgentkitClient, type AgentkitSigner } from '../src/client'
import { buildAgentkitSchema, formatSIWEMessage } from '@worldcoin/agentkit-core'
import type { AgentkitExtension, AgentkitPayload } from '@worldcoin/agentkit-core'

const CHAIN_ID = 'eip155:8453'
const SIGNATURE = '0x1234'
const ADDRESS = '0x1234567890AbcdEF1234567890aBcdef12345678'

function createEVMSigner(): AgentkitSigner & { messages: string[] } {
	const messages: string[] = []
	return {
		address: ADDRESS,
		chainId: CHAIN_ID,
		type: 'eip191',
		messages,
		async signMessage(message: string) {
			messages.push(message)
			return SIGNATURE
		},
	}
}

function createExtension(): AgentkitExtension {
	return {
		info: {
			domain: 'agentkit.example',
			uri: 'https://agentkit.example/protected',
			version: '1',
			nonce: 'nonce1234',
			issuedAt: new Date().toISOString(),
			resources: ['https://agentkit.example/protected'],
		},
		supportedChains: [{ chainId: CHAIN_ID, type: 'eip191' }],
		schema: buildAgentkitSchema(),
	}
}

function paymentRequired(extension?: AgentkitExtension) {
	return {
		x402Version: 2,
		resource: {
			url: 'https://agentkit.example/protected',
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
		...(extension ? { extensions: { agentkit: extension } } : {}),
	}
}

describe('createAgentkitClient', () => {
	it('creates a base64 AgentKit header with a signed EVM payload', async () => {
		const signer = createEVMSigner()
		const extension = createExtension()
		const agentkit = createAgentkitClient({ signer })

		const header = await agentkit.createHeader(extension)
		const payload = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as AgentkitPayload
		const message = formatSIWEMessage(payload, signer.address)

		expect(payload.address).toBe(signer.address)
		expect(payload.chainId).toBe(CHAIN_ID)
		expect(payload.type).toBe('eip191')
		expect(payload.nonce).toBe(extension.info.nonce)
		expect(payload.signature).toBe(SIGNATURE)
		expect(signer.messages).toEqual([message])
	})

	it('encodes Unicode payloads in browser btoa environments', async () => {
		const originalBtoa = globalThis.btoa
		globalThis.btoa = (value: string) => Buffer.from(value, 'binary').toString('base64')

		try {
			const signer = createEVMSigner()
			const extension = createExtension()
			const agentkit = createAgentkitClient({ signer })
			extension.info.statement = 'Verify this human-backed agent: 你好'

			const header = await agentkit.createHeader(extension)
			const payload = JSON.parse(Buffer.from(header, 'base64').toString('utf8')) as AgentkitPayload

			expect(payload.statement).toBe(extension.info.statement)
		} finally {
			globalThis.btoa = originalBtoa
		}
	})

	it('retries 402 responses with an AgentKit header when the extension is present', async () => {
		const signer = createEVMSigner()
		const events: Array<Record<string, unknown>> = []
		const seenHeaders: string[] = []
		const agentkit = createAgentkitClient({
			signer,
			onEvent: event => events.push(event),
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				const header = req.headers.get('agentkit')
				if (header) {
					seenHeaders.push(header)
					return new Response(JSON.stringify({ ok: true }), { status: 200 })
				}

				return new Response(JSON.stringify(paymentRequired(createExtension())), { status: 402 })
			},
		})

		const response = await agentkit.fetch('https://agentkit.example/protected')

		expect(response.status).toBe(200)
		expect(seenHeaders).toHaveLength(1)
		expect(events.map(event => event.type)).toEqual(['agentkit_detected', 'agentkit_signed', 'agentkit_retry_completed'])
	})

	it('returns successful non-402 responses unchanged', async () => {
		const signer = createEVMSigner()
		const original = new Response('ok', { status: 200 })
		const agentkit = createAgentkitClient({
			signer,
			fetch: async () => original,
		})

		await expect(agentkit.fetch('https://agentkit.example/open')).resolves.toBe(original)
	})

	it('returns 402 responses without AgentKit unchanged', async () => {
		const signer = createEVMSigner()
		const original = new Response(JSON.stringify(paymentRequired()), { status: 402 })
		const agentkit = createAgentkitClient({
			signer,
			fetch: async () => original,
		})

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toBe(original)
	})

	it('returns the original 402 and emits a skip event when the signer is unsupported', async () => {
		const signer: AgentkitSigner = {
			address: '0x1234567890abcdef1234567890abcdef12345678',
			chainId: 'eip155:1',
			type: 'eip191',
			async signMessage() {
				throw new Error('should not sign')
			},
		}
		const events: Array<Record<string, unknown>> = []
		const original = new Response(JSON.stringify(paymentRequired(createExtension())), { status: 402 })
		const agentkit = createAgentkitClient({
			signer,
			onEvent: event => events.push(event),
			fetch: async () => original,
		})

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toBe(original)
		expect(events.map(event => event.type)).toEqual(['agentkit_detected', 'agentkit_skipped'])
	})
})
