import { describe, expect, it } from 'bun:test'
import { verifySolanaSignature } from '../src/solana'

function fromHex(hex: string): Uint8Array {
	const out = new Uint8Array(hex.length / 2)
	for (let i = 0; i < out.length; i++) {
		out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
	}
	return out
}

// Fixture generated with tweetnacl@1.0.3 from a deterministic seed.
// Guards against regressions if the underlying ed25519 implementation changes.
const FIXTURE = {
	message:
		'example.com wants you to sign in with your Solana account:\nABC\n\nURI: https://example.com\nVersion: 1\nChain ID: mainnet\nNonce: abcd1234\nIssued At: 2026-05-13T00:00:00.000Z',
	publicKey: fromHex('6b80f36fa38d2942de85ff15bff2c62704c9fc9a4c1174a2dd5b8e1cd91f4326'),
	signature: fromHex(
		'3cbd22d2a13d291ce5a52c379f9fc2f6de624fccdaf6de7e3b0d4a7168b06c111f6c6d82e81590c13503c374c966c448c8ef374613c822ba983f61d9dc463a01'
	),
}

describe('verifySolanaSignature', () => {
	it('accepts a valid signature produced by tweetnacl', () => {
		expect(verifySolanaSignature(FIXTURE.message, FIXTURE.signature, FIXTURE.publicKey)).toBe(true)
	})

	it('rejects a tampered signature', () => {
		const tampered = new Uint8Array(FIXTURE.signature)
		tampered[0] ^= 0x01
		expect(verifySolanaSignature(FIXTURE.message, tampered, FIXTURE.publicKey)).toBe(false)
	})

	it('rejects a tampered message', () => {
		expect(verifySolanaSignature(FIXTURE.message + ' ', FIXTURE.signature, FIXTURE.publicKey)).toBe(false)
	})

	it('rejects a signature checked against the wrong public key', () => {
		const wrongKey = new Uint8Array(FIXTURE.publicKey)
		wrongKey[0] ^= 0x01
		expect(verifySolanaSignature(FIXTURE.message, FIXTURE.signature, wrongKey)).toBe(false)
	})

	it('returns false for a malformed signature instead of throwing', () => {
		const wrongLength = new Uint8Array(10)
		expect(verifySolanaSignature(FIXTURE.message, wrongLength, FIXTURE.publicKey)).toBe(false)

		const allZero = new Uint8Array(64)
		expect(verifySolanaSignature(FIXTURE.message, allZero, FIXTURE.publicKey)).toBe(false)

		const allOnes = new Uint8Array(64).fill(0xff)
		expect(verifySolanaSignature(FIXTURE.message, allOnes, FIXTURE.publicKey)).toBe(false)
	})
})
