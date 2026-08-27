import { describe, expect, it } from 'bun:test'
import { AGENTKIT_HEADER, normalizeAgentkitBody } from '../src/protocol'
import { createAgentkitClient, type AgentkitSigner } from '../src/client'

const CHAIN_ID = 'eip155:8453'
const SIGNATURE = `0x${'12'.repeat(65)}`

function createSigner(): AgentkitSigner & { messages: string[] } {
	const messages: string[] = []
	return {
		messages,
		async signMessage(message: string) {
			messages.push(message)
			return SIGNATURE
		},
	}
}

function paymentRequired(agentkit = true) {
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
		...(agentkit ? { extensions: { agentkit: { mode: { type: 'free' } } } } : {}),
	}
}

describe('createAgentkitClient', () => {
	it('creates an AgentKit value by signing the normalized body', async () => {
		const signer = createSigner()
		const agentkit = createAgentkitClient({ signer })
		const body = { hello: 'world', unicode: '你好' }

		await expect(agentkit.createHeader(body)).resolves.toBe(SIGNATURE)
		expect(signer.messages).toEqual([normalizeAgentkitBody(body)])
	})

	it('preserves the JSON representation of primitive string bodies', async () => {
		const signer = createSigner()
		const agentkit = createAgentkitClient({
			signer,
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				return req.headers.has(AGENTKIT_HEADER)
					? new Response('ok')
					: Response.json(paymentRequired(), { status: 402 })
			},
		})

		await agentkit.fetch('https://agentkit.example/protected', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '"hello"',
		})

		expect(signer.messages).toEqual(['"hello"'])
	})

	it('normalizes JSON once and retries with the exact body that was signed', async () => {
		const signer = createSigner()
		const events: Array<Record<string, unknown>> = []
		const retries: Array<{ header: string | null; body: string }> = []
		const agentkit = createAgentkitClient({
			signer,
			onEvent: event => events.push(event),
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				const header = req.headers.get(AGENTKIT_HEADER)
				if (header) {
					retries.push({ header, body: await req.text() })
					return Response.json({ ok: true })
				}

				return Response.json(paymentRequired(), { status: 402 })
			},
		})

		const response = await agentkit.fetch('https://agentkit.example/protected', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '{\n  "hello": "world",\n  "count": 2\n}',
		})

		expect(response.status).toBe(200)
		expect(signer.messages).toEqual(['{"hello":"world","count":2}'])
		expect(retries).toEqual([{ header: SIGNATURE, body: '{"hello":"world","count":2}' }])
		expect(events.map(event => event.type)).toEqual([
			'agentkit_detected',
			'agentkit_signed',
			'agentkit_retry_completed',
		])
	})

	it('signs an empty body for bodyless requests', async () => {
		const signer = createSigner()
		const agentkit = createAgentkitClient({
			signer,
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				return req.headers.has(AGENTKIT_HEADER)
					? new Response('ok')
					: Response.json(paymentRequired(), { status: 402 })
			},
		})

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toHaveProperty('status', 200)
		expect(signer.messages).toEqual([''])
	})

	it('returns successful non-402 responses unchanged', async () => {
		const original = new Response('ok', { status: 200 })
		const agentkit = createAgentkitClient({ signer: createSigner(), fetch: async () => original })

		await expect(agentkit.fetch('https://agentkit.example/open')).resolves.toBe(original)
	})

	it('returns 402 responses without AgentKit unchanged', async () => {
		const original = Response.json(paymentRequired(false), { status: 402 })
		const agentkit = createAgentkitClient({ signer: createSigner(), fetch: async () => original })

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toBe(original)
	})

	it('returns the original 402 and emits a skip event when signing fails', async () => {
		const events: Array<Record<string, unknown>> = []
		const original = Response.json(paymentRequired(), { status: 402 })
		const agentkit = createAgentkitClient({
			signer: {
				async signMessage() {
					throw new Error('signer unavailable')
				},
			},
			onEvent: event => events.push(event),
			fetch: async () => original,
		})

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toBe(original)
		expect(events.map(event => event.type)).toEqual(['agentkit_detected', 'agentkit_skipped'])
	})
})
