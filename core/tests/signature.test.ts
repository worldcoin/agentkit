import { describe, expect, it } from 'bun:test'
import { recoverMessageAddress } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import {
	buildSignatureBase,
	computeContentDigest,
	createSignatureHeaders,
	deriveComponents,
	parseContentDigest,
	parseSignatureHeader,
	parseSignatureInput,
	serializeSignatureParams,
} from '../src/signature'

const encoder = new TextEncoder()

const EXAMPLE_PARAMS = {
	created: 1755600000,
	expires: 1755600300,
	nonce: 'mAyU1DSTCXHDXqzm5g1D3A==',
	keyid: '0x0123456789abcdef0123456789abcdef01234567',
}

const EXAMPLE_RAW_PARAMS =
	'("@method" "@authority" "@path" "@query" "content-digest");created=1755600000;expires=1755600300;nonce="mAyU1DSTCXHDXqzm5g1D3A==";keyid="0x0123456789abcdef0123456789abcdef01234567";tag="agentkit"'

describe('deriveComponents', () => {
	it('normalizes method, authority, path, and query identically on both sides', () => {
		expect(deriveComponents('post', 'https://API.Example.com:443/data?x=1')).toEqual({
			method: 'POST',
			authority: 'api.example.com',
			path: '/data',
			query: '?x=1',
		})
	})

	it('keeps non-default ports in the authority', () => {
		expect(deriveComponents('GET', 'https://api.example.com:8443/data').authority).toBe('api.example.com:8443')
	})

	it('serializes an absent query as a lone question mark', () => {
		expect(deriveComponents('GET', 'https://api.example.com/data').query).toBe('?')
		expect(deriveComponents('GET', 'https://api.example.com/data?').query).toBe('?')
	})

	it('uses the root path for a bare origin', () => {
		expect(deriveComponents('GET', 'https://api.example.com').path).toBe('/')
	})

	it('rejects methods that could inject lines into the signature base', () => {
		expect(() => deriveComponents('POST\n"@authority": evil.com', 'https://api.example.com')).toThrow(
			'Invalid HTTP method'
		)
		expect(() => deriveComponents('GE T', 'https://api.example.com')).toThrow('Invalid HTTP method')
		expect(() => deriveComponents('', 'https://api.example.com')).toThrow('Invalid HTTP method')
	})
})

describe('computeContentDigest', () => {
	it('matches the RFC 9530 sha-256 example', () => {
		expect(computeContentDigest(encoder.encode('{"hello": "world"}'))).toBe(
			'sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:'
		)
	})

	it('digests the empty body', () => {
		expect(computeContentDigest(new Uint8Array())).toBe('sha-256=:47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=:')
	})
})

describe('buildSignatureBase', () => {
	it('produces the exact profile signature base', () => {
		const base = buildSignatureBase({
			method: 'POST',
			url: 'https://api.example.com/data?x=1',
			contentDigest: computeContentDigest(encoder.encode('{"a":1}')),
			signatureParams: serializeSignatureParams(EXAMPLE_PARAMS),
		})

		expect(base).toBe(
			[
				'"@method": POST',
				'"@authority": api.example.com',
				'"@path": /data',
				'"@query": ?x=1',
				'"content-digest": sha-256=:AVq9f1zFei3ZS3WQ8ErYCEJzkF7jPsXOvq5iJ2qX+GI=:',
				`"@signature-params": ${EXAMPLE_RAW_PARAMS}`,
			].join('\n')
		)
	})
})

describe('serializeSignatureParams', () => {
	it('rejects invalid inputs before they can be signed', () => {
		expect(() => serializeSignatureParams({ ...EXAMPLE_PARAMS, expires: EXAMPLE_PARAMS.created })).toThrow()
		expect(() => serializeSignatureParams({ ...EXAMPLE_PARAMS, created: 1.5 })).toThrow()
		expect(() => serializeSignatureParams({ ...EXAMPLE_PARAMS, nonce: 'short' })).toThrow()
		expect(() => serializeSignatureParams({ ...EXAMPLE_PARAMS, nonce: 'contains"quote-0123456789' })).toThrow()
		expect(() => serializeSignatureParams({ ...EXAMPLE_PARAMS, nonce: 'contains\\slash-0123456789' })).toThrow()
		expect(() =>
			serializeSignatureParams({ ...EXAMPLE_PARAMS, keyid: '0x0123456789ABCDEF0123456789abcdef01234567' })
		).toThrow()
	})
})

