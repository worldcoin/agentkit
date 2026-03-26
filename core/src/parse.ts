import { base64 } from '@scure/base'
import { AgentkitPayloadSchema, type AgentkitPayload } from './types'

export function parseAgentkitHeader(header: string): AgentkitPayload {
	let jsonStr: string
	try {
		jsonStr = new TextDecoder().decode(base64.decode(header))
	} catch {
		throw new Error('Invalid agentkit header: not valid base64')
	}

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
