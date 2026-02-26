// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {ByteHasher} from "./utils/ByteHasher.sol";
import {IAgentBook} from "./interfaces/IAgentBook.sol";
import {Ownable} from "@openzeppelin-contracts-5.0.2/access/Ownable.sol";
import {IWorldIDGroups} from "world-id-contracts/interfaces/IWorldIDGroups.sol";
import {Ownable2Step} from "@openzeppelin-contracts-5.0.2/access/Ownable2Step.sol";

/// @title Agent Book
/// @author Miguel Piedrafita
/// @notice A registry that ties agent wallet addresses to World ID-verified humans.
contract AgentBook is IAgentBook, Ownable2Step {
    using ByteHasher for bytes;

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  ERRORS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Thrown when the contract's configuration is invalid.
    error InvalidConfiguration();

    /// @notice Thrown when the owner attempts to resign ownership.
    error CannotRenounceOwnership();

    ///////////////////////////////////////////////////////////////////////////////
    ///                                  EVENTS                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Emitted when an agent is registered under a human identifier.
    /// @param agent The agent's wallet address
    /// @param humanId The anonymous human identifier (nullifier hash)
    event AgentRegistered(address indexed agent, uint256 indexed humanId);

    /// @notice Emitted when the contract is initialized
    /// @param worldIdRouter The WorldID router that will manage groups and verify proofs
    /// @param groupId The group ID of the World ID
    /// @param externalNullifierHash The nullifier hash that will be used to verify proofs
    event AgentBookInitialized(IWorldIDGroups worldIdRouter, uint256 groupId, uint256 externalNullifierHash);

    /// @notice Emitted when the `worldIdRouter` is changed
    /// @param worldIdRouter The new `worldIdRouter` instance
    event WorldIdRouterUpdated(IWorldIDGroups worldIdRouter);

    /// @notice Emitted when the `groupId` is changed
    /// @param groupId The new `groupId`
    event GroupIdUpdated(uint256 groupId);

    ///////////////////////////////////////////////////////////////////////////////
    ///                              CONFIG STORAGE                            ///
    //////////////////////////////////////////////////////////////////////////////

    /// @dev The WorldID router instance that will be used for managing groups and verifying proofs
    IWorldIDGroups public worldIdRouter;

    /// @dev The World ID group whose participants can verify with this contract.
    uint256 public groupId;

    /// @dev The World ID nullifier hash that will be used to verify proofs.
    uint256 immutable EXTERNAL_NULLIFIER_HASH;

    /// @notice Look up the anonymous human identifier for a registered agent.
    mapping(address => uint256) public lookupHuman;

    ///////////////////////////////////////////////////////////////////////////////
    ///                               CONSTRUCTOR                              ///
    //////////////////////////////////////////////////////////////////////////////

    /// @notice Deploys an AgentBook instance
    /// @param _worldIdRouter The WorldID router that will manage groups and verify proofs
    /// @param _groupId The group ID of the World ID
    /// @param _externalNullifierHash The nullifier hash that will be used to verify proofs
    constructor(IWorldIDGroups _worldIdRouter, uint256 _groupId, uint256 _externalNullifierHash) Ownable(msg.sender) {
        if (address(_worldIdRouter) == address(0)) {
            revert InvalidConfiguration();
        }

        groupId = _groupId;
        worldIdRouter = _worldIdRouter;
        EXTERNAL_NULLIFIER_HASH = _externalNullifierHash;

        emit AgentBookInitialized(worldIdRouter, groupId, EXTERNAL_NULLIFIER_HASH);
    }

    ///////////////////////////////////////////////////////////////////////////////
    ///                               MAIN LOGIC                                ///
    //////////////////////////////////////////////////////////////////////////////

    /// @inheritdoc IAgentBook
    function register(address agent, uint256 root, uint256 nonce, uint256 nullifierHash, uint256[8] calldata proof)
        external
        override
    {
        lookupHuman[agent] = nullifierHash;

        worldIdRouter.verifyProof(
            root, groupId, abi.encodePacked(agent, nonce).hashToField(), nullifierHash, EXTERNAL_NULLIFIER_HASH, proof
        );

        emit AgentRegistered(agent, nullifierHash);
    }

    ///////////////////////////////////////////////////////////////////////////////
    ///                               CONFIG LOGIC                             ///
    //////////////////////////////////////////////////////////////////////////////

    // @notice Update the worldIdRouter
    /// @param _worldIdRouter The new worldIdRouter
    /// @dev Can only be called by the owner
    function setWorldIdRouter(IWorldIDGroups _worldIdRouter) external onlyOwner {
        if (address(_worldIdRouter) == address(0)) {
            revert InvalidConfiguration();
        }

        worldIdRouter = _worldIdRouter;
        emit WorldIdRouterUpdated(_worldIdRouter);
    }

    /// @notice Update the groupId
    /// @param _groupId The new groupId
    /// @dev Can only be called by the owner
    function setGroupId(uint256 _groupId) external onlyOwner {
        groupId = _groupId;

        emit GroupIdUpdated(_groupId);
    }

    /// @notice Prevents the owner from renouncing ownership
    function renounceOwnership() public view override onlyOwner {
        revert CannotRenounceOwnership();
    }
}
