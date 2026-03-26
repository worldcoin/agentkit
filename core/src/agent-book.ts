import { toHex, type PublicClient } from 'viem'
import { extractEVMChainId } from './evm'
import { getPublicClient } from './viem-client'

const WORLD_MAINNET = 'eip155:480' as const

const AGENT_BOOK_ADDRESS: `0x${string}` = '0xA23aB2712eA7BBa896930544C7d6636a96b944dA'

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
	/** Custom contract address. Overrides the built-in World Chain deployment. */
	contractAddress?: `0x${string}`
	/** Custom RPC URL. Defaults to the chain's default RPC. */
	rpcUrl?: string
}

export function createAgentBookVerifier(options: AgentBookOptions = {}) {
	function getClient(chainId: string): PublicClient {
		if (options.client) return options.client

		const numericId =
			options.contractAddress && options.rpcUrl
				? extractEVMChainId(chainId)
				: extractEVMChainId(WORLD_MAINNET)

		return getPublicClient(numericId, options.rpcUrl)
	}

	function getContractAddress(): `0x${string}` {
		if (options.contractAddress) return options.contractAddress
		return AGENT_BOOK_ADDRESS
	}

	return {
		/**
		 * Look up the anonymous human identifier for an agent's wallet address.
		 * @param address The agent's wallet address.
		 * @param chainId CAIP-2 chain identifier (e.g. "eip155:480"). Lookup always
		 *   resolves to the World Chain AgentBook deployment.
		 * @returns The human ID (hex string) if registered, or null.
		 */
		async lookupHuman(address: string, chainId: string): Promise<string | null> {
			const contractAddress = getContractAddress()
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
