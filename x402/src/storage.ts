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
	 * Optional replay protection: atomically record a signature nonce, returning `true` when
	 * it was fresh and `false` when it was already recorded. When implemented, the hooks
	 * reject any signature whose nonce was seen before, making every signed request
	 * single-use.
	 *
	 * Implementations MUST combine check and record in one atomic operation (e.g. Redis
	 * `SET nonce 1 NX EX 300`) and may discard entries once `expiresAt` (unix seconds) has
	 * passed — expired signatures are rejected by the time-window check regardless.
	 */
	tryRecordNonce?(nonce: string, expiresAt: number): Promise<boolean>
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

	async tryRecordNonce(nonce: string, expiresAt: number): Promise<boolean> {
		const now = Math.floor(Date.now() / 1000)
		for (const [value, expiry] of this.nonces) {
			if (expiry <= now) this.nonces.delete(value)
		}

		if (this.nonces.has(nonce)) return false
		this.nonces.set(nonce, expiresAt)
		return true
	}
}
