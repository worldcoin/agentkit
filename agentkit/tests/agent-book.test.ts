import { describe, expect, it } from 'bun:test'
import type { PublicClient } from 'viem'
import { createAgentBookVerifier } from '../src/agent-book'

function createMockClient(result: bigint, calls: Array<{ address: string }>): PublicClient {
	return {
		readContract: async (args: { address: string }) => {
			calls.push({ address: args.address })
			return result
		},
	} as unknown as PublicClient
}

describe('createAgentBookVerifier', () => {
	it('defaults non-Base chains to the Base mainnet AgentBook', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
		})

		const humanId = await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678', 'eip155:480')

		expect(humanId).toBe('0x1')
		expect(calls).toEqual([{ address: '0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4' }])
	})

	it('uses Base Sepolia when the request chain is Base Sepolia', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
		})

		await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678', 'eip155:84532')

		expect(calls).toEqual([{ address: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' }])
	})

	it('allows pinning lookup to Base Sepolia explicitly', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
			network: 'base-sepolia',
		})

		await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678', 'eip155:480')

		expect(calls).toEqual([{ address: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' }])
	})

	it('still honors custom contract deployments', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
			contractAddress: '0x9999999999999999999999999999999999999999',
		})

		await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678', 'eip155:480')

		expect(calls).toEqual([{ address: '0x9999999999999999999999999999999999999999' }])
	})
})
