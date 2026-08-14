import { z } from 'incur'

export const requestBodyInputSchema = z.string().describe('Exact UTF-8 request body to sign')

export type MessageSigner = {
	signMessage: (message: string) => Promise<`0x${string}`>
}

export function signRequestBody(body: string, signer: MessageSigner): Promise<`0x${string}`> {
	return signer.signMessage(body)
}
