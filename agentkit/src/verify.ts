import { formatSIWEMessage, verifyEVMSignature } from './evm'
import { formatSIWSMessage, verifySolanaSignature, decodeBase58 } from './solana'
import type { AgentkitPayload, AgentkitVerifyResult, AgentkitVerifyOptions, EVMMessageVerifier } from './types'

export async function verifyAgentkitSignature(payload: AgentkitPayload, options?: AgentkitVerifyOptions): Promise<AgentkitVerifyResult> {
	try {
		if (payload.chainId.startsWith('eip155:')) {
			return verifyEVMPayload(payload, options?.evmVerifier)
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

async function verifyEVMPayload(payload: AgentkitPayload, verifier?: EVMMessageVerifier): Promise<AgentkitVerifyResult> {
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
		const valid = await verifyEVMSignature(message, payload.address, payload.signature, verifier)

		if (!valid) {
			return { valid: false, error: 'Signature verification failed' }
		}

		return { valid: true, address: payload.address }
	} catch (error) {
		return {
			valid: false,
			error: error instanceof Error ? error.message : 'Signature verification failed',
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
