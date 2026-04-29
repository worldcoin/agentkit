import {
	AGENTKIT,
	formatSIWEMessage,
	type AgentkitExtension,
	type AgentkitPayload,
	type CompleteAgentkitInfo,
} from '@worldcoin/agentkit-core'
import type { PaymentRequired } from '@x402/core/types'

export type AgentkitSignerType = 'eip191' | 'eip1271'

export type AgentkitSigner = {
	address: string
	chainId: string
	type: AgentkitSignerType
	signMessage(message: string): Promise<string>
}

export type AgentkitFetchEvent =
	| { type: 'agentkit_detected'; url: string }
	| { type: 'agentkit_signed'; url: string; chainId: string; signatureType: string }
	| { type: 'agentkit_skipped'; url: string; reason: string }
	| { type: 'agentkit_retry_completed'; url: string; status: number }

export interface CreateAgentkitHeaderOptions {
	extension: AgentkitExtension
	signer: AgentkitSigner
}

export interface CreateAgentkitFetchOptions {
	signer: AgentkitSigner
	fetch?: typeof fetch
	onEvent?: (event: AgentkitFetchEvent) => void
}

export async function createAgentkitHeader(options: CreateAgentkitHeaderOptions): Promise<string> {
	const supported = selectSupportedChain(options.extension, options.signer)
	if (!supported) {
		throw new Error(`Signer ${options.signer.chainId}/${options.signer.type} is not supported by this resource`)
	}

	const completeInfo: CompleteAgentkitInfo = {
		...options.extension.info,
		chainId: supported.chainId,
		type: supported.type,
		signatureScheme: supported.signatureScheme,
	}

	const message = formatSIWEMessage(completeInfo, options.signer.address)

	const signature = await options.signer.signMessage(message)
	const payload: AgentkitPayload = {
		...options.extension.info,
		address: options.signer.address,
		chainId: supported.chainId,
		type: supported.type,
		...(supported.signatureScheme ? { signatureScheme: supported.signatureScheme } : {}),
		signature,
	}

	return encodeBase64(JSON.stringify(payload))
}

export function createAgentkitFetch(options: CreateAgentkitFetchOptions): typeof fetch {
	const fetchFn = options.fetch ?? globalThis.fetch

	return (async (input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
		const request = new Request(input, init)
		const response = await fetchFn(request.clone())
		if (response.status !== 402) return response

		const paymentRequired = await parsePaymentRequired(response)
		const extension = paymentRequired?.extensions?.[AGENTKIT]
		if (!isAgentkitExtension(extension)) return response

		const url = request.url
		options.onEvent?.({ type: 'agentkit_detected', url })

		let header: string
		try {
			header = await createAgentkitHeader({ extension, signer: options.signer })
		} catch (err) {
			options.onEvent?.({
				type: 'agentkit_skipped',
				url,
				reason: err instanceof Error ? err.message : 'Unable to create AgentKit header',
			})
			return response
		}

		options.onEvent?.({
			type: 'agentkit_signed',
			url,
			chainId: options.signer.chainId,
			signatureType: options.signer.type,
		})

		const headers = new Headers(request.headers)
		headers.set(AGENTKIT, header)

		const retryResponse = await fetchFn(new Request(request, { headers }))
		options.onEvent?.({ type: 'agentkit_retry_completed', url, status: retryResponse.status })

		return retryResponse
	}) as typeof fetch
}

function selectSupportedChain(extension: AgentkitExtension, signer: AgentkitSigner) {
	return extension.supportedChains.find(chain => chain.chainId === signer.chainId && chain.type === signer.type)
}

async function parsePaymentRequired(response: Response): Promise<PaymentRequired | null> {
	try {
		return (await response.clone().json()) as PaymentRequired
	} catch {
		return null
	}
}

function isAgentkitExtension(value: unknown): value is AgentkitExtension {
	if (!value || typeof value !== 'object') return false

	const extension = value as AgentkitExtension
	return Boolean(
		extension.info &&
			typeof extension.info === 'object' &&
			typeof extension.info.domain === 'string' &&
			typeof extension.info.uri === 'string' &&
			typeof extension.info.version === 'string' &&
			typeof extension.info.nonce === 'string' &&
			typeof extension.info.issuedAt === 'string' &&
			Array.isArray(extension.supportedChains)
	)
}

function encodeBase64(value: string): string {
	if (typeof btoa === 'function') return btoa(value)
	return Buffer.from(value, 'utf8').toString('base64')
}
