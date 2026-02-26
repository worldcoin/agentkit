import nacl from 'tweetnacl'
import { base58 } from '@scure/base'
import type { CompleteAgentkitInfo } from './types'

export const SOLANA_MAINNET = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
export const SOLANA_DEVNET = 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
export const SOLANA_TESTNET = 'solana:4uhcVJyU9pJkvQyS88uRDiswHXSCkY3z'

export function extractSolanaChainReference(chainId: string): string {
	const [, reference] = chainId.split(':')
	return reference
}

export function formatSIWSMessage(info: CompleteAgentkitInfo, address: string): string {
	const lines: string[] = [`${info.domain} wants you to sign in with your Solana account:`, address, '']

	if (info.statement) {
		lines.push(info.statement, '')
	}

	lines.push(
		`URI: ${info.uri}`,
		`Version: ${info.version}`,
		`Chain ID: ${extractSolanaChainReference(info.chainId)}`,
		`Nonce: ${info.nonce}`,
		`Issued At: ${info.issuedAt}`
	)

	if (info.expirationTime) {
		lines.push(`Expiration Time: ${info.expirationTime}`)
	}
	if (info.notBefore) {
		lines.push(`Not Before: ${info.notBefore}`)
	}
	if (info.requestId) {
		lines.push(`Request ID: ${info.requestId}`)
	}

	if (info.resources && info.resources.length > 0) {
		lines.push('Resources:')
		for (const resource of info.resources) {
			lines.push(`- ${resource}`)
		}
	}

	return lines.join('\n')
}

export function verifySolanaSignature(message: string, signature: Uint8Array, publicKey: Uint8Array): boolean {
	const messageBytes = new TextEncoder().encode(message)
	return nacl.sign.detached.verify(messageBytes, signature, publicKey)
}

export function decodeBase58(encoded: string): Uint8Array {
	return base58.decode(encoded)
}

export function encodeBase58(bytes: Uint8Array): string {
	return base58.encode(bytes)
}
