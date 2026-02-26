// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {ByteHasher} from "../src/utils/ByteHasher.sol";
import {AgentBook, IWorldIDGroups} from "../src/AgentBook.sol";

contract DeployAgentBook is Script {
    using ByteHasher for bytes;

    function run() external {
        address worldIdRouter = vm.envAddress("WORLD_ID_ROUTER");
        uint256 groupId = vm.envUint("GROUP_ID");
        string memory appId = vm.envString("APP_ID");
        string memory action = vm.envString("ACTION");

        uint256 externalNullifierHash =
            abi.encodePacked(abi.encodePacked(appId).hashToField(), action).hashToField();

        vm.startBroadcast();

        AgentBook agentBook = new AgentBook(IWorldIDGroups(worldIdRouter), groupId, externalNullifierHash);

        vm.stopBroadcast();

        console.log("AgentBook deployed at:", address(agentBook));
    }
}
