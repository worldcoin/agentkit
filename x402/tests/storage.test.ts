import { describe, expect, it } from 'bun:test'
import { InMemoryAgentKitStorage } from '../src/storage'

describe('InMemoryAgentKitStorage.tryRecordNonce', () => {
	it('records a fresh nonce once and rejects the duplicate', async () => {
		const storage = new InMemoryAgentKitStorage()
		const expiresAt = Math.floor(Date.now() / 1000) + 300

		await expect(storage.tryRecordNonce('nonce-0123456789ab', expiresAt)).resolves.toBe(true)
		await expect(storage.tryRecordNonce('nonce-0123456789ab', expiresAt)).resolves.toBe(false)
		await expect(storage.tryRecordNonce('other-0123456789ab', expiresAt)).resolves.toBe(true)
	})

	it('prunes expired entries so the store stays bounded', async () => {
		const storage = new InMemoryAgentKitStorage()
		const now = Math.floor(Date.now() / 1000)

		await expect(storage.tryRecordNonce('nonce-0123456789ab', now - 1)).resolves.toBe(true)
		// The entry expired, so the same value can be recorded again. This is safe because
		// the verifier already rejects signatures past their expiry.
		await expect(storage.tryRecordNonce('nonce-0123456789ab', now + 300)).resolves.toBe(true)
	})
})
