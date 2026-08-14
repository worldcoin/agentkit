import { describe, expect, it } from 'bun:test'
import type { PublicClient } from 'viem'
import { lookupNullifierHash } from '../src/agent-book'

function createMockClient(result: bigint | Error, calls: Array<{ address: string }>): PublicClient {
	return {
		readContract: async (args: { address: string }) => {
			calls.push({ address: args.address })
			if (result instanceof Error) throw result
			return result
		},
	} as unknown as PublicClient
}

describe('lookupNullifierHash', () => {
	it('uses the canonical AgentBook deployment and returns the nullifier hash', async () => {
		const calls: Array<{ address: string }> = []
		const chainIds: number[] = []
		const nullifierHash = await lookupNullifierHash('0x1234567890abcdef1234567890abcdef12345678', {
			createClient(chainId) {
				chainIds.push(chainId)
				return createMockClient(1n, calls)
			},
		})

		expect(nullifierHash).toBe('0x1')
		expect(chainIds).toEqual([480])
		expect(calls).toEqual([{ address: '0xA23aB2712eA7BBa896930544C7d6636a96b944dA' }])
	})

	it('returns null for an unregistered address', async () => {
		const nullifierHash = await lookupNullifierHash('0x1234567890abcdef1234567890abcdef12345678', {
			client: createMockClient(0n, []),
		})
		expect(nullifierHash).toBeNull()
	})

	it('propagates World Chain RPC failures', async () => {
		await expect(
			lookupNullifierHash('0x1234567890abcdef1234567890abcdef12345678', {
				client: createMockClient(new Error('RPC failed'), []),
			})
		).rejects.toThrow('RPC failed')
	})
})
