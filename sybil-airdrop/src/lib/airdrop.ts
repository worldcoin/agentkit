import { createWalletClient, http, publicActions, parseAbi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import { env } from './config'

const SYBIL_AIRDROP_ABI = parseAbi([
	'function claim(address agent, uint256 nullifierHash) external',
	'function hasClaimed(uint256 nullifierHash) view returns (bool)',
	'function remainingBalance() view returns (uint256)',
	'function totalClaims() view returns (uint256)',
	'function claimAmount() view returns (uint256)',
	'function token() view returns (address)',
])

function getWalletClient() {
	const account = privateKeyToAccount(env.AIRDROP_SIGNER_PRIVATE_KEY as `0x${string}`)
	return createWalletClient({
		account,
		chain: base,
		transport: http(env.AGENTBOOK_RPC_URL),
	}).extend(publicActions)
}

export async function executeAirdrop(
	agentAddress: `0x${string}`,
	nullifierHash: bigint
): Promise<`0x${string}`> {
	const client = getWalletClient()
	const { request } = await client.simulateContract({
		address: env.AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
		abi: SYBIL_AIRDROP_ABI,
		functionName: 'claim',
		args: [agentAddress, nullifierHash],
	})
	return client.writeContract(request)
}

export async function hasClaimedOnChain(nullifierHash: bigint): Promise<boolean> {
	const client = getWalletClient()
	return client.readContract({
		address: env.AIRDROP_CONTRACT_ADDRESS as `0x${string}`,
		abi: SYBIL_AIRDROP_ABI,
		functionName: 'hasClaimed',
		args: [nullifierHash],
	})
}

export async function getAirdropInfo() {
	const client = getWalletClient()
	const contractAddress = env.AIRDROP_CONTRACT_ADDRESS as `0x${string}`

	const [remainingBalance, totalClaims, claimAmount, tokenAddress] = await Promise.all([
		client.readContract({ address: contractAddress, abi: SYBIL_AIRDROP_ABI, functionName: 'remainingBalance' }),
		client.readContract({ address: contractAddress, abi: SYBIL_AIRDROP_ABI, functionName: 'totalClaims' }),
		client.readContract({ address: contractAddress, abi: SYBIL_AIRDROP_ABI, functionName: 'claimAmount' }),
		client.readContract({ address: contractAddress, abi: SYBIL_AIRDROP_ABI, functionName: 'token' }),
	])

	return {
		remainingBalance: remainingBalance.toString(),
		totalClaims: Number(totalClaims),
		claimAmount: claimAmount.toString(),
		tokenAddress,
	}
}
