import { describe, expect, it } from 'bun:test'
import { InMemoryAgentKitStorage } from '../src/storage'

describe('InMemoryAgentKitStorage', () => {
	it('consumes each unexpired nonce once', async () => {
		const storage = new InMemoryAgentKitStorage()
		const expiresAt = new Date(Date.now() + 60_000)

		expect(await storage.consumeNonce('nonce-1', expiresAt)).toBe(true)
		expect(await storage.consumeNonce('nonce-1', expiresAt)).toBe(false)
	})

	it('rejects expired nonce records', async () => {
		const storage = new InMemoryAgentKitStorage()

		expect(await storage.consumeNonce('nonce-1', new Date(Date.now() - 1))).toBe(false)
		expect(await storage.consumeNonce('nonce-1', new Date(Date.now() + 60_000))).toBe(true)
	})

	it('prunes consumed nonces after their challenge validity window', async () => {
		const originalDateNow = Date.now
		let currentTime = originalDateNow()
		const storage = new InMemoryAgentKitStorage()

		Date.now = () => currentTime
		try {
			expect(await storage.consumeNonce('nonce-1', new Date(currentTime + 1_000))).toBe(true)
			currentTime += 1_001
			expect(await storage.consumeNonce('nonce-1', new Date(currentTime + 1_000))).toBe(true)
		} finally {
			Date.now = originalDateNow
		}
	})
})
