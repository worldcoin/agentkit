import { toHex, type PublicClient } from 'viem'
import { worldchain } from 'viem/chains'
import { getPublicClient } from './viem-client'

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
	/** Custom viem PublicClient. Advanced override for testing or custom deployments. */
	client?: PublicClient
	/** Custom AgentBook contract address on World Chain. Defaults to the canonical deployment. */
	contractAddress?: `0x${string}`
	/** Custom World Chain RPC URL. Defaults to the chain's default public RPC. */
	rpcUrl?: string
}

export function createAgentBookVerifier(options: AgentBookOptions = {}) {
	return {
		/**
		 * Look up the anonymous human identifier for an agent's wallet address.
		 * Always resolves against the AgentBook deployment on World Chain, regardless
		 * of which chain the agent's signature was produced on.
		 */
		async lookupHuman(address: string): Promise<string | null> {
			const contractAddress = options.contractAddress ?? AGENT_BOOK_ADDRESS
			const client = options.client ?? getPublicClient(worldchain.id, options.rpcUrl)

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
