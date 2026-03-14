import { toHex, type PublicClient } from 'viem'
import { extractEVMChainId } from './evm'
import { getPublicClient } from './viem-client'

const WORLD_MAINNET = 'eip155:480'
const BASE_MAINNET = 'eip155:8453'
const BASE_SEPOLIA = 'eip155:84532'

/** Known AgentBook deployments keyed by CAIP-2 network identifier. */
const KNOWN_DEPLOYMENTS: Record<string, `0x${string}`> = {
    WORLD_MAINNET: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA',
	BASE_MAINNET: '0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4',
	BASE_SEPOLIA: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA',
}


export type AgentBookNetwork = 'world' | 'base' | 'base-sepolia'

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
	/** Pin lookup to the built-in Base or Base Sepolia AgentBook deployment. */
	network?: AgentBookNetwork
}

export function createAgentBookVerifier(options: AgentBookOptions = {}) {
	function resolveLookupChainId(chainId: string): string {
		if (options.network === 'base') return BASE_MAINNET
        if (options.network === 'world') return WORLD_MAINNET
		if (options.network === 'base-sepolia') return BASE_SEPOLIA

		if (chainId === WORLD_MAINNET || chainId === BASE_MAINNET || chainId === BASE_SEPOLIA) {
			return chainId
		}

		// AgentBook is only deployed on WorldChain, Base mainnet and Base Sepolia.
		// Default Worldchain mainnet unless explicitly pinned.
		return WORLD_MAINNET
	}

	function getClient(chainId: string): PublicClient {
		if (options.client) return options.client

		const lookupChainId = resolveLookupChainId(chainId)

		const numericId =
			options.contractAddress && options.rpcUrl && !options.network
				? extractEVMChainId(chainId)
				: extractEVMChainId(lookupChainId)

		return getPublicClient(numericId, options.rpcUrl)
	}

	function getContractAddress(chainId: string): `0x${string}` {
		if (options.contractAddress) return options.contractAddress

		const lookupChainId = resolveLookupChainId(chainId)
		const address = KNOWN_DEPLOYMENTS[lookupChainId]
		if (!address) {
			throw new Error(
				`No AgentBook deployment known for network ${lookupChainId}. ` +
					`Pass a contractAddress to createAgentBookVerifier().`
			)
		}
		return address
	}

	return {
		/**
		 * Look up the anonymous human identifier for an agent's wallet address.
		 * @param address The agent's wallet address.
		 * @param chainId CAIP-2 chain identifier (e.g. "eip155:480"). Built-in
		 *   lookup resolves to Base mainnet or Base Sepolia only.
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
