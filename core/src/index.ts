// Constants
export { AGENTKIT, AgentkitPayloadSchema } from './types'
export { SOLANA_MAINNET, SOLANA_DEVNET, SOLANA_TESTNET } from './solana'

// Types
export type {
	AgentkitExtension,
	AgentkitExtensionInfo,
	AgentkitExtensionSchema,
	AgentkitPayload,
	CompleteAgentkitInfo,
	SignatureScheme,
	SignatureType,
	AgentkitValidationResult,
	AgentkitValidationOptions,
	AgentkitVerifyResult,
	SupportedChain,
} from './types'

// Verification
export { parseAgentkitHeader } from './parse'
export { validateAgentkitMessage } from './validate'
export { resolveAgentkitSignatureRpcUrl, verifyAgentkitSignature } from './verify'
export type { AgentkitSignatureVerificationConfig, AgentkitSignatureVerificationOptions } from './verify'
export { buildAgentkitSchema } from './schema'

// Chain utilities - EVM
export { formatSIWEMessage, verifyEVMSignature, extractEVMChainId } from './evm'
export { getDefaultPublicRpcUrl } from './viem-client'

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
