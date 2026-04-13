import type { PublicClient } from 'viem'
import { describe, expect, it } from 'bun:test'
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
	it('looks up addresses against the World Chain AgentBook', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
		})

		const humanId = await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678')

		expect(humanId).toBe('0x1')
		expect(calls).toEqual([{ address: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' }])
	})

	it('returns null for unregistered addresses', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(0n, calls),
		})

		const humanId = await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678')

		expect(humanId).toBeNull()
	})

	it('honors custom contract deployments', async () => {
		const calls: Array<{ address: string }> = []
		const verifier = createAgentBookVerifier({
			client: createMockClient(1n, calls),
			contractAddress: '0x9999999999999999999999999999999999999999',
		})

		await verifier.lookupHuman('0x1234567890abcdef1234567890abcdef12345678')

		expect(calls).toEqual([{ address: '0x9999999999999999999999999999999999999999' }])
	})
})
