// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract SybilAirdrop is Ownable {
    IERC20 public immutable token;
    uint256 public immutable claimAmount;
    uint256 public totalClaims;

    mapping(uint256 => bool) public hasClaimed;

    event Claimed(address indexed agent, uint256 indexed nullifierHash, uint256 amount);

    constructor(address _token, uint256 _claimAmount) Ownable(msg.sender) {
        token = IERC20(_token);
        claimAmount = _claimAmount;
    }

    function claim(address agent, uint256 nullifierHash) external onlyOwner {
        require(!hasClaimed[nullifierHash], "Already claimed");
        require(token.balanceOf(address(this)) >= claimAmount, "Insufficient funds");

        hasClaimed[nullifierHash] = true;
        totalClaims++;
        require(token.transfer(agent, claimAmount), "Transfer failed");

        emit Claimed(agent, nullifierHash, claimAmount);
    }

    function remainingBalance() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function withdraw() external onlyOwner {
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(owner(), balance), "Transfer failed");
    }
}
