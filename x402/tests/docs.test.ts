import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'bun:test'

const docs = readFileSync(new URL('../DOCS.md', import.meta.url), 'utf8')

describe('AgentKitStorage documentation', () => {
	it('rejects expired timestamps inside the PostgreSQL nonce insert', () => {
		const example = docs.match(
			/INSERT INTO agentkit_nonces[\s\S]*?ON CONFLICT \(nonce\) DO NOTHING[\s\S]*?RETURNING nonce/
		)?.[0]

		expect(example).toContain('WHERE $2::timestamptz > clock_timestamp()')
	})
})
