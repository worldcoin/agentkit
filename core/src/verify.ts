import { isHex, recoverMessageAddress, type Hex } from 'viem'
import { lookupNullifierHash } from './agent-book'

const AGENTKIT_HEADER = 'X-AgentKit'

type VerifyRequestDependencies = {
	recoverAddress?: (body: Uint8Array, signature: Hex) => Promise<string>
	lookupNullifierHash?: (address: string) => Promise<string | null>
}

export async function verify(request: Request): Promise<string> {
	return verifyRequest(request)
}

export async function verifyRequest(request: Request, dependencies: VerifyRequestDependencies = {}): Promise<string> {
	const signature = request.headers.get(AGENTKIT_HEADER)?.trim()
	if (!signature) {
		throw verificationError('Missing X-AgentKit header', 'MISSING_HEADER')
	}
	if (!isHex(signature) || !/^0x[0-9a-fA-F]{130}$/.test(signature)) {
		throw verificationError('Invalid X-AgentKit signature', 'INVALID_SIGNATURE')
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
		throw verificationError('Invalid X-AgentKit signature', 'INVALID_SIGNATURE')
	}

	const lookup = dependencies.lookupNullifierHash ?? (signer => lookupNullifierHash(signer))
	const nullifierHash = await lookup(address)
	if (!nullifierHash) {
		throw verificationError('Agent is not registered in AgentBook', 'AGENT_NOT_REGISTERED', address)
	}

	return nullifierHash
}

export function verificationError(message: string, code: string, address?: string): Error {
	return Object.assign(new Error(message), { code, ...(address ? { address } : {}) })
}
