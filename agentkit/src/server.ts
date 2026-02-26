import { AGENTKIT } from './types'
import { randomBytes } from 'crypto'
import { buildAgentkitSchema } from './schema'
import { getSignatureType, type AgentkitDeclaration } from './declare'
import type { ResourceServerExtension, PaymentRequiredContext } from '@x402/core/types'
import type {
	AgentkitExtension,
	AgentkitExtensionInfo,
	AgentkitMode,
	SupportedChain,
	DeclareAgentkitOptions,
} from './types'

export const agentkitResourceServerExtension: ResourceServerExtension = {
	key: AGENTKIT,

	enrichPaymentRequiredResponse: async (declaration: unknown, context: PaymentRequiredContext): Promise<AgentkitExtension> => {
		const decl = declaration as AgentkitDeclaration
		const opts: DeclareAgentkitOptions = decl._options ?? {}

		const resourceUri = opts.resourceUri ?? context.resourceInfo.url

		let domain = opts.domain
		if (!domain && resourceUri) {
			try {
				domain = new URL(resourceUri).hostname
			} catch {
				// leave domain undefined
			}
		}

		let networks: string[]
		if (opts.network) {
			networks = Array.isArray(opts.network) ? opts.network : [opts.network]
		} else {
			networks = [...new Set(context.requirements.map(r => r.network))]
		}

		const nonce = randomBytes(16).toString('hex')
		const issuedAt = new Date().toISOString()

		const expirationSeconds = opts.expirationSeconds
		const expirationTime =
			expirationSeconds !== undefined ? new Date(Date.now() + expirationSeconds * 1000).toISOString() : undefined

		const info: AgentkitExtensionInfo = {
			domain: domain ?? '',
			uri: resourceUri,
			version: opts.version ?? '1',
			nonce,
			issuedAt,
			resources: [resourceUri],
		}

		if (expirationTime) {
			info.expirationTime = expirationTime
		}
		if (opts.statement) {
			info.statement = opts.statement
		}

		const supportedChains: SupportedChain[] = networks.map(network => ({
			chainId: network,
			type: getSignatureType(network),
		}))

		return {
			info,
			supportedChains,
			schema: buildAgentkitSchema(),
			...(opts.mode ? { mode: opts.mode } : {}),
		}
	},
}
