export interface AgentKitStorage {
	/**
	 * Atomically increment usage only if the current count is below the limit.
	 * Returns `true` if the increment was performed, `false` if the limit was already reached.
	 *
	 * Implementations MUST perform the check and increment as a single atomic operation
	 * (e.g. a database transaction with row-level locking) to prevent TOCTOU race conditions.
	 */
	tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean>

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
