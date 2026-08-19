import type { AgentkitMode } from './types'
import type { AgentKitStorage } from './storage'
import { verifyRequest, type VerifiedAgentRequest } from '@worldcoin/agentkit-core'
import {
	AGENTKIT_CONTENT_DIGEST_HEADER,
	AGENTKIT_SIGNATURE_HEADER,
	AGENTKIT_SIGNATURE_INPUT_HEADER,
	normalizeAgentkitBody,
	normalizeAgentkitJsonBody,
} from './protocol'

export type AgentkitHookEvent =
	| { type: 'agent_verified'; resource: string; address: string; humanId: string }
	| { type: 'agent_not_verified'; resource: string; address: string }
	| { type: 'validation_failed'; resource: string; error?: string }
	| { type: 'discount_applied'; resource: string; address: string; humanId: string }
	| { type: 'discount_exhausted'; resource: string; address: string; humanId: string }

export interface CreateAgentkitHooksOptions {
	mode?: AgentkitMode
	storage?: AgentKitStorage
	onEvent?: (event: AgentkitHookEvent) => void
}

export function createAgentkitHooks(options: CreateAgentkitHooksOptions) {
	return createAgentkitHooksInternal(options)
}

type VerifyFunction = (request: Request) => Promise<VerifiedAgentRequest>

