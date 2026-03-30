import * as chains from 'viem/chains'
import { createPublicClient, extractChain, http, type PublicClient } from 'viem'

const allChains = Object.values(chains)
const clientCache = new Map<string, PublicClient>()

export function getPublicClient(numericChainId: number, rpcUrl?: string): PublicClient {
	const cacheKey = `${numericChainId}:${rpcUrl ?? ''}`
	let cached = clientCache.get(cacheKey)
	if (cached) return cached

	let chain: chains.Chain
	if (rpcUrl) {
		chain = { id: numericChainId } as chains.Chain
	} else {
		chain = extractChain({ chains: allChains, id: numericChainId as (typeof allChains)[number]['id'] })
	}

	cached = createPublicClient({ chain, transport: http(rpcUrl) }) as PublicClient
	clientCache.set(cacheKey, cached)
	return cached
}
