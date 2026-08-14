import type { PaymentRequired } from '@x402/core/types'
import { AGENTKIT, AGENTKIT_HEADER, normalizeAgentkitBody, normalizeAgentkitRequestBody } from './protocol'

export type AgentkitSigner = {
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
	createHeader(body: unknown): Promise<string>
}

export function createAgentkitClient(options: CreateAgentkitClientOptions): AgentkitClient {
	const fetchFn = options.fetch ?? globalThis.fetch

	const createHeader = async (body: unknown): Promise<string> =>
		options.signer.signMessage(normalizeAgentkitBody(body))

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

		let header: string
		let body: string
		try {
			body = await normalizeAgentkitRequestBody(request)
			header = await createHeader(body)
		} catch (err) {
			options.onEvent?.({
				type: 'agentkit_skipped',
				url,
				reason: err instanceof Error ? err.message : 'Unable to create AgentKit header',
			})
			return response
		}

		options.onEvent?.({ type: 'agentkit_signed', url })

		const headers = new Headers(request.headers)
		headers.set(AGENTKIT_HEADER, header)
		headers.delete('content-length')

		const retryResponse = await fetchFn(createRetryRequest(request, headers, body))
		options.onEvent?.({ type: 'agentkit_retry_completed', url, status: retryResponse.status })

		return retryResponse
	}) as typeof fetch

	return {
		fetch: agentkitFetch,
		createHeader,
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
