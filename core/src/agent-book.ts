import { createPublicClient, http, toHex, type PublicClient } from 'viem'
import { worldchain } from 'viem/chains'

const AGENT_BOOK_ADDRESS: `0x${string}` = '0xA23aB2712eA7BBa896930544C7d6636a96b944dA'

const AGENT_BOOK_ABI = [
	{
		inputs: [{ internalType: 'address', name: '', type: 'address' }],
		name: 'lookupHuman',
		outputs: [{ internalType: 'uint256', name: 'lookupId', type: 'uint256' }],
		stateMutability: 'view',
		type: 'function',
	},
] as const

interface AgentBookLookupOptions {
	client?: PublicClient
	createClient?: (chainId: number) => PublicClient
}

export async function lookupId(
	address: string,
	options: AgentBookLookupOptions = {}
): Promise<string | null> {
	const client =
		options.client ??
		options.createClient?.(worldchain.id) ??
		createPublicClient({ chain: worldchain, transport: http() })
	const lookupId = await client.readContract({
		address: AGENT_BOOK_ADDRESS,
		abi: AGENT_BOOK_ABI,
		functionName: 'lookupHuman',
		args: [address as `0x${string}`],
	})

	return lookupId === 0n ? null : toHex(lookupId)
}
