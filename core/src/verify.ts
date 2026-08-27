import { isHex, recoverMessageAddress, type Hex } from 'viem'
import { lookupId } from './agent-book'

const AGENTKIT_HEADER = 'AgentKit'
const LOOKUP_ID_CACHE_TTL_MS = 60_000
const lookupIdCache = new Map<string, { lookupId: string; expiresAt: number }>()

type VerifyRequestDependencies = {
	recoverAddress?: (body: Uint8Array, signature: Hex) => Promise<string>
	lookupId?: (address: string) => Promise<string | null>
}

export async function verify(request: Request): Promise<string> {
	return verifyRequest(request)
}

export async function verifyRequest(request: Request, dependencies: VerifyRequestDependencies = {}): Promise<string> {
	const signature = request.headers.get(AGENTKIT_HEADER)?.trim()
	if (!signature) {
		throw verificationError(`Missing ${AGENTKIT_HEADER} header`, 'MISSING_HEADER')
	}
	if (!isHex(signature)) {
		throw verificationError(`Invalid ${AGENTKIT_HEADER} signature`, 'INVALID_SIGNATURE')
	}

	let body: Uint8Array
	try {
		body = new Uint8Array(await request.clone().arrayBuffer())
	} catch {
		throw verificationError('Unable to read request body', 'INVALID_REQUEST_BODY')
	}

	const recoverAddress =
		dependencies.recoverAddress ??
		((message: Uint8Array, value: Hex) => recoverMessageAddress({ message: { raw: message }, signature: value }))

	let address: string
	try {
		address = await recoverAddress(body, signature)
	} catch {
		throw verificationError(`Invalid ${AGENTKIT_HEADER} signature`, 'INVALID_SIGNATURE')
	}

	const lookup = dependencies.lookupId ?? (signer => lookupId(signer))
	const cacheKey = address.toLowerCase()
	const cached = lookupIdCache.get(cacheKey)
	if (cached && cached.expiresAt > Date.now()) return cached.lookupId

	const id = await lookup(address)
	if (!id) {
		throw verificationError('Agent is not registered in AgentBook', 'AGENT_NOT_REGISTERED', address)
	}

	lookupIdCache.set(cacheKey, { lookupId: id, expiresAt: Date.now() + LOOKUP_ID_CACHE_TTL_MS })
	return id
}

export function verificationError(message: string, code: string, address?: string): Error {
	return Object.assign(new Error(message), { code, ...(address ? { address } : {}) })
}
