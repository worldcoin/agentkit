import { z } from 'zod'

export const AGENTKIT = 'agentkit'

export type SignatureScheme = 'eip191' | 'eip1271' | 'eip6492' | 'siws'

export type SignatureType = 'eip191' | 'ed25519'

export interface SupportedChain {
	chainId: string
	type: SignatureType
	signatureScheme?: SignatureScheme
}

export interface AgentkitExtensionInfo {
	domain: string
	uri: string
	statement?: string
	version: string
	nonce: string
	issuedAt: string
	expirationTime?: string
	notBefore?: string
	requestId?: string
	resources?: string[]
}

export interface AgentkitExtensionSchema {
	$schema: string
	type: 'object'
	properties: {
		domain: { type: 'string' }
		address: { type: 'string' }
		statement?: { type: 'string' }
		uri: { type: 'string'; format: 'uri' }
		version: { type: 'string' }
		chainId: { type: 'string' }
		type: { type: 'string' }
		nonce: { type: 'string' }
		issuedAt: { type: 'string'; format: 'date-time' }
		expirationTime?: { type: 'string'; format: 'date-time' }
		notBefore?: { type: 'string'; format: 'date-time' }
		requestId?: { type: 'string' }
		resources?: { type: 'array'; items: { type: 'string'; format: 'uri' } }
		signature: { type: 'string' }
	}
	required: string[]
}

export interface AgentkitExtension {
	info: AgentkitExtensionInfo
	supportedChains: SupportedChain[]
	schema: AgentkitExtensionSchema
}

export const AgentkitPayloadSchema = z.object({
	domain: z.string(),
	address: z.string(),
	statement: z.string().optional(),
	uri: z.string(),
	version: z.string(),
	chainId: z.string(),
	type: z.enum(['eip191', 'ed25519']),
	nonce: z.string(),
	issuedAt: z.string(),
	expirationTime: z.string().optional(),
	notBefore: z.string().optional(),
	requestId: z.string().optional(),
	resources: z.array(z.string()).optional(),
	signatureScheme: z.enum(['eip191', 'eip1271', 'eip6492', 'siws']).optional(),
	signature: z.string(),
})

export type AgentkitPayload = z.infer<typeof AgentkitPayloadSchema>

export type AgentkitMode =
	| { type: 'free' }
	| { type: 'free-trial'; uses?: number }
	| { type: 'discount'; percent: number; uses?: number }

export interface DeclareAgentkitOptions {
	domain?: string
	resourceUri?: string
	statement?: string
	version?: string
	network?: string | string[]
	expirationSeconds?: number
	mode?: AgentkitMode
}

export interface AgentkitValidationResult {
	valid: boolean
	error?: string
}

export interface AgentkitValidationOptions {
	maxAge?: number
	checkNonce?: (nonce: string) => boolean | Promise<boolean>
}

export interface AgentkitVerifyResult {
	valid: boolean
	address?: string
	error?: string
}

export type EVMMessageVerifier = (args: {
	address: `0x${string}`
	message: string
	signature: `0x${string}`
}) => Promise<boolean>

export interface AgentkitVerifyOptions {
	evmVerifier?: EVMMessageVerifier
}

export type CompleteAgentkitInfo = AgentkitExtensionInfo & {
	chainId: string
	type: SignatureType
	signatureScheme?: SignatureScheme
}
