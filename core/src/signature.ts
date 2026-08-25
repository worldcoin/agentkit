import { bytesToHex, hexToBytes, sha256, type Hex } from 'viem'

/**
 * AgentKit profile of RFC 9421 (HTTP Message Signatures) + RFC 9530 (Content-Digest).
 *
 * The profile is closed: exactly one signature labeled `agentkit`, covering exactly
 * `("@method" "@authority" "@path" "@query" "content-digest")`, with the parameters
 * `created`, `expires`, `nonce`, `keyid` (lowercase agent address) and `tag="agentkit"`
 * in that order. The signature is a 65-byte EIP-191 `personal_sign` over the UTF-8
 * signature base, transported as standard padded base64. Anything outside this exact
 * shape is rejected.
 *
 * Example signature base for `POST https://api.example.com/data?x=1` with body `{"a":1}`:
 *
 *   "@method": POST
 *   "@authority": api.example.com
 *   "@path": /data
 *   "@query": ?x=1
 *   "content-digest": sha-256=:AVq9f1zFei3ZS3WQ8ErYCEJzkF7jPsXOvq5iJ2qX+GI=:
 *   "@signature-params": ("@method" "@authority" "@path" "@query" "content-digest");created=1755600000;expires=1755600300;nonce="mAyU1DSTCXHDXqzm5g1D3A==";keyid="0x0123456789abcdef0123456789abcdef01234567";tag="agentkit"
 */

export const SIGNATURE_INPUT_HEADER = 'Signature-Input'
export const SIGNATURE_HEADER = 'Signature'
export const CONTENT_DIGEST_HEADER = 'Content-Digest'
export const SIGNATURE_LABEL = 'agentkit'
export const MAX_SIGNATURE_AGE_SECONDS = 300
// Tolerates created timestamps up to 30s in the future from out-of-sync client clocks.
export const CLOCK_SKEW_SECONDS = 30

const MAX_HEADER_LENGTH = 4096
const COVERED_COMPONENTS = '("@method" "@authority" "@path" "@query" "content-digest")'
const KEYID_PATTERN = /^0x[0-9a-f]{40}$/
// Closed profile: HTTP methods are letters only. This also keeps caller-supplied
// method strings from injecting lines into the signature base.
const METHOD_PATTERN = /^[A-Za-z]+$/
// Printable ASCII excluding `"` and `\`, so the value never needs sf-string escaping.
const NONCE_PATTERN = /^[\x20-\x21\x23-\x5B\x5D-\x7E]{16,256}$/
const TIMESTAMP = '(0|[1-9][0-9]{0,14})'
const SIGNATURE_PARAMS_PATTERN = new RegExp(
	`^\\("@method" "@authority" "@path" "@query" "content-digest"\\);created=${TIMESTAMP};expires=${TIMESTAMP};nonce="([\\x20-\\x21\\x23-\\x5B\\x5D-\\x7E]{16,256})";keyid="(0x[0-9a-f]{40})";tag="agentkit"$`
)
// 65 signature bytes and 32 digest bytes always encode to these exact padded lengths.
const SIGNATURE_VALUE_PATTERN = /^agentkit=:([A-Za-z0-9+/]{87}=):$/
const CONTENT_DIGEST_PATTERN = /^sha-256=:([A-Za-z0-9+/]{43}=):$/

export interface SignatureParams {
	created: number
	expires: number
	nonce: string
	keyid: string
}

export interface ParsedSignatureInput extends SignatureParams {
	/** The verbatim member value after `agentkit=`, reused byte-for-byte in the signature base. */
	rawParams: string
}

export interface AgentkitSignatureHeaders {
	'Content-Digest': string
	'Signature-Input': string
	Signature: string
}

export interface CreateSignatureHeadersInput {
	method: string
	url: string | URL
	/** Exact request body. Defaults to the empty body. */
	body?: string | Uint8Array
	/** The agent's address; becomes the lowercase `keyid`. */
	address: string
	/** EIP-191 signer over the UTF-8 signature base. */
	signMessage: (message: string) => Promise<string>
	/** Unix seconds; defaults to the current time. */
	now?: number
	expiresInSeconds?: number
	/** Single-use random value; defaults to 16 fresh random bytes. */
	nonce?: string
}

export function deriveComponents(method: string, url: string | URL) {
	if (!METHOD_PATTERN.test(method)) throw new Error('Invalid HTTP method')

	const parsed = typeof url === 'string' ? new URL(url) : url
	return {
		method: method.toUpperCase(),
		authority: parsed.host,
		path: parsed.pathname,
		// RFC 9421 §2.2.7: an absent query serializes as a lone `?`.
		query: parsed.search === '' ? '?' : parsed.search,
	}
}

export function computeContentDigest(bodyBytes: Uint8Array): string {
	return `sha-256=:${encodeBase64(sha256(bodyBytes, 'bytes'))}:`
}

export function serializeSignatureParams({ created, expires, nonce, keyid }: SignatureParams): string {
	if (!Number.isInteger(created) || created < 0 || !Number.isInteger(expires) || expires <= created) {
		throw new Error('Signature params require integer timestamps with expires after created')
	}
	if (!NONCE_PATTERN.test(nonce)) throw new Error('Signature nonce must be 16-256 printable ASCII characters')
	if (!KEYID_PATTERN.test(keyid)) throw new Error('Signature keyid must be a lowercase 0x address')

	return `${COVERED_COMPONENTS};created=${created};expires=${expires};nonce="${nonce}";keyid="${keyid}";tag="${SIGNATURE_LABEL}"`
}

