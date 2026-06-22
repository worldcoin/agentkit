import { describe, expect, it } from 'bun:test'
import { resolveAgentkitSignatureRpcUrl } from '../src/verify'

describe('resolveAgentkitSignatureRpcUrl', () => {
	it('keeps the legacy single rpcUrl form as a fallback', () => {
		expect(resolveAgentkitSignatureRpcUrl('eip155:8453', 'https://fallback.example')).toBe('https://fallback.example')
		expect(resolveAgentkitSignatureRpcUrl('eip155:8453', { rpcUrl: 'https://fallback.example' })).toBe(
			'https://fallback.example'
		)
	})

	it('selects the custom RPC URL from the signed payload chain ID', () => {
		expect(
			resolveAgentkitSignatureRpcUrl('eip155:8453', {
				rpcUrl: 'https://world-chain.example',
				rpcUrls: {
					'eip155:480': 'https://world-chain.example',
					'eip155:8453': 'https://base.example',
				},
			})
		).toBe('https://base.example')
	})

	it('falls back when no per-chain RPC URL is configured for the signed chain', () => {
		expect(
			resolveAgentkitSignatureRpcUrl('eip155:10', {
				rpcUrl: 'https://fallback.example',
				rpcUrls: {
					'eip155:480': 'https://world-chain.example',
				},
			})
		).toBe('https://fallback.example')
	})
})
