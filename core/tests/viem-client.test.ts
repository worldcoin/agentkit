import { describe, expect, it } from 'bun:test'
import { getDefaultPublicRpcUrl } from '../src/viem-client'

describe('getDefaultPublicRpcUrl', () => {
	it('provides built-in public RPCs for common SCA verification chains', () => {
		expect(getDefaultPublicRpcUrl(480)).toBe('https://worldchain-mainnet.g.alchemy.com/public')
		expect(getDefaultPublicRpcUrl(4217)).toBe('https://rpc.presto.tempo.xyz')
		expect(getDefaultPublicRpcUrl(8453)).toBe('https://mainnet.base.org')
		expect(getDefaultPublicRpcUrl(5_042_002)).toBe('https://rpc.testnet.arc.network')
	})

	it('leaves unsupported chains override-only', () => {
		expect(getDefaultPublicRpcUrl(1)).toBeUndefined()
		expect(getDefaultPublicRpcUrl(42_431)).toBeUndefined()
	})
})