export function createAgentkitHooksInternal(
	options: CreateAgentkitHooksOptions,
	dependencies: { verify?: VerifyFunction } = {}
) {
	const { onEvent } = options
	const verify = dependencies.verify ?? verifyRequest
	const mode: AgentkitMode = options.mode ?? { type: 'free' }
	const storage = options.storage

	if ((mode.type === 'free-trial' || mode.type === 'discount') && !storage) {
		throw new Error(`AgentKit mode "${mode.type}" requires a storage instance`)
	}

	if (mode.type === 'discount' && (!Number.isInteger(mode.percent) || mode.percent <= 0 || mode.percent > 100)) {
		throw new Error(`Discount percent must be an integer between 1 and 100, got ${mode.percent}`)
	}

	if (
		(mode.type === 'free-trial' || mode.type === 'discount') &&
		mode.uses !== undefined &&
		(!Number.isFinite(mode.uses) || mode.uses < 1)
	) {
		throw new Error(`Usage limit must be a finite number >= 1, got ${mode.uses}`)
	}

	// Shared state for discount mode: requestHook stores verified agent info
	// for verifyFailureHook to use (it doesn't have HTTP header access).
	const PENDING_TTL_MS = 5 * 60 * 1000
	const pendingDiscounts = new Map<string, { humanId: string; address: string; createdAt: number }>()

	const requestHook = async (context: {
		adapter: {
			getHeader(name: string): string | undefined
			getMethod(): string
			getUrl(): string
			getBody?(): unknown
		}
		path: string
	}): Promise<void | { grantAccess: true }> => {
		const signatureInput = context.adapter.getHeader(AGENTKIT_SIGNATURE_INPUT_HEADER)
		if (!signatureInput) return

		try {
			const parsedBody = await context.adapter.getBody?.()
			const contentType = context.adapter.getHeader('content-type')?.split(';', 1)[0]?.trim().toLowerCase()
			const body =
				contentType === 'application/json' || contentType?.endsWith('+json')
					? normalizeAgentkitJsonBody(parsedBody)
					: normalizeAgentkitBody(parsedBody)

			// Rebuild the request core verifies against from what actually arrived: the real
			// method and URL, the signature headers, and the re-normalized body bytes.
			const method = context.adapter.getMethod().toUpperCase()
			const headers = new Headers({ [AGENTKIT_SIGNATURE_INPUT_HEADER]: signatureInput })
			const signatureHeader = context.adapter.getHeader(AGENTKIT_SIGNATURE_HEADER)
			if (signatureHeader) headers.set(AGENTKIT_SIGNATURE_HEADER, signatureHeader)
			const contentDigest = context.adapter.getHeader(AGENTKIT_CONTENT_DIGEST_HEADER)
			if (contentDigest) headers.set(AGENTKIT_CONTENT_DIGEST_HEADER, contentDigest)

			const verificationRequest = new Request(context.adapter.getUrl(), {
				method,
				headers,
				// GET/HEAD requests cannot carry a body; core digests the empty byte string.
				...(method === 'GET' || method === 'HEAD' ? {} : { body }),
			})
			const { nullifierHash: humanId, address, nonce } = await verify(verificationRequest)

			if (storage?.hasUsedNonce && storage?.recordNonce) {
				if (await storage.hasUsedNonce(nonce)) {
					onEvent?.({ type: 'validation_failed', resource: context.path, error: 'Signature nonce already used' })
					return
				}
				await storage.recordNonce(nonce)
			}

			if (mode.type === 'free') {
				onEvent?.({ type: 'agent_verified', resource: context.path, address, humanId })
				return { grantAccess: true }
			}

			if (mode.type === 'free-trial') {
				const uses = mode.uses ?? 1
				if (await storage!.tryIncrementUsage(context.path, humanId, uses)) {
					onEvent?.({
						type: 'agent_verified',
						resource: context.path,
						address,
						humanId,
					})
					return { grantAccess: true }
				}
				// Exceeded free uses — fall through to normal payment flow
				return
			}

			if (mode.type === 'discount') {
				// Store for verifyFailureHook to pick up
				const now = Date.now()
				for (const [key, entry] of pendingDiscounts) {
					if (now - entry.createdAt > PENDING_TTL_MS) pendingDiscounts.delete(key)
				}
				pendingDiscounts.set(`${context.path}:${address}`, {
					humanId,
					address,
					createdAt: now,
				})
				// Don't grant access — agent is expected to pay (at a discount)
				return
			}
		} catch (err) {
			const failure = err as { code?: unknown; address?: unknown }
			if (failure?.code === 'AGENT_NOT_REGISTERED' && typeof failure.address === 'string') {
				onEvent?.({ type: 'agent_not_verified', resource: context.path, address: failure.address })
				return
			}
			onEvent?.({
				type: 'validation_failed',
				resource: context.path,
				error: err instanceof Error ? err.message : 'Unknown error',
			})
		}
	}

	const verifyFailureHook =
		mode.type === 'discount'
			? async (context: {
					paymentPayload: { resource: { url: string }; payload: Record<string, unknown> }
					requirements: { amount: string }
					error: Error
				}): Promise<void | { recovered: true; result: { isValid: boolean; payer?: string } }> => {
					const resourcePath = new URL(context.paymentPayload.resource.url).pathname
					const payer = extractPayer(context.paymentPayload.payload)
					const discountKey = payer ? `${resourcePath}:${payer}` : null
					const pending = discountKey ? pendingDiscounts.get(discountKey) : undefined
					if (discountKey) pendingDiscounts.delete(discountKey)

					if (!pending) return
					if (!isUnderpaymentError(context.error)) return

					const { humanId, address } = pending

					const requiredAmount = BigInt(context.requirements.amount)
					const discountedAmount = (requiredAmount * BigInt(100 - mode.percent)) / 100n

					const paidAmount = extractPaidAmount(context.paymentPayload.payload)
					if (paidAmount === null || paidAmount < discountedAmount) return
					// If paid amount covers the full price, failure isn't about underpayment
					if (paidAmount >= requiredAmount) return

					const uses = mode.uses ?? Infinity
					if (!(await storage!.tryIncrementUsage(resourcePath, humanId, uses))) {
						onEvent?.({ type: 'discount_exhausted', resource: resourcePath, address, humanId })
						return
					}
					onEvent?.({ type: 'discount_applied', resource: resourcePath, address, humanId })

					// Adjust requirements so settlement verifies against the discounted amount
					context.requirements.amount = String(paidAmount)

					return {
						recovered: true,
						result: { isValid: true, payer: address },
					}
				}
			: undefined

	return { requestHook, verifyFailureHook }
}

function extractPayer(payload: Record<string, unknown>): string | null {
	try {
		if ('authorization' in payload) {
			return (payload.authorization as Record<string, unknown>).from as string
		}
		if ('permit2Authorization' in payload) {
			return (payload.permit2Authorization as Record<string, unknown>).from as string
		}
		return null
	} catch {
		return null
	}
}

const UNDERPAYMENT_REASONS = [
	'invalid_exact_evm_payload_authorization_value',
	'permit2_insufficient_amount',
	'insufficient_funds',
]

function isUnderpaymentError(error: Error): boolean {
	const reason = error.message.split(':')[0]
	return UNDERPAYMENT_REASONS.includes(reason)
}

function extractPaidAmount(payload: Record<string, unknown>): bigint | null {
	try {
		// EIP-3009 format
		if ('authorization' in payload) {
			const auth = payload.authorization as Record<string, unknown>
			return BigInt(auth.value as string)
		}
		// Permit2 format
		if ('permit2Authorization' in payload) {
			const auth = payload.permit2Authorization as Record<string, unknown>
			const permitted = auth.permitted as Record<string, unknown>
			return BigInt(permitted.amount as string)
		}
		return null
	} catch {
		return null
	}
}
