import * as core from '../src'
import { describe, expect, it } from 'bun:test'

describe('@worldcoin/agentkit-core exports', () => {
	it('exports the request verifiers and the client signature helper', () => {
		expect(Object.keys(core).sort()).toEqual(['createSignatureHeaders', 'verify', 'verifyRequest'])
		expect(typeof core.verify).toBe('function')
		expect(typeof core.verifyRequest).toBe('function')
		expect(typeof core.createSignatureHeaders).toBe('function')
	})
})
