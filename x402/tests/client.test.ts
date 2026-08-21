import { describe, expect, it } from 'bun:test'
import { AGENTKIT_SIGNATURE_INPUT_HEADER } from '../src/protocol'
import { createAgentkitClient, type AgentkitSigner } from '../src/client'

const CHAIN_ID = 'eip155:8453'
const SIGNATURE = `0x${'12'.repeat(65)}`
const ADDRESS = '0x1234567890AbcdEF1234567890aBcdef12345678'

function createSigner(): AgentkitSigner & { messages: string[] } {
	const messages: string[] = []
	return {
		address: ADDRESS,
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
	it('creates RFC 9421 headers by signing the signature base for the request', async () => {
		const signer = createSigner()
		const agentkit = createAgentkitClient({ signer })
		const body = { hello: 'world', unicode: '你好' }

		const headers = await agentkit.createHeaders({
			method: 'POST',
			url: 'https://agentkit.example/protected',
			body,
		})

		expect(headers['Content-Digest']).toMatch(/^sha-256=:[A-Za-z0-9+/]{43}=:$/)
		expect(headers['Signature-Input']).toMatch(
			new RegExp(
				`^agentkit=\\("@method" "@authority" "@path" "@query" "content-digest"\\);created=\\d+;expires=\\d+;keyid="${ADDRESS.toLowerCase()}";tag="agentkit"$`
			)
		)
		expect(headers.Signature).toMatch(/^agentkit=:[A-Za-z0-9+/]{87}=:$/)
		expect(signer.messages).toHaveLength(1)
		expect(
			signer.messages[0]!.startsWith(
				'"@method": POST\n"@authority": agentkit.example\n"@path": /protected\n"@query": ?\n'
			)
		).toBe(true)
	})

	it('preserves the JSON representation of primitive string bodies', async () => {
		const signer = createSigner()
		const agentkit = createAgentkitClient({
			signer,
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				return req.headers.has(AGENTKIT_SIGNATURE_INPUT_HEADER)
					? new Response('ok')
					: Response.json(paymentRequired(), { status: 402 })
			},
		})

		await agentkit.fetch('https://agentkit.example/protected', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: '"hello"',
		})

		expect(signer.messages).toHaveLength(1)
		expect(signer.messages[0]).toContain('sha-256=:')
		expect(signer.messages[0]).toContain('"@method": POST')
	})

	it('normalizes JSON once and retries with the exact body that was signed', async () => {
		const signer = createSigner()
		const events: Array<Record<string, unknown>> = []
		const retries: Array<{ signatureInput: string | null; signature: string | null; digest: string | null; body: string }> =
			[]
		const agentkit = createAgentkitClient({
			signer,
			onEvent: event => events.push(event),
			fetch: async request => {
				const req = request instanceof Request ? request : new Request(request)
				if (req.headers.has(AGENTKIT_SIGNATURE_INPUT_HEADER)) {
					retries.push({
						signatureInput: req.headers.get('Signature-Input'),
						signature: req.headers.get('Signature'),
						digest: req.headers.get('Content-Digest'),
						body: await req.text(),
					})
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
		expect(retries).toHaveLength(1)
		expect(retries[0]!.body).toBe('{"hello":"world","count":2}')
		expect(retries[0]!.signatureInput).toMatch(/^agentkit=\(/)
		expect(retries[0]!.signature).toMatch(/^agentkit=:[A-Za-z0-9+/]{87}=:$/)
		expect(retries[0]!.digest).toMatch(/^sha-256=:[A-Za-z0-9+/]{43}=:$/)
		expect(signer.messages).toHaveLength(1)
		expect(signer.messages[0]).toContain(retries[0]!.digest!)
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
				return req.headers.has(AGENTKIT_SIGNATURE_INPUT_HEADER)
					? new Response('ok')
					: Response.json(paymentRequired(), { status: 402 })
			},
		})

		await expect(agentkit.fetch('https://agentkit.example/protected')).resolves.toHaveProperty('status', 200)
		expect(signer.messages).toHaveLength(1)
		expect(signer.messages[0]).toContain('"@method": GET')
		expect(signer.messages[0]).toContain('sha-256=:47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=:')
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
				address: ADDRESS,
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
