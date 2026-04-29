// Re-export everything from core
export * from '@worldcoin/agentkit-core'

// x402-specific types
export type { AgentkitMode, DeclareAgentkitOptions } from './types'

// x402 server integration
export { declareAgentkitExtension } from './declare'
export { agentkitResourceServerExtension } from './server'

// x402 client integration
export { createAgentkitClient } from './client'
export type {
	AgentkitClient,
	AgentkitFetchEvent,
	AgentkitSigner,
	AgentkitSignerType,
	CreateAgentkitClientOptions,
} from './client'

// Storage
export { InMemoryAgentKitStorage, type AgentKitStorage } from './storage'

// Hooks
export { createAgentkitHooks, type CreateAgentkitHooksOptions, type AgentkitHookEvent } from './hooks'