export function buildSignatureBase(input: {
	method: string
	url: string | URL
	contentDigest: string
	signatureParams: string
}): string {
	const components = deriveComponents(input.method, input.url)
	return [
		`"@method": ${components.method}`,
		`"@authority": ${components.authority}`,
		`"@path": ${components.path}`,
		`"@query": ${components.query}`,
		`"content-digest": ${input.contentDigest}`,
		`"@signature-params": ${input.signatureParams}`,
	].join('\n')
}

export function parseSignatureInput(raw: string): ParsedSignatureInput {
	if (raw.length > MAX_HEADER_LENGTH) throw new Error('Signature-Input header is too long')

	const prefix = `${SIGNATURE_LABEL}=`
	if (!raw.startsWith(prefix)) throw new Error('Signature-Input must contain exactly the agentkit signature')

	const rawParams = raw.slice(prefix.length)
	const match = SIGNATURE_PARAMS_PATTERN.exec(rawParams)
	if (!match) throw new Error('Signature-Input does not match the AgentKit signature profile')

	const created = Number(match[1])
	const expires = Number(match[2])
	if (expires <= created) throw new Error('Signature expires must be after created')

	return { rawParams, created, expires, nonce: match[3]!, keyid: match[4]! }
}

export function parseSignatureHeader(raw: string): Hex {
	if (raw.length > MAX_HEADER_LENGTH) throw new Error('Signature header is too long')

	const match = SIGNATURE_VALUE_PATTERN.exec(raw)
	if (!match) throw new Error('Signature must be a single agentkit member holding a 65-byte value')

	const bytes = decodeBase64Strict(match[1]!)
	if (bytes.length !== 65) throw new Error('Signature must decode to 65 bytes')

	return bytesToHex(bytes)
}

export function parseContentDigest(raw: string): Uint8Array {
	if (raw.length > MAX_HEADER_LENGTH) throw new Error('Content-Digest header is too long')

	const match = CONTENT_DIGEST_PATTERN.exec(raw)
	if (!match) throw new Error('Content-Digest must be a single sha-256 member')

	const bytes = decodeBase64Strict(match[1]!)
	if (bytes.length !== 32) throw new Error('Content-Digest must decode to 32 bytes')

	return bytes
}

export async function createSignatureHeaders(input: CreateSignatureHeadersInput): Promise<AgentkitSignatureHeaders> {
	const bodyBytes = typeof input.body === 'string' || input.body === undefined
		? new TextEncoder().encode(input.body ?? '')
		: input.body
	const contentDigest = computeContentDigest(bodyBytes)
	const created = input.now ?? Math.floor(Date.now() / 1000)
	const expires = created + (input.expiresInSeconds ?? MAX_SIGNATURE_AGE_SECONDS)
	const nonce = input.nonce ?? generateNonce()
	const keyid = input.address.toLowerCase()

	const signatureParams = serializeSignatureParams({ created, expires, nonce, keyid })
	const base = buildSignatureBase({ method: input.method, url: input.url, contentDigest, signatureParams })

	const signature = await input.signMessage(base)
	if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) throw new Error('Signer must return a 65-byte hex signature')

	return {
		'Content-Digest': contentDigest,
		'Signature-Input': `${SIGNATURE_LABEL}=${signatureParams}`,
		Signature: `${SIGNATURE_LABEL}=:${encodeBase64(hexToBytes(signature as Hex))}:`,
	}
}

function generateNonce(): string {
	const bytes = new Uint8Array(16)
	crypto.getRandomValues(bytes)
	return encodeBase64(bytes)
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const BASE64_INDEX = new Map([...BASE64_ALPHABET].map((char, index) => [char, index]))

function encodeBase64(bytes: Uint8Array): string {
	let output = ''
	for (let i = 0; i < bytes.length; i += 3) {
		const a = bytes[i]!
		const b = bytes[i + 1]
		const c = bytes[i + 2]
		output += BASE64_ALPHABET[a >> 2]!
		output += BASE64_ALPHABET[((a & 0x03) << 4) | ((b ?? 0) >> 4)]!
		output += b === undefined ? '=' : BASE64_ALPHABET[((b & 0x0f) << 2) | ((c ?? 0) >> 6)]!
		output += c === undefined ? '=' : BASE64_ALPHABET[c & 0x3f]!
	}
	return output
}

function decodeBase64Strict(value: string): Uint8Array {
	if (value.length === 0 || value.length % 4 !== 0) throw new Error('Invalid base64 length')

	const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0
	const chars = value.slice(0, value.length - padding)
	if (chars.includes('=')) throw new Error('Invalid base64 padding')

	const bytes: number[] = []
	let buffer = 0
	let bits = 0
	for (const char of chars) {
		const index = BASE64_INDEX.get(char)
		if (index === undefined) throw new Error('Invalid base64 character')
		buffer = (buffer << 6) | index
		bits += 6
		if (bits >= 8) {
			bits -= 8
			bytes.push((buffer >> bits) & 0xff)
		}
	}

	const result = new Uint8Array(bytes)
	// Round-trip guarantees canonical encoding (padding count and zeroed trailing bits).
	if (encodeBase64(result) !== value) throw new Error('Non-canonical base64 encoding')
	return result
}
