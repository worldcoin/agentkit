import type { AgentkitMode } from './types'

export const AGENTKIT = 'agentkit'
export const AGENTKIT_HEADER = 'AgentKit'

export interface AgentkitExtension {
	mode?: AgentkitMode
}

/**
 * Convert the parsed body exposed by x402 HTTP adapters into the UTF-8 text
 * signed by AgentKit clients. JSON bodies are serialized without insignificant
 * whitespace; text bodies are preserved.
 */
export function normalizeAgentkitBody(body: unknown): string {
	if (body === undefined) return ''
	if (typeof body === 'string') return body
	if (body instanceof ArrayBuffer) return new TextDecoder('utf-8', { fatal: true }).decode(body)
	if (ArrayBuffer.isView(body)) {
		return new TextDecoder('utf-8', { fatal: true }).decode(
			new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
		)
	}

	const serialized = JSON.stringify(body)
	if (serialized === undefined) throw new Error('AgentKit cannot serialize this request body')
	return serialized
}

export function normalizeAgentkitJsonBody(body: unknown): string {
	const serialized = JSON.stringify(body)
	if (serialized === undefined) throw new Error('AgentKit cannot serialize this JSON request body')
	return serialized
}

export async function normalizeAgentkitRequestBody(request: Request): Promise<string> {
	if (request.body === null) return ''

	const text = await request.clone().text()
	if (text === '') return ''

	const contentType = request.headers.get('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
	if (contentType === 'application/json' || contentType?.endsWith('+json')) {
		try {
			return normalizeAgentkitJsonBody(JSON.parse(text))
		} catch {
			throw new Error('AgentKit cannot sign an invalid JSON request body')
		}
	}

	return text
}
