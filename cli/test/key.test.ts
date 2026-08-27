import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { recoverMessageAddress } from 'viem'
import { AgentKeyNotFoundError, getAgentkitKeyPath, loadAgentSigner, loadOrCreateAgentIdentity } from '../src/key.js'

const temporaryDirectories: string[] = []

afterEach(async () => {
	await Promise.all(temporaryDirectories.splice(0).map(directory => rm(directory, { recursive: true, force: true })))
})

describe('getAgentkitKeyPath', () => {
	test('uses XDG_CONFIG_HOME when it is absolute', () => {
		expect(getAgentkitKeyPath('/tmp/custom-config', '/tmp/home')).toBe(
			'/tmp/custom-config/agentkit/key'
		)
	})

	test('falls back to the home config directory for an invalid relative XDG_CONFIG_HOME', () => {
		expect(getAgentkitKeyPath('relative', '/tmp/home')).toBe('/tmp/home/.config/agentkit/key')
	})
})

describe('loadOrCreateAgentIdentity', () => {
	test('creates a private key once with restricted permissions', async () => {
		const keyPath = await makeKeyPath()

		const first = await loadOrCreateAgentIdentity(keyPath)
		const second = await loadOrCreateAgentIdentity(keyPath)

		expect(first.created).toBe(true)
		expect(second.created).toBe(false)
		expect(second.address).toBe(first.address)
		expect(await readFile(keyPath, 'utf8')).toMatch(/^0x[0-9a-f]{64}\n$/)
		expect((await stat(keyPath)).mode & 0o777).toBe(0o600)
		expect((await stat(join(keyPath, '..'))).mode & 0o777).toBe(0o700)
	})

	test('concurrent first runs converge on the same identity', async () => {
		const keyPath = await makeKeyPath()
		const identities = await Promise.all(Array.from({ length: 8 }, () => loadOrCreateAgentIdentity(keyPath)))

		expect(new Set(identities.map(identity => identity.address)).size).toBe(1)
		expect(identities.filter(identity => identity.created)).toHaveLength(1)
	})

	test('rejects an invalid existing key without replacing it', async () => {
		const keyPath = await makeKeyPath()
		await loadOrCreateAgentIdentity(keyPath)
		await writeFile(keyPath, 'not-a-private-key\n')

		await expect(loadOrCreateAgentIdentity(keyPath)).rejects.toThrow(`Invalid AgentKit key at ${keyPath}`)
		expect(await readFile(keyPath, 'utf8')).toBe('not-a-private-key\n')
	})

	test('loads the existing identity as an EIP-191 signer', async () => {
		const keyPath = await makeKeyPath()
		const identity = await loadOrCreateAgentIdentity(keyPath)
		const signer = await loadAgentSigner(keyPath)
		const message = 'AgentKit signing test'

		const signature = await signer.signMessage(message)

		expect(signer.address).toBe(identity.address)
		expect(await recoverMessageAddress({ message, signature })).toBe(identity.address)
	})

	test('does not create a key when loading a signer', async () => {
		const keyPath = await makeKeyPath()

		await expect(loadAgentSigner(keyPath)).rejects.toBeInstanceOf(AgentKeyNotFoundError)
	})
})

async function makeKeyPath(): Promise<string> {
	const directory = await mkdtemp(join(tmpdir(), 'agentkit-cli-'))
	temporaryDirectories.push(directory)
	return join(directory, 'config', 'agentkit', 'key')
}
