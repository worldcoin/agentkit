import { formatSIWEMessage, verifyEVMSignature } from './evm'
import { formatSIWSMessage, verifySolanaSignature, decodeBase58 } from './solana'
import type { AgentkitPayload, AgentkitVerifyResult } from './types'

export async function verifyAgentkitSignature(payload: AgentkitPayload, rpcUrl?: string): Promise<AgentkitVerifyResult> {
	try {
		if (payload.chainId.startsWith('eip155:')) {
			return verifyEVMPayload(payload, rpcUrl)
		}

		if (payload.chainId.startsWith('solana:')) {
			return verifySolanaPayload(payload)
		}

		return {
			valid: false,
			error: `Unsupported chain namespace: ${payload.chainId}. Supported: eip155:* (EVM), solana:* (Solana)`,
		}
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Verification failed',
		}
	}
}

async function verifyEVMPayload(payload: AgentkitPayload, rpcUrl?: string): Promise<AgentkitVerifyResult> {
	const message = formatSIWEMessage(
		{
			domain: payload.domain,
			uri: payload.uri,
			statement: payload.statement,
			version: payload.version,
			chainId: payload.chainId,
			type: payload.type,
			nonce: payload.nonce,
			issuedAt: payload.issuedAt,
			expirationTime: payload.expirationTime,
			notBefore: payload.notBefore,
			requestId: payload.requestId,
			resources: payload.resources,
		},
		payload.address
	)

	try {
		const valid = await verifyEVMSignature(message, payload.address, payload.signature, payload.chainId, rpcUrl)

		if (!valid) {
			return {
				valid: false,
				error: `Signature verification failed. The signature does not match the reconstructed SIWE message. Ensure your agent signs exactly this message using EIP-191 (EOA) or ERC-1271 (smart wallet):\n\n${message}`,
			}
		}

		return { valid: true, address: payload.address }
	} catch (error) {
		const reason = error instanceof Error ? error.message : 'Unknown error'
		return {
			valid: false,
			error: `Signature verification error: ${reason}. The SIWE message the server reconstructed from your payload:\n\n${message}`,
		}
	}
}

function verifySolanaPayload(payload: AgentkitPayload): AgentkitVerifyResult {
	const message = formatSIWSMessage(
		{
			domain: payload.domain,
			uri: payload.uri,
			statement: payload.statement,
			version: payload.version,
			chainId: payload.chainId,
			type: payload.type,
			nonce: payload.nonce,
			issuedAt: payload.issuedAt,
			expirationTime: payload.expirationTime,
			notBefore: payload.notBefore,
			requestId: payload.requestId,
			resources: payload.resources,
		},
		payload.address
	)

	let signature: Uint8Array
	let publicKey: Uint8Array

	try {
		signature = decodeBase58(payload.signature)
		publicKey = decodeBase58(payload.address)
	} catch (error) {
		return {
			valid: false,
			error: `Invalid Base58 encoding: ${error instanceof Error ? error.message : 'decode failed'}`,
		}
	}

	if (signature.length !== 64) {
		return { valid: false, error: `Invalid signature length: expected 64 bytes, got ${signature.length}` }
	}

	if (publicKey.length !== 32) {
		return { valid: false, error: `Invalid public key length: expected 32 bytes, got ${publicKey.length}` }
	}

	const valid = verifySolanaSignature(message, signature, publicKey)

	if (!valid) {
		return { valid: false, error: 'Solana signature verification failed' }
	}

	return { valid: true, address: payload.address }
}
