import * as chains from 'viem/chains'
import { createPublicClient, extractChain, http, toHex, type PublicClient } from 'viem'

/** Known AgentBook deployments keyed by CAIP-2 network identifier. */
const KNOWN_DEPLOYMENTS: Record<string, `0x${string}`> = {
	// TODO: Deploy contract on Base
}

const AGENT_BOOK_ABI = [
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'lookupHuman',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const

export interface AgentBookOptions {
	/** Custom viem PublicClient. Overrides automatic client creation. */
	client?: PublicClient
	/** Custom contract address. Overrides the built-in network → address mapping. */
	contractAddress?: `0x${string}`
	/** Custom RPC URL. Defaults to the chain's default RPC. */
	rpcUrl?: string
}

export function createAgentBookVerifier(options: AgentBookOptions = {}) {
	const clientCache = new Map<string, PublicClient>()

	function getClient(chainId: string): PublicClient {
		if (options.client) return options.client

		let cached = clientCache.get(chainId)
		if (cached) return cached

		const numericId = extractNumericChainId(chainId)

		let chain
		if (options.rpcUrl) {
			chain = { id: numericId } as chains.Chain
		} else {
			const allChains = Object.values(chains)
			chain = extractChain({ chains: allChains, id: numericId as (typeof allChains)[number]['id'] })
		}

		cached = createPublicClient({
			chain,
			transport: http(options.rpcUrl),
		}) as PublicClient
		clientCache.set(chainId, cached)
		return cached
	}

	function getContractAddress(chainId: string): `0x${string}` {
		if (options.contractAddress) return options.contractAddress

		const address = KNOWN_DEPLOYMENTS[chainId]
		if (!address) {
			throw new Error(
				`No AgentBook deployment known for network ${chainId}. ` +
					`Pass a contractAddress to createAgentBookVerifier().`
			)
		}
		return address
	}

	return {
		/**
		 * Look up the anonymous human identifier for an agent's wallet address.
		 * @param address The agent's wallet address.
		 * @param chainId CAIP-2 chain identifier (e.g. "eip155:84532") used to
		 *   resolve the AgentBook contract address and RPC endpoint.
		 * @returns The human ID (hex string) if registered, or null.
		 */
		async lookupHuman(address: string, chainId: string): Promise<string | null> {
			const contractAddress = getContractAddress(chainId)
			const client = getClient(chainId)

			try {
				const humanId = await client.readContract({
					address: contractAddress,
					abi: AGENT_BOOK_ABI,
					functionName: 'lookupHuman',
					args: [address as `0x${string}`],
				})

				if (humanId === 0n) return null

				return toHex(humanId)
			} catch {
				return null
			}
		},
	}
}

export type AgentBookVerifier = ReturnType<typeof createAgentBookVerifier>

function extractNumericChainId(caip2: string): number {
	const match = /^eip155:(\d+)$/.exec(caip2)
	if (!match) throw new Error(`Unsupported chain format: ${caip2}`)
	return parseInt(match[1], 10)
}
