import type { AgentkitExtensionSchema } from './types'

export function buildAgentkitSchema(): AgentkitExtensionSchema {
	return {
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		type: 'object',
		properties: {
			domain: { type: 'string' },
			address: { type: 'string' },
			statement: { type: 'string' },
			uri: { type: 'string', format: 'uri' },
			version: { type: 'string' },
			chainId: { type: 'string' },
			type: { type: 'string' },
			nonce: { type: 'string' },
			issuedAt: { type: 'string', format: 'date-time' },
			expirationTime: { type: 'string', format: 'date-time' },
			notBefore: { type: 'string', format: 'date-time' },
			requestId: { type: 'string' },
			resources: { type: 'array', items: { type: 'string', format: 'uri' } },
			signature: { type: 'string' },
		},
		required: ['domain', 'address', 'uri', 'version', 'chainId', 'type', 'nonce', 'issuedAt', 'signature'],
	}
}
