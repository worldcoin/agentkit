export interface AgentKitStorage {
	getUsageCount(endpoint: string, humanId: string): Promise<number>
	incrementUsage(endpoint: string, humanId: string): Promise<void>

	hasUsedNonce?(nonce: string): Promise<boolean>
	recordNonce?(nonce: string): Promise<void>
}

export class InMemoryAgentKitStorage implements AgentKitStorage {
	private usage = new Map<string, number>()
	private nonces = new Set<string>()

	async getUsageCount(endpoint: string, humanId: string): Promise<number> {
		return this.usage.get(`${endpoint}:${humanId}`) ?? 0
	}

	async incrementUsage(endpoint: string, humanId: string): Promise<void> {
		const key = `${endpoint}:${humanId}`
		this.usage.set(key, (this.usage.get(key) ?? 0) + 1)
	}

	async hasUsedNonce(nonce: string): Promise<boolean> {
		return this.nonces.has(nonce)
	}

	async recordNonce(nonce: string): Promise<void> {
		this.nonces.add(nonce)
	}
}
