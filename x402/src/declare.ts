import { AGENTKIT, buildAgentkitSchema } from '@worldcoin/agentkit-core'
import type {
	AgentkitExtension,
	AgentkitExtensionInfo,
	SignatureType,
	SupportedChain,
} from '@worldcoin/agentkit-core'
import type { DeclareAgentkitOptions } from './types'

export function getSignatureTypes(network: string): SignatureType[] {
	return network.startsWith('eip155:') ? ['eip191', 'eip1271'] : []
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
		supportedChains = networks.flatMap(network =>
			getSignatureTypes(network).map(type => ({
				chainId: network,
				type,
			}))
		)
	}

	const declaration: AgentkitDeclaration = {
		info: info as AgentkitExtensionInfo,
		supportedChains,
		schema: buildAgentkitSchema(),
		_options: options,
	}

	return { [AGENTKIT]: declaration }
}
