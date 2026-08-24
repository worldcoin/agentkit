export interface AgentKitStorage {
	/**
	 * Atomically increment usage only if the current count is below the limit.
	 * Returns `true` if the increment was performed, `false` if the limit was already reached.
	 *
	 * Implementations MUST perform the check and increment as a single atomic operation
	 * (e.g. a database transaction with row-level locking) to prevent TOCTOU race conditions.
	 */
	tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean>

	/**
	 * Atomically record a nonce only when it has not already been consumed.
	 * Returns `true` when the nonce was recorded and `false` when it is a replay.
	 *
	 * Implementations MUST perform the check and insert as one atomic operation.
	 * They MUST also reject records whose validity window has already ended.
	 * `expiresAt` is the end of the challenge validity window and can be used as
	 * the row or cache TTL.
	 */
	consumeNonce?(nonce: string, expiresAt: Date): Promise<boolean>

	/** @deprecated Implement `consumeNonce` for atomic replay protection. */
	hasUsedNonce?(nonce: string): Promise<boolean>
	/** @deprecated Implement `consumeNonce` for atomic replay protection. */
	recordNonce?(nonce: string): Promise<void>
}

export class InMemoryAgentKitStorage implements AgentKitStorage {
	private usage = new Map<string, number>()
	private nonces = new Map<string, number>()

	async tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean> {
		const key = `${endpoint}:${humanId}`
		const count = this.usage.get(key) ?? 0
		if (count >= limit) return false
		this.usage.set(key, count + 1)
		return true
	}

	async consumeNonce(nonce: string, expiresAt: Date): Promise<boolean> {
		const now = Date.now()
		this.pruneExpiredNonces(now)
		if (expiresAt.getTime() <= now) return false
		if (this.nonces.has(nonce)) return false
		this.nonces.set(nonce, expiresAt.getTime())
		return true
	}

	async hasUsedNonce(nonce: string): Promise<boolean> {
		this.pruneExpiredNonces(Date.now())
		return this.nonces.has(nonce)
	}

	async recordNonce(nonce: string): Promise<void> {
		this.nonces.set(nonce, Date.now() + 5 * 60 * 1000)
	}

	private pruneExpiredNonces(now: number): void {
		for (const [nonce, expiresAt] of this.nonces) {
			if (expiresAt <= now) this.nonces.delete(nonce)
		}
	}
}
