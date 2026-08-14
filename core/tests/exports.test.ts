import * as core from '../src'
import { describe, expect, it } from 'bun:test'

describe('@worldcoin/agentkit-core exports', () => {
	it('exports only the request verifier', () => {
		expect(Object.keys(core)).toEqual(['verify'])
		expect(typeof core.verify).toBe('function')
	})
})
