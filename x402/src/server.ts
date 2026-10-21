import { AGENTKIT } from './protocol'
import type { AgentkitExtension } from './protocol'
import type { AgentkitDeclaration } from './declare'
import type { DeclareAgentkitOptions } from './types'
import type { ResourceServerExtension, PaymentRequiredContext } from '@x402/core/types'

export const agentkitResourceServerExtension: ResourceServerExtension = {
	key: AGENTKIT,

	enrichPaymentRequiredResponse: async (
		declaration: unknown,
		_context: PaymentRequiredContext
	): Promise<AgentkitExtension> => {
		const decl = declaration as AgentkitDeclaration
		const opts: DeclareAgentkitOptions = decl._options ?? {}

		return {
			...(opts.mode ? { mode: opts.mode } : {}),
		}
	},
}
