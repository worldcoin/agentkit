export interface AgentKitStorage {
	/**
	 * Atomically increment usage only if the current count is below the limit.
	 * Returns `true` if the increment was performed, `false` if the limit was already reached.
	 *
	 * Implementations MUST perform the check and increment as a single atomic operation
	 * (e.g. a database transaction with row-level locking) to prevent TOCTOU race conditions.
	 */
	tryIncrementUsage(endpoint: string, lookupId: string, limit: number): Promise<boolean>
}

export class InMemoryAgentKitStorage implements AgentKitStorage {
	private usage = new Map<string, number>()

	async tryIncrementUsage(endpoint: string, lookupId: string, limit: number): Promise<boolean> {
		const key = `${endpoint}:${lookupId}`
		const count = this.usage.get(key) ?? 0
		if (count >= limit) return false
		this.usage.set(key, count + 1)
		return true
	}
}
