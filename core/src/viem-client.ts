import * as chains from 'viem/chains'
import { createPublicClient, extractChain, http, type PublicClient } from 'viem'

const allChains = Object.values(chains)
const clientCache = new Map<string, PublicClient>()

const DEFAULT_PUBLIC_RPC_CHAINS = [
	chains.arcTestnet,
	chains.base,
	chains.tempo,
	chains.worldchain,
] as const

const defaultPublicRpcUrls = new Map<number, string>(
	DEFAULT_PUBLIC_RPC_CHAINS.map(chain => [chain.id, chain.rpcUrls.default.http[0]])
)

export function getDefaultPublicRpcUrl(numericChainId: number): string | undefined {
	return defaultPublicRpcUrls.get(numericChainId)
}

export function getPublicClient(numericChainId: number, rpcUrl?: string): PublicClient {
	const effectiveRpcUrl = rpcUrl ?? getDefaultPublicRpcUrl(numericChainId)
	const cacheKey = `${numericChainId}:${effectiveRpcUrl ?? ''}`
	let cached = clientCache.get(cacheKey)
	if (cached) return cached

	let chain: chains.Chain
	if (effectiveRpcUrl) {
		chain = { id: numericChainId } as chains.Chain
	} else {
		chain = extractChain({ chains: allChains, id: numericChainId as (typeof allChains)[number]['id'] })
	}

	cached = createPublicClient({ chain, transport: http(effectiveRpcUrl) }) as PublicClient
	clientCache.set(cacheKey, cached)
	return cached
}
