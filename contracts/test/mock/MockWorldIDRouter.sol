// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IWorldIDGroups} from "world-id-contracts/interfaces/IWorldIDGroups.sol";

contract MockWorldIDRouter is IWorldIDGroups {
    bool internal willNextProofBeValid = false;

    /// @notice Accept the next proof as valid
    function prank() external {
        willNextProofBeValid = true;
    }

    /// @dev Will revert unless `prank` was called right before this call
    function verifyProof(uint256, uint256, uint256, uint256, uint256, uint256[8] calldata) external {
        require(willNextProofBeValid, "Invalid proof");
        willNextProofBeValid = false;
    }
}
