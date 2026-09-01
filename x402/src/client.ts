import type { PaymentRequired } from '@x402/core/types'
import { createSignatureHeaders, type AgentkitSignatureHeaders } from '@worldcoin/agentkit-core'
import { AGENTKIT, normalizeAgentkitBody, normalizeAgentkitRequestBody } from './protocol'

export type AgentkitSigner = {
	/** The agent's address; becomes the signature keyid. */
	address: string
	/** EIP-191 signer over the RFC 9421 signature base. */
	signMessage(message: string): Promise<string>
}

export type AgentkitFetchEvent =
	| { type: 'agentkit_detected'; url: string }
	| { type: 'agentkit_signed'; url: string }
	| { type: 'agentkit_skipped'; url: string; reason: string }
	| { type: 'agentkit_retry_completed'; url: string; status: number }

export interface CreateAgentkitClientOptions {
	signer: AgentkitSigner
	fetch?: typeof fetch
	onEvent?: (event: AgentkitFetchEvent) => void
}

export interface AgentkitClient {
	fetch: typeof fetch
	createHeaders(input: { method: string; url: string | URL; body?: unknown }): Promise<AgentkitSignatureHeaders>
}

export function createAgentkitClient(options: CreateAgentkitClientOptions): AgentkitClient {
	const fetchFn = options.fetch ?? globalThis.fetch

	const createHeaders = (input: { method: string; url: string | URL; body?: unknown }) =>
		createSignatureHeaders({
			method: input.method,
			url: input.url,
			body: normalizeAgentkitBody(input.body),
			address: options.signer.address,
			signMessage: message => options.signer.signMessage(message),
		})

	const agentkitFetch = (async (
		input: Parameters<typeof fetch>[0],
		init?: Parameters<typeof fetch>[1]
	) => {
		const request = new Request(input, init)
		const response = await fetchFn(request.clone())
		if (response.status !== 402) return response

		const paymentRequired = await parsePaymentRequired(response)
		if (!isAgentkitExtension(paymentRequired?.extensions?.[AGENTKIT])) return response

		const url = request.url
		options.onEvent?.({ type: 'agentkit_detected', url })

		let signatureHeaders: AgentkitSignatureHeaders
		let body: string
		try {
			body = await normalizeAgentkitRequestBody(request)
			signatureHeaders = await createSignatureHeaders({
				method: request.method,
				url: request.url,
				body,
				address: options.signer.address,
				signMessage: message => options.signer.signMessage(message),
			})
		} catch (err) {
			options.onEvent?.({
				type: 'agentkit_skipped',
				url,
				reason: err instanceof Error ? err.message : 'Unable to create AgentKit signature',
			})
			return response
		}

		options.onEvent?.({ type: 'agentkit_signed', url })

		const headers = new Headers(request.headers)
		for (const [name, value] of Object.entries(signatureHeaders)) headers.set(name, value)
		headers.delete('content-length')

		const retryResponse = await fetchFn(createRetryRequest(request, headers, body))
		options.onEvent?.({ type: 'agentkit_retry_completed', url, status: retryResponse.status })

		return retryResponse
	}) as typeof fetch

	return {
		fetch: agentkitFetch,
		createHeaders,
	}
}

async function parsePaymentRequired(response: Response): Promise<PaymentRequired | null> {
	try {
		return (await response.clone().json()) as PaymentRequired
	} catch {
		return null
	}
}

function isAgentkitExtension(value: unknown): boolean {
	return value !== null && typeof value === 'object'
}

function createRetryRequest(request: Request, headers: Headers, body: string): Request {
	if (request.method === 'GET' || request.method === 'HEAD' || request.body === null) {
		return new Request(request, { headers })
	}

	return new Request(request, { headers, body })
}
