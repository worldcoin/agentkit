import { describe, expect, it } from 'bun:test'
import { InMemoryAgentKitStorage } from '../src/storage'

describe('InMemoryAgentKitStorage', () => {
	it('consumes each unexpired nonce once', async () => {
		const storage = new InMemoryAgentKitStorage()
		const expiresAt = new Date(Date.now() + 60_000)

		expect(await storage.consumeNonce('nonce-1', expiresAt)).toBe(true)
		expect(await storage.consumeNonce('nonce-1', expiresAt)).toBe(false)
	})

	it('prunes nonce records after their challenge validity window', async () => {
		const storage = new InMemoryAgentKitStorage()

		expect(await storage.consumeNonce('nonce-1', new Date(Date.now() - 1))).toBe(true)
		expect(await storage.consumeNonce('nonce-1', new Date(Date.now() + 60_000))).toBe(true)
	})
})
