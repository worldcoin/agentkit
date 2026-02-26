import { SiweMessage } from 'siwe'
import { verifyMessage } from 'viem'
import type { EVMMessageVerifier, CompleteAgentkitInfo } from './types'

export function extractEVMChainId(chainId: string): number {
	const match = /^eip155:(\d+)$/.exec(chainId)
	if (!match) {
		throw new Error(`Invalid EVM chainId format: ${chainId}. Expected eip155:<number>`)
	}
	return parseInt(match[1], 10)
}

export function formatSIWEMessage(info: CompleteAgentkitInfo, address: string): string {
	const numericChainId = extractEVMChainId(info.chainId)

	const siweMessage = new SiweMessage({
		domain: info.domain,
		address,
		statement: info.statement,
		uri: info.uri,
		version: info.version,
		chainId: numericChainId,
		nonce: info.nonce,
		issuedAt: info.issuedAt,
		expirationTime: info.expirationTime,
		notBefore: info.notBefore,
		requestId: info.requestId,
		resources: info.resources,
	})

	return siweMessage.prepareMessage()
}

export async function verifyEVMSignature(
	message: string,
	address: string,
	signature: string,
	verifier?: EVMMessageVerifier
): Promise<boolean> {
	const args = {
		address: address as `0x${string}`,
		message,
		signature: signature as `0x${string}`,
	}

	if (verifier) {
		return verifier(args)
	}

	return verifyMessage(args)
}
