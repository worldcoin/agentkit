// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test} from "forge-std/Test.sol";
import {MockWorldIDRouter} from "./mock/MockWorldIDRouter.sol";
import {AgentBook, IWorldIDGroups} from "../src/AgentBook.sol";

contract AgentBookTest is Test {
    MockWorldIDRouter public worldId;
    AgentBook public agentBook;

    uint256[8] public fakeProof =
        [uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0), uint256(0)];

    address agent1 = address(0x1);
    address agent2 = address(0x2);

    function setUp() public {
        worldId = new MockWorldIDRouter();
        agentBook = new AgentBook(worldId, 1, 0);

        vm.label(agent1, "Agent1");
        vm.label(agent2, "Agent2");
        vm.label(address(worldId), "WorldIDRouter");
        vm.label(address(agentBook), "AgentBook");
    }

    function testConstructorVerifiesArguments() public {
        // router address cannot be zero
        vm.expectRevert(AgentBook.InvalidConfiguration.selector);
        new AgentBook(IWorldIDGroups(address(0x0)), 1, 0);

        // constructor emits an event
        vm.expectEmit(true, false, false, true);
        emit AgentBook.AgentBookInitialized(worldId, 1, 0);
        new AgentBook(worldId, 1, 0);
    }

    function testAgentCanGetRegistered() public {
        // agent starts unregistered
        assertEq(agentBook.lookupHuman(agent1), 0);

        worldId.prank();
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);

        assertEq(agentBook.lookupHuman(agent1), 0x1234);
    }

    function testRegisterEmitsEvent() public {
        worldId.prank();

        vm.expectEmit(true, true, false, true);
        emit AgentBook.AgentRegistered(agent1, 0x1234);
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);
    }

    function testCannotRegisterWithInvalidProof() public {
        assertEq(agentBook.lookupHuman(agent1), 0);

        vm.expectRevert();
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);

        assertEq(agentBook.lookupHuman(agent1), 0);
    }

    function testCannotRegisterWithInvalidNonce() public {
        worldId.prank();

        vm.expectRevert(AgentBook.InvalidNonce.selector);
        agentBook.register(agent1, 0, 1, 0x1234, fakeProof);

        assertEq(agentBook.lookupHuman(agent1), 0);
    }

    function testNonceIncrements() public {
        assertEq(agentBook.getNextNonce(agent1), 0);

        worldId.prank();
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);
        assertEq(agentBook.getNextNonce(agent1), 1);

        worldId.prank();
        agentBook.register(agent1, 0, 1, 0x5678, fakeProof);
        assertEq(agentBook.getNextNonce(agent1), 2);
    }

    function testCanReRegisterAgent() public {
        worldId.prank();
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);
        assertEq(agentBook.lookupHuman(agent1), 0x1234);

        // re-register same agent with a different nullifier
        worldId.prank();
        agentBook.register(agent1, 0, 1, 0x5678, fakeProof);
        assertEq(agentBook.lookupHuman(agent1), 0x5678);
    }

    function testMultipleAgentsSameHuman() public {
        // same nullifierHash for different agents (same human, multiple agents)
        worldId.prank();
        agentBook.register(agent1, 0, 0, 0x1234, fakeProof);

        worldId.prank();
        agentBook.register(agent2, 0, 0, 0x1234, fakeProof);

        assertEq(agentBook.lookupHuman(agent1), 0x1234);
        assertEq(agentBook.lookupHuman(agent2), 0x1234);
    }

    function testOwnerCanUpdateRouterAddress() public {
        // only owner can call the function
        vm.prank(agent1);
        vm.expectRevert();
        agentBook.setWorldIdRouter(IWorldIDGroups(address(0x5)));

        // router address cannot be zero
        vm.expectRevert(AgentBook.InvalidConfiguration.selector);
        agentBook.setWorldIdRouter(IWorldIDGroups(address(0x0)));

        // owner can update the router address
        assertEq(address(agentBook.worldIdRouter()), address(worldId));

        vm.expectEmit(true, false, false, true);
        emit AgentBook.WorldIdRouterUpdated(IWorldIDGroups(address(0x6)));
        agentBook.setWorldIdRouter(IWorldIDGroups(address(0x6)));

        assertEq(address(agentBook.worldIdRouter()), address(0x6));
    }

    function testOwnerCanUpdateGroupId() public {
        // only owner can call the function
        vm.prank(agent1);
        vm.expectRevert();
        agentBook.setGroupId(2);

        // owner can update the groupId
        assertEq(agentBook.groupId(), 1);

        vm.expectEmit(true, false, false, true);
        emit AgentBook.GroupIdUpdated(2);
        agentBook.setGroupId(2);

        assertEq(agentBook.groupId(), 2);
    }

    function testCannotRenounceOwnership() public {
        // only owner can call the function
        vm.prank(agent1);
        vm.expectRevert();
        agentBook.renounceOwnership();

        // owner cannot renounce ownership
        vm.expectRevert(AgentBook.CannotRenounceOwnership.selector);
        agentBook.renounceOwnership();
    }

    function testOwnershipTransfer() public {
        // Ownable2Step: transfer requires acceptance
        agentBook.transferOwnership(agent1);
        assertEq(agentBook.owner(), address(this));

        vm.prank(agent1);
        agentBook.acceptOwnership();
        assertEq(agentBook.owner(), agent1);

        // old owner can no longer call onlyOwner functions
        vm.expectRevert();
        agentBook.setGroupId(99);
    }
}
