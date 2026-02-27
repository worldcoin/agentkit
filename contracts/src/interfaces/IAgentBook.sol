// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAgentBook {
    /// @notice Register an agent address in the AgentBook.
    /// @param agent The address to register
    /// @param root The World ID Merkle tree root
    /// @param nonce A nonce included in the signal to ensure proof freshness
    /// @param nullifierHash The World ID nullifier hash (acts as the anonymous human identifier)
    /// @param proof The World ID zero-knowledge proof
    function register(address agent, uint256 root, uint256 nonce, uint256 nullifierHash, uint256[8] calldata proof)
        external;

    /// @notice Look up the anonymous human identifier for a registered agent.
    /// @param agent The agent's wallet address
    /// @return humanId The anonymous human identifier (nullifier hash), or 0 if not registered
    function lookupHuman(address agent) external view returns (uint256 humanId);

    /// @notice Get the next expected nonce for an agent address.
    /// @param agent The agent's wallet address
    /// @return nonce The next nonce that must be used when registering this agent
    function getNextNonce(address agent) external view returns (uint256 nonce);
}
