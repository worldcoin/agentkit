import { AGENTKIT } from './protocol'
import type { AgentkitExtension } from './protocol'
import type { DeclareAgentkitOptions } from './types'

export interface AgentkitDeclaration extends AgentkitExtension {
	_options: DeclareAgentkitOptions
}

export function declareAgentkitExtension(
	options: DeclareAgentkitOptions = {}
): Record<string, AgentkitDeclaration> {
	const declaration: AgentkitDeclaration = {
		...(options.mode ? { mode: options.mode } : {}),
		_options: options,
	}

	return { [AGENTKIT]: declaration }
}
