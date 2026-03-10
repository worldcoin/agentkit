import { parseAbi } from 'viem'

export const AGENT_BOOK_ABI = parseAbi([
  'function register(address agent, uint256 root, uint256 nonce, uint256 nullifierHash, uint256[8] proof) external',
  'function lookupHuman(address) view returns (uint256)',
  'function getNextNonce(address) view returns (uint256)',
])
