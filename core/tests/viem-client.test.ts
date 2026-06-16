import { describe, expect, it } from 'bun:test'
import { getDefaultPublicRpcUrl } from '../src/viem-client'

describe('getDefaultPublicRpcUrl', () => {
	it('provides built-in public RPCs for common SCA verification chains', () => {
		expect(getDefaultPublicRpcUrl(480)).toBe('https://worldchain-mainnet.g.alchemy.com/public')
		expect(getDefaultPublicRpcUrl(4217)).toBe('https://tempo-mainnet.g.alchemy.com/v2/k0eQqlkOQBUAUuM8qcfGh')
		expect(getDefaultPublicRpcUrl(8453)).toBe('https://mainnet.base.org')
		expect(getDefaultPublicRpcUrl(5_042_002)).toBe('https://arc-testnet.g.alchemy.com/v2/k0eQqlkOQBUAUuM8qcfGh')
		expect(getDefaultPublicRpcUrl(5042)).toBe('http://rpc.arc.io/')
	})

	it('leaves unsupported chains override-only', () => {
		expect(getDefaultPublicRpcUrl(1)).toBeUndefined()
		expect(getDefaultPublicRpcUrl(42_431)).toBeUndefined()
	})
})
