import {
	parseAgentkitHeader,
	validateAgentkitMessage,
	verifyAgentkitSignature,
	createAgentBookVerifier,
	type AgentBookVerifier,
} from '@worldcoin/agentkit'
import { env } from './config'

let _agentBook: AgentBookVerifier | null = null

export function getAgentBook(): AgentBookVerifier {
	if (_agentBook) return _agentBook
	_agentBook = createAgentBookVerifier({
		contractAddress: env.AGENTBOOK_CONTRACT_ADDRESS as `0x${string}`,
		rpcUrl: env.AGENTBOOK_RPC_URL,
	})
	return _agentBook
}

export const agentBook = new Proxy({} as AgentBookVerifier, {
	get(_, prop: string) {
		const instance = getAgentBook()
		const value = instance[prop as keyof AgentBookVerifier]
		if (typeof value === 'function') {
			return value.bind(instance)
		}
		return value
	},
})

export { parseAgentkitHeader, validateAgentkitMessage, verifyAgentkitSignature }
