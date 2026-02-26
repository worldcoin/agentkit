// Constants
export { AGENTKIT, AgentkitPayloadSchema } from './types'
export { SOLANA_MAINNET, SOLANA_DEVNET, SOLANA_TESTNET } from './solana'

// Types
export type {
	AgentkitExtension,
	AgentkitExtensionInfo,
	AgentkitExtensionSchema,
	AgentkitMode,
	AgentkitPayload,
	CompleteAgentkitInfo,
	DeclareAgentkitOptions,
	SignatureScheme,
	SignatureType,
	AgentkitValidationResult,
	AgentkitValidationOptions,
	AgentkitVerifyResult,
	EVMMessageVerifier,
	AgentkitVerifyOptions,
	SupportedChain,
} from './types'

// Server
export { declareAgentkitExtension } from './declare'
export { agentkitResourceServerExtension } from './server'
export { parseAgentkitHeader } from './parse'
export { validateAgentkitMessage } from './validate'
export { verifyAgentkitSignature } from './verify'
export { buildAgentkitSchema } from './schema'

// Chain utilities - EVM
export { formatSIWEMessage, verifyEVMSignature, extractEVMChainId } from './evm'

// Chain utilities - Solana
export {
	formatSIWSMessage,
	verifySolanaSignature,
	decodeBase58,
	encodeBase58,
	extractSolanaChainReference,
} from './solana'

// AgentBook
export { createAgentBookVerifier, type AgentBookVerifier, type AgentBookOptions } from './agent-book'

// Storage
export { InMemoryAgentKitStorage, type AgentKitStorage } from './storage'

// Hooks
export { createAgentkitHooks, type CreateAgentkitHooksOptions, type AgentkitHookEvent } from './hooks'
