import { AGENTKIT } from './types'
import { parseAgentkitHeader } from './parse'
import type { AgentKitStorage } from './storage'
import { verifyAgentkitSignature } from './verify'
import { validateAgentkitMessage } from './validate'
import type { AgentBookVerifier } from './agent-book'
import type { AgentkitMode, AgentkitVerifyOptions } from './types'

export type AgentkitHookEvent =
	| { type: 'agent_verified'; resource: string; address: string; humanId: string }
	| { type: 'agent_not_verified'; resource: string; address: string }
	| { type: 'validation_failed'; resource: string; error?: string }
	| { type: 'discount_applied'; resource: string; address: string; humanId: string }
	| { type: 'discount_exhausted'; resource: string; address: string; humanId: string }

export interface CreateAgentkitHooksOptions {
	agentBook: AgentBookVerifier
	mode?: AgentkitMode
	storage?: AgentKitStorage
	verifyOptions?: AgentkitVerifyOptions
	onEvent?: (event: AgentkitHookEvent) => void
}

export function createAgentkitHooks(options: CreateAgentkitHooksOptions) {
	const { agentBook, verifyOptions, onEvent } = options
	const mode: AgentkitMode = options.mode ?? { type: 'free' }
	const storage = options.storage

	if ((mode.type === 'free-trial' || mode.type === 'discount') && !storage) {
		throw new Error(`AgentKit mode "${mode.type}" requires a storage instance`)
	}

	if (mode.type === 'discount' && (!Number.isInteger(mode.percent) || mode.percent <= 0 || mode.percent > 100)) {
		throw new Error(`Discount percent must be an integer between 1 and 100, got ${mode.percent}`)
	}

	// Shared state for discount mode: requestHook stores verified agent info
	// for verifyFailureHook to use (it doesn't have HTTP header access).
	const PENDING_TTL_MS = 5 * 60 * 1000
	const pendingDiscounts = new Map<string, { humanId: string; address: string; createdAt: number }>()

	const requestHook = async (context: {
		adapter: { getHeader(name: string): string | undefined; getUrl(): string }
		path: string
	}): Promise<void | { grantAccess: true }> => {
		const header = context.adapter.getHeader(AGENTKIT) || context.adapter.getHeader(AGENTKIT.toLowerCase())
		if (!header) return

		try {
			const payload = parseAgentkitHeader(header)
			const resourceUri = context.adapter.getUrl()

			const checkNonce = storage?.hasUsedNonce
				? async (nonce: string) => !(await storage.hasUsedNonce!(nonce))
				: undefined

			const validation = await validateAgentkitMessage(payload, resourceUri, { checkNonce })
			if (!validation.valid) {
				onEvent?.({ type: 'validation_failed', resource: context.path, error: validation.error })
				return
			}

			const verification = await verifyAgentkitSignature(payload, verifyOptions)
			if (!verification.valid || !verification.address) {
				onEvent?.({ type: 'validation_failed', resource: context.path, error: verification.error })
				return
			}

			if (storage?.recordNonce) {
				await storage.recordNonce(payload.nonce)
			}

			const humanId = await agentBook.lookupHuman(verification.address, payload.chainId)
			if (!humanId) {
				onEvent?.({ type: 'agent_not_verified', resource: context.path, address: verification.address })
				return
			}

			if (mode.type === 'free') {
				onEvent?.({ type: 'agent_verified', resource: context.path, address: verification.address, humanId })
				return { grantAccess: true }
			}

			if (mode.type === 'free-trial') {
				const uses = mode.uses ?? 1
				const count = await storage!.getUsageCount(context.path, humanId)
				if (count < uses) {
					await storage!.incrementUsage(context.path, humanId)
					onEvent?.({
						type: 'agent_verified',
						resource: context.path,
						address: verification.address,
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
				pendingDiscounts.set(`${context.path}:${verification.address}`, { humanId, address: verification.address, createdAt: now })
				// Don't grant access — agent is expected to pay (at a discount)
				return
			}
		} catch (err) {
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
					const uses = mode.uses ?? Infinity
					const count = await storage!.getUsageCount(resourcePath, humanId)

					if (count >= uses) {
						onEvent?.({ type: 'discount_exhausted', resource: resourcePath, address, humanId })
						return
					}

					const requiredAmount = BigInt(context.requirements.amount)
					const discountedAmount = (requiredAmount * BigInt(100 - mode.percent)) / 100n

					const paidAmount = extractPaidAmount(context.paymentPayload.payload)
					if (paidAmount === null || paidAmount < discountedAmount) return
					// If paid amount covers the full price, failure isn't about underpayment
					if (paidAmount >= requiredAmount) return

					await storage!.incrementUsage(resourcePath, humanId)
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
