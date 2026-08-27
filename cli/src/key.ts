import { randomUUID } from 'node:crypto'
import { chmod, link, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'

export type AgentIdentity = {
	address: `0x${string}`
	created: boolean
	keyPath: string
}

export type AgentSigner = {
	address: `0x${string}`
	signMessage: (message: string) => Promise<`0x${string}`>
}

export class AgentKeyNotFoundError extends Error {}

export function getAgentkitKeyPath(xdgConfigHome: string | undefined, homeDirectory: string): string {
	const configuredHome = xdgConfigHome?.trim()
	const configHome = configuredHome && isAbsolute(configuredHome) ? configuredHome : join(homeDirectory, '.config')
	return join(configHome, 'agentkit', 'key')
}

export async function loadOrCreateAgentIdentity(keyPath: string): Promise<AgentIdentity> {
	const keyDirectory = dirname(keyPath)
	await mkdir(keyDirectory, { recursive: true, mode: 0o700 })
	await chmod(keyDirectory, 0o700)

	try {
		return await readIdentity(keyPath, false)
	} catch (error) {
		if (!isNodeError(error) || error.code !== 'ENOENT') throw error
	}

	const privateKey = generatePrivateKey()
	const temporaryKeyPath = `${keyPath}.${process.pid}.${randomUUID()}.tmp`
	try {
		await writeFile(temporaryKeyPath, `${privateKey}\n`, { encoding: 'utf8', flag: 'wx', mode: 0o600 })
		await link(temporaryKeyPath, keyPath)
		return identityFromPrivateKey(privateKey, keyPath, true)
	} catch (error) {
		if (!isNodeError(error) || error.code !== 'EEXIST') throw error
		return await readIdentity(keyPath, false)
	} finally {
		try {
			await unlink(temporaryKeyPath)
		} catch (error) {
			if (!isNodeError(error) || error.code !== 'ENOENT') throw error
		}
	}
}

export async function loadAgentSigner(keyPath: string): Promise<AgentSigner> {
	let privateKey: `0x${string}`
	try {
		privateKey = await readPrivateKey(keyPath)
	} catch (error) {
		if (isNodeError(error) && error.code === 'ENOENT') {
			throw new AgentKeyNotFoundError('No AgentKit key is available. Run `agentkit register` first.')
		}
		throw error
	}

	const account = accountFromPrivateKey(privateKey, keyPath)
	return {
		address: account.address,
		signMessage: message => account.signMessage({ message }),
	}
}

async function readIdentity(keyPath: string, created: boolean): Promise<AgentIdentity> {
	return identityFromPrivateKey(await readPrivateKey(keyPath), keyPath, created)
}

async function readPrivateKey(keyPath: string): Promise<`0x${string}`> {
	const contents = await readFile(keyPath, 'utf8')
	const privateKey = contents.trim()

	if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
		throw new Error(`Invalid AgentKit key at ${keyPath}`)
	}

	await chmod(keyPath, 0o600)
	return privateKey as `0x${string}`
}

function identityFromPrivateKey(privateKey: `0x${string}`, keyPath: string, created: boolean): AgentIdentity {
	return { address: accountFromPrivateKey(privateKey, keyPath).address, created, keyPath }
}

function accountFromPrivateKey(privateKey: `0x${string}`, keyPath: string) {
	try {
		return privateKeyToAccount(privateKey)
	} catch {
		throw new Error(`Invalid AgentKit key at ${keyPath}`)
	}
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
	return error instanceof Error && 'code' in error
}
