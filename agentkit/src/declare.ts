import { AGENTKIT } from './types'
import { buildAgentkitSchema } from './schema'
import type {
	AgentkitExtension,
	AgentkitExtensionInfo,
	DeclareAgentkitOptions,
	SignatureType,
	SupportedChain,
} from './types'

export function getSignatureType(network: string): SignatureType {
	return network.startsWith('solana:') ? 'ed25519' : 'eip191'
}

export interface AgentkitDeclaration extends AgentkitExtension {
	_options: DeclareAgentkitOptions
}

export function declareAgentkitExtension(options: DeclareAgentkitOptions = {}): Record<string, AgentkitDeclaration> {
	const info: Partial<AgentkitExtensionInfo> & { version: string } = {
		version: options.version ?? '1',
	}

	if (options.domain) {
		info.domain = options.domain
	}
	if (options.resourceUri) {
		info.uri = options.resourceUri
		info.resources = [options.resourceUri]
	}
	if (options.statement) {
		info.statement = options.statement
	}

	let supportedChains: SupportedChain[] = []
	if (options.network) {
		const networks = Array.isArray(options.network) ? options.network : [options.network]
		supportedChains = networks.map(network => ({
			chainId: network,
			type: getSignatureType(network),
		}))
	}

	const declaration: AgentkitDeclaration = {
		info: info as AgentkitExtensionInfo,
		supportedChains,
		schema: buildAgentkitSchema(),
		_options: options,
	}

	return { [AGENTKIT]: declaration }
}
