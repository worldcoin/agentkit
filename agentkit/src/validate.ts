import type { AgentkitPayload, AgentkitValidationResult, AgentkitValidationOptions } from './types'

const DEFAULT_MAX_AGE_MS = 5 * 60 * 1000

export async function validateAgentkitMessage(
	message: AgentkitPayload,
	expectedResourceUri: string,
	options: AgentkitValidationOptions = {}
): Promise<AgentkitValidationResult> {
	const expectedUrl = new URL(expectedResourceUri)
	const maxAge = options.maxAge ?? DEFAULT_MAX_AGE_MS

	if (message.domain !== expectedUrl.hostname) {
		return {
			valid: false,
			error: `Domain mismatch: expected "${expectedUrl.hostname}", got "${message.domain}"`,
		}
	}

	let messageOrigin: string
	try {
		messageOrigin = new URL(message.uri).origin
	} catch {
		return { valid: false, error: `Invalid URI: "${message.uri}"` }
	}

	if (messageOrigin !== expectedUrl.origin) {
		return {
			valid: false,
			error: `URI mismatch: expected origin "${expectedUrl.origin}", got "${messageOrigin}"`,
		}
	}

	const issuedAt = new Date(message.issuedAt)
	if (isNaN(issuedAt.getTime())) {
		return { valid: false, error: 'Invalid issuedAt timestamp' }
	}

	const age = Date.now() - issuedAt.getTime()
	if (age > maxAge) {
		return {
			valid: false,
			error: `Message too old: ${Math.round(age / 1000)}s exceeds ${maxAge / 1000}s limit`,
		}
	}
	if (age < 0) {
		return { valid: false, error: 'issuedAt is in the future' }
	}

	if (message.expirationTime) {
		const expiration = new Date(message.expirationTime)
		if (isNaN(expiration.getTime())) {
			return { valid: false, error: 'Invalid expirationTime timestamp' }
		}
		if (expiration < new Date()) {
			return { valid: false, error: 'Message expired' }
		}
	}

	if (message.notBefore) {
		const notBefore = new Date(message.notBefore)
		if (isNaN(notBefore.getTime())) {
			return { valid: false, error: 'Invalid notBefore timestamp' }
		}
		if (new Date() < notBefore) {
			return { valid: false, error: 'Message not yet valid (notBefore is in the future)' }
		}
	}

	if (options.checkNonce) {
		const nonceValid = await options.checkNonce(message.nonce)
		if (!nonceValid) {
			return { valid: false, error: 'Nonce validation failed (possible replay attack)' }
		}
	}

	return { valid: true }
}
