import { getAddress, isAddressEqual, recoverMessageAddress, type Hex } from 'viem'
import { lookupId } from './agent-book'
import {
	CLOCK_SKEW_SECONDS,
	CONTENT_DIGEST_HEADER,
	MAX_SIGNATURE_AGE_SECONDS,
	SIGNATURE_HEADER,
	SIGNATURE_INPUT_HEADER,
	buildSignatureBase,
	computeContentDigest,
	parseContentDigest,
	parseSignatureHeader,
	parseSignatureInput,
} from './signature'

const LOOKUP_ID_CACHE_TTL_MS = 60_000
const lookupIdCache = new Map<string, { lookupId: string; expiresAt: number }>()

export type VerifiedAgentRequest = {
	lookupId: string
	address: string
	created: number
	expires: number
}

type VerifyRequestDependencies = {
	recoverAddress?: (signatureBase: string, signature: Hex) => Promise<string>
	lookupId?: (address: string) => Promise<string | null>
	/** Unix seconds; injectable for tests. */
	now?: () => number
}

export async function verify(request: Request): Promise<string> {
	const verified = await verifyRequest(request)
	return verified.lookupId
}

export async function verifyRequest(
	request: Request,
	dependencies: VerifyRequestDependencies = {}
): Promise<VerifiedAgentRequest> {
	const rawSignatureInput = requireHeader(request, SIGNATURE_INPUT_HEADER)
	const rawSignature = requireHeader(request, SIGNATURE_HEADER)
	const rawContentDigest = requireHeader(request, CONTENT_DIGEST_HEADER)

	const params = parseWith(parseSignatureInput, rawSignatureInput, 'INVALID_SIGNATURE_INPUT')
	const signature = parseWith(parseSignatureHeader, rawSignature, 'INVALID_SIGNATURE')
	parseWith(parseContentDigest, rawContentDigest, 'INVALID_CONTENT_DIGEST')

	const now = dependencies.now?.() ?? Math.floor(Date.now() / 1000)
	if (params.created > now + CLOCK_SKEW_SECONDS) {
		throw verificationError('Signature created timestamp is in the future', 'SIGNATURE_NOT_YET_VALID')
	}
	if (now >= params.expires || now - params.created > MAX_SIGNATURE_AGE_SECONDS) {
		throw verificationError('Signature has expired', 'SIGNATURE_EXPIRED')
	}

	let body: Uint8Array
	try {
		body = new Uint8Array(await request.clone().arrayBuffer())
	} catch {
		throw verificationError('Unable to read request body', 'INVALID_REQUEST_BODY')
	}

	if (computeContentDigest(body) !== rawContentDigest) {
		throw verificationError('Content-Digest does not match the request body', 'CONTENT_DIGEST_MISMATCH')
	}

	// Every covered component is rebuilt from the request that actually arrived; only the
	// validated signature params line is reused verbatim from the Signature-Input header.
	const signatureBase = buildSignatureBase({
		method: request.method,
		url: request.url,
		contentDigest: rawContentDigest,
		signatureParams: params.rawParams,
	})

	const recoverAddress =
		dependencies.recoverAddress ??
		((message: string, value: Hex) => recoverMessageAddress({ message, signature: value }))

	let recovered: string
	try {
		recovered = await recoverAddress(signatureBase, signature)
	} catch {
		throw verificationError('Invalid request signature', 'INVALID_SIGNATURE')
	}

	if (!isAddressEqual(recovered as `0x${string}`, params.keyid as `0x${string}`)) {
		throw verificationError('Signature does not match the keyid address', 'KEYID_MISMATCH')
	}

	// The wire format carries a lowercase keyid; surface the EIP-55 checksummed form.
	const address = getAddress(params.keyid)

	const lookup = dependencies.lookupId ?? (signer => lookupId(signer))
	const cacheKey = address.toLowerCase()
	const cached = lookupIdCache.get(cacheKey)
	let id: string
	if (cached && cached.expiresAt > Date.now()) {
		id = cached.lookupId
	} else {
		const resolved = await lookup(address)
		if (!resolved) {
			throw verificationError('Agent is not registered in AgentBook', 'AGENT_NOT_REGISTERED', address)
		}
		lookupIdCache.set(cacheKey, { lookupId: resolved, expiresAt: Date.now() + LOOKUP_ID_CACHE_TTL_MS })
		id = resolved
	}

	return {
		lookupId: id,
		address,
		created: params.created,
		expires: params.expires,
	}
}

function requireHeader(request: Request, name: string): string {
	const value = request.headers.get(name)
	if (!value) throw verificationError(`Missing ${name} header`, 'MISSING_HEADER')
	return value
}

function parseWith<T>(parse: (raw: string) => T, raw: string, code: string): T {
	try {
		return parse(raw)
	} catch (error) {
		throw verificationError(error instanceof Error ? error.message : 'Invalid signature header', code)
	}
}

export function verificationError(message: string, code: string, address?: string): Error {
	return Object.assign(new Error(message), { code, ...(address ? { address } : {}) })
}
