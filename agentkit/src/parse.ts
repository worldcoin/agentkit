import { AgentkitPayloadSchema, type AgentkitPayload } from './types'
import { Base64EncodedRegex, safeBase64Decode } from '@x402/core/utils'

export function parseAgentkitHeader(header: string): AgentkitPayload {
	if (!Base64EncodedRegex.test(header)) {
		throw new Error('Invalid agentkit header: not valid base64')
	}

	const jsonStr = safeBase64Decode(header)

	let rawPayload: unknown
	try {
		rawPayload = JSON.parse(jsonStr)
	} catch (error) {
		if (error instanceof SyntaxError) {
			throw new Error('Invalid agentkit header: not valid JSON')
		}
		throw error
	}

	const parsed = AgentkitPayloadSchema.safeParse(rawPayload)

	if (!parsed.success) {
		const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
		throw new Error(`Invalid agentkit header: ${issues}`)
	}

	return parsed.data
}
