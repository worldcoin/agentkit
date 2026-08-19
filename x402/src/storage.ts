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
	 * Optional replay protection: when both nonce methods are implemented, the hooks reject
	 * any signature whose nonce was already recorded. Production implementations should make
	 * check-and-record atomic (e.g. Redis SET NX EX) and expire entries with a TTL of at
	 * least the 300-second signature window.
	 */
	hasUsedNonce?(nonce: string): Promise<boolean>
	recordNonce?(nonce: string): Promise<void>
}

export class InMemoryAgentKitStorage implements AgentKitStorage {
	private usage = new Map<string, number>()
	private nonces = new Set<string>()

	async tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean> {
		const key = `${endpoint}:${humanId}`
		const count = this.usage.get(key) ?? 0
		if (count >= limit) return false
		this.usage.set(key, count + 1)
		return true
	}

	async hasUsedNonce(nonce: string): Promise<boolean> {
		return this.nonces.has(nonce)
	}

	async recordNonce(nonce: string): Promise<void> {
		this.nonces.add(nonce)
	}
}
