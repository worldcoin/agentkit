import { createSiweMessage } from 'viem/siwe'
import { getPublicClient } from './viem-client'
import type { CompleteAgentkitInfo } from './types'

export function extractEVMChainId(chainId: string): number {
	const match = /^eip155:(\d+)$/.exec(chainId)
	if (!match) {
		throw new Error(`Invalid EVM chainId format: ${chainId}. Expected eip155:<number>`)
	}
	return parseInt(match[1], 10)
}

export function formatSIWEMessage(info: CompleteAgentkitInfo, address: string): string {
	return createSiweMessage({
		domain: info.domain,
		address: address as `0x${string}`,
		statement: info.statement,
		uri: info.uri,
		version: info.version as '1',
		chainId: extractEVMChainId(info.chainId),
		nonce: info.nonce,
		issuedAt: new Date(info.issuedAt),
		expirationTime: info.expirationTime ? new Date(info.expirationTime) : undefined,
		notBefore: info.notBefore ? new Date(info.notBefore) : undefined,
		requestId: info.requestId,
		resources: info.resources,
	})
}

/**
 * Verify an EVM signature using ERC-1271 (smart wallets) with ecrecover fallback (EOA).
 * Uses viem's publicClient.verifyMessage which handles both automatically.
 */
export async function verifyEVMSignature(
	message: string,
	address: string,
	signature: string,
	chainId: string,
	rpcUrl?: string
): Promise<boolean> {
	const numericChainId = extractEVMChainId(chainId)
	const client = getPublicClient(numericChainId, rpcUrl)

	return client.verifyMessage({
		address: address as `0x${string}`,
		message,
		signature: signature as `0x${string}`,
	})
}
