import { z } from 'incur'

const singleLine = z
	.string()
	.min(1)
	.refine(value => !/[\r\n]/.test(value), 'Must not contain line breaks')

const agentkitInfoSchema = z
	.object({
		domain: singleLine,
		uri: singleLine,
		version: singleLine,
		nonce: singleLine,
		issuedAt: singleLine,
		statement: singleLine.optional(),
		expirationTime: singleLine.optional(),
		notBefore: singleLine.optional(),
		requestId: singleLine.optional(),
		resources: z.array(singleLine).min(1).optional(),
	})
	.passthrough()

const supportedChainSchema = z
	.object({
		chainId: singleLine,
		type: singleLine,
	})
	.passthrough()

export const agentkitExtensionSchema = z
	.object({
		agentkit: z
			.object({
				info: agentkitInfoSchema,
				supportedChains: z.array(supportedChainSchema).min(1),
				schema: z.unknown().optional(),
			})
			.passthrough(),
	})
	.passthrough()

export const agentkitExtensionInputSchema = z
	.union([z.string(), agentkitExtensionSchema])
	.describe('AgentKit extension payload as JSON or a structured object')

export type AgentkitExtension = z.infer<typeof agentkitExtensionSchema>
export type AgentkitInfo = z.infer<typeof agentkitInfoSchema>

export type MessageSigner = {
	address: `0x${string}`
	signMessage: (message: string) => Promise<`0x${string}`>
}

export type AgentkitProof = {
	encoded: string
	message: string
	authorization: AgentkitInfo & {
		address: `0x${string}`
		chainId: string
		type: 'eip191'
		signature: `0x${string}`
	}
}

export class AgentkitPayloadError extends Error {
	constructor(message: string) {
		super(message)
		this.name = 'AgentkitPayloadError'
	}
}

export function parseAgentkitExtension(input: unknown): AgentkitExtension {
	let payload = input
	if (typeof input === 'string') {
		try {
			payload = JSON.parse(input)
		} catch {
			throw new AgentkitPayloadError('AgentKit extension payload is not valid JSON')
		}
	}

	const parsed = agentkitExtensionSchema.safeParse(payload)
	if (!parsed.success) {
		const details = parsed.error.issues
			.map(issue => `${issue.path.join('.') || 'payload'}: ${issue.message}`)
			.join('; ')
		throw new AgentkitPayloadError(`Invalid AgentKit extension payload: ${details}`)
	}

	return parsed.data
}

export function selectEip191Chain(
	supportedChains: AgentkitExtension['agentkit']['supportedChains']
): { chainId: string; numericChainId: string } {
	for (const supportedChain of supportedChains) {
		if (supportedChain.type !== 'eip191') continue
		const match = /^eip155:(0|[1-9]\d*)$/.exec(supportedChain.chainId)
		if (match) return { chainId: supportedChain.chainId, numericChainId: match[1]! }
	}

	throw new AgentkitPayloadError('The AgentKit extension does not support an EVM EIP-191 signer')
}

export function createSiweMessage(
	info: AgentkitInfo,
	address: `0x${string}`,
	numericChainId: string
): string {
	const lines = [`${info.domain} wants you to sign in with your Ethereum account:`, address, '']

	if (info.statement !== undefined) lines.push(info.statement, '')

	lines.push(
		`URI: ${info.uri}`,
		`Version: ${info.version}`,
		`Chain ID: ${numericChainId}`,
		`Nonce: ${info.nonce}`,
		`Issued At: ${info.issuedAt}`
	)

	if (info.expirationTime !== undefined) lines.push(`Expiration Time: ${info.expirationTime}`)
	if (info.notBefore !== undefined) lines.push(`Not Before: ${info.notBefore}`)
	if (info.requestId !== undefined) lines.push(`Request ID: ${info.requestId}`)
	if (info.resources !== undefined) {
		lines.push('Resources:')
		for (const resource of info.resources) lines.push(`- ${resource}`)
	}

	return lines.join('\n')
}

export async function createAgentkitProof(input: unknown, signer: MessageSigner): Promise<AgentkitProof> {
	const extension = parseAgentkitExtension(input)
	const { chainId, numericChainId } = selectEip191Chain(extension.agentkit.supportedChains)
	const message = createSiweMessage(extension.agentkit.info, signer.address, numericChainId)
	const signature = await signer.signMessage(message)
	const authorization = {
		...extension.agentkit.info,
		address: signer.address,
		chainId,
		type: 'eip191' as const,
		signature,
	}
	const encoded = Buffer.from(JSON.stringify(authorization), 'utf8').toString('base64')

	return { encoded, message, authorization }
}