describe('createSignatureHeaders', () => {
	it('creates deterministic headers whose signature recovers the account', async () => {
		const account = privateKeyToAccount(`0x${'01'.padStart(64, '0')}`)
		const headers = await createSignatureHeaders({
			method: 'post',
			url: 'https://api.example.com/data?x=1',
			body: '{"a":1}',
			address: account.address,
			signMessage: message => account.signMessage({ message }),
			now: EXAMPLE_PARAMS.created,
			nonce: EXAMPLE_PARAMS.nonce,
		})

		expect(headers['Content-Digest']).toBe('sha-256=:AVq9f1zFei3ZS3WQ8ErYCEJzkF7jPsXOvq5iJ2qX+GI=:')
		expect(headers['Signature-Input']).toBe(
			`agentkit=("@method" "@authority" "@path" "@query" "content-digest");created=1755600000;expires=1755600300;nonce="mAyU1DSTCXHDXqzm5g1D3A==";keyid="${account.address.toLowerCase()}";tag="agentkit"`
		)

		const signature = parseSignatureHeader(headers.Signature)
		const parsed = parseSignatureInput(headers['Signature-Input'])
		const base = buildSignatureBase({
			method: 'POST',
			url: 'https://api.example.com/data?x=1',
			contentDigest: headers['Content-Digest'],
			signatureParams: parsed.rawParams,
		})

		expect(await recoverMessageAddress({ message: base, signature })).toBe(account.address)
	})

	it('uses the current five-minute window and a fresh nonce by default', async () => {
		const account = privateKeyToAccount(`0x${'02'.padStart(64, '0')}`)
		const before = Math.floor(Date.now() / 1000)
		const first = await createSignatureHeaders({
			method: 'GET',
			url: 'https://api.example.com/data',
			address: account.address,
			signMessage: message => account.signMessage({ message }),
		})
		const second = await createSignatureHeaders({
			method: 'GET',
			url: 'https://api.example.com/data',
			address: account.address,
			signMessage: message => account.signMessage({ message }),
		})

		const parsed = parseSignatureInput(first['Signature-Input'])
		expect(parsed.created).toBeGreaterThanOrEqual(before)
		expect(parsed.expires).toBe(parsed.created + 300)
		expect(parsed.nonce.length).toBeGreaterThanOrEqual(16)
		expect(parseSignatureInput(second['Signature-Input']).nonce).not.toBe(parsed.nonce)
	})
})

describe('parseSignatureInput', () => {
	const valid = `agentkit=${EXAMPLE_RAW_PARAMS}`

	it('accepts the canonical profile value and returns the verbatim params', () => {
		expect(parseSignatureInput(valid)).toEqual({ rawParams: EXAMPLE_RAW_PARAMS, ...EXAMPLE_PARAMS })
	})

	it.each([
		['wrong label', valid.replace('agentkit=', 'evil=')],
		['duplicate members', `${valid}, evil=("@method");created=1;expires=2;keyid="0x0123456789abcdef0123456789abcdef01234567";tag="agentkit"`],
		['missing created', valid.replace(';created=1755600000', '')],
		['missing expires', valid.replace(';expires=1755600300', '')],
		['missing nonce', valid.replace(';nonce="mAyU1DSTCXHDXqzm5g1D3A=="', '')],
		['short nonce', valid.replace('mAyU1DSTCXHDXqzm5g1D3A==', 'short')],
		['nonce with backslash', valid.replace('mAyU1DSTCXHDXqzm5g1D3A==', 'mAyU1DSTCXHDXqzm5g1D3\\=')],
		['missing keyid', valid.replace(';keyid="0x0123456789abcdef0123456789abcdef01234567"', '')],
		['missing tag', valid.replace(';tag="agentkit"', '')],
		['extra alg param', valid.replace(';tag="agentkit"', ';tag="agentkit";alg="ed25519"')],
		['reordered params', valid.replace(';created=1755600000;expires=1755600300', ';expires=1755600300;created=1755600000')],
		['shortened components', valid.replace(' "@query"', '')],
		['extended components', valid.replace('"content-digest")', '"content-digest" "date")')],
		['reordered components', valid.replace('"@method" "@authority"', '"@authority" "@method"')],
		['negative created', valid.replace('created=1755600000', 'created=-1')],
		['non-integer created', valid.replace('created=1755600000', 'created=1755600000.5')],
		['oversized timestamp', valid.replace('created=1755600000', `created=${'9'.repeat(16)}`)],
		['expires before created', valid.replace('expires=1755600300', 'expires=1755599999')],
		['uppercase keyid', valid.replace('0x0123456789abcdef', '0x0123456789ABCDEF')],
		['wrong tag', valid.replace('tag="agentkit"', 'tag="other"')],
		['trailing garbage', `${valid};x=1`],
		['oversized header', `agentkit=${'a'.repeat(5000)}`],
	])('rejects %s', (_name, value) => {
		expect(() => parseSignatureInput(value)).toThrow()
	})
})

describe('parseSignatureHeader', () => {
	it('round-trips a canonical 65-byte signature', async () => {
		const account = privateKeyToAccount(`0x${'03'.padStart(64, '0')}`)
		const headers = await createSignatureHeaders({
			method: 'GET',
			url: 'https://api.example.com/',
			address: account.address,
			signMessage: message => account.signMessage({ message }),
		})

		expect(parseSignatureHeader(headers.Signature)).toMatch(/^0x[0-9a-f]{130}$/)
	})

	it.each([
		['wrong label', `evil=:${'A'.repeat(87)}=:`],
		['base64url characters', `agentkit=:${'-'.repeat(87)}=:`],
		['wrong length', `agentkit=:${'A'.repeat(43)}=:`],
		['missing padding', `agentkit=:${'A'.repeat(88)}:`],
		['bare hex', `agentkit=0x${'12'.repeat(65)}`],
	])('rejects %s', (_name, value) => {
		expect(() => parseSignatureHeader(value)).toThrow()
	})
})

describe('parseContentDigest', () => {
	it('parses the canonical sha-256 member', () => {
		const digest = parseContentDigest('sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPE=:')
		expect(digest).toHaveLength(32)
	})

	it.each([
		['different algorithm', `sha-512=:${'A'.repeat(86)}==:`],
		['multiple members', `sha-256=:${'A'.repeat(43)}=:, sha-512=:${'A'.repeat(86)}==:`],
		['non-canonical encoding', 'sha-256=:X48E9qOokqqrvdts8nOJRJN3OWDUoyWxBf7kbu9DBPF=:'],
		['wrong length', `sha-256=:${'A'.repeat(22)}==:`],
	])('rejects %s', (_name, value) => {
		expect(() => parseContentDigest(value)).toThrow()
	})
})
