import { z } from 'incur'
import { createSignatureHeaders, type AgentkitSignatureHeaders } from '@worldcoin/agentkit-core'
import type { AgentSigner } from './key.js'

export const methodInputSchema = z
	.string()
	.regex(/^[A-Za-z]+$/, 'Invalid HTTP method')
	.describe('HTTP method of the request, e.g. GET or POST')

export const urlInputSchema = z
	.string()
	.regex(/^https?:\/\/\S+$/, 'Invalid request URL')
	.describe('Full request URL, including any query string')

export const bodyInputSchema = z
	.string()
	.default('')
	.describe('Exact UTF-8 request body; omit for bodyless requests')

export function createProofHeaders(input: {
	method: string
	url: string
	body: string
	signer: AgentSigner
}): Promise<AgentkitSignatureHeaders> {
	return createSignatureHeaders({
		method: input.method,
		url: input.url,
		body: input.body,
		address: input.signer.address,
		signMessage: message => input.signer.signMessage(message),
	})
}
