import * as chains from 'viem/chains'
import { createPublicClient, extractChain, http, type PublicClient } from 'viem'

const allChains = Object.values(chains)
const clientCache = new Map<string, PublicClient>()

// Shared Alchemy free-tier API key. This is intentionally NOT a secret: the
// endpoints below are rate-limited and treated as public RPC. Callers running
// production traffic should pass their own RPC URL via getPublicClient's rpcUrl.
const ALCHEMY_FREE_TIER_KEY = 'k0eQqlkOQBUAUuM8qcfGh'

// Arc mainnet (chain id 5042) is not live yet. Its public RPC is wired up ahead
// of launch so relying parties don't need a config update when it ships. viem
// has no chain definition for it yet, hence the hardcoded id.
const ARC_MAINNET_ID = 5042

const defaultPublicRpcUrls = new Map<number, string>([
	[chains.worldchain.id, chains.worldchain.rpcUrls.default.http[0]],
	[chains.base.id, chains.base.rpcUrls.default.http[0]],
	[chains.tempo.id, `https://tempo-mainnet.g.alchemy.com/v2/${ALCHEMY_FREE_TIER_KEY}`],
	[chains.arcTestnet.id, `https://arc-testnet.g.alchemy.com/v2/${ALCHEMY_FREE_TIER_KEY}`],
	[ARC_MAINNET_ID, 'http://rpc.arc.io/'],
])

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
