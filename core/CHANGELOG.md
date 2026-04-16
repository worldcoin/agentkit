# @worldcoin/agentkit-core

## 0.1.8

## 0.1.7

### Patch Changes

- b31b4b7: Make AgentBook lookup chain-agnostic from the caller side.

    `createAgentBookVerifier()` now always resolves against the canonical AgentBook
    deployment on World Chain (`eip155:480`), regardless of which chain the agent's
    signature was produced on or which chain your paid route runs on.

    `lookupHuman(address)` no longer takes a `chainId` parameter — the argument was
    already ignored in the default path, so the call site cleanup is the only
    change integrators need to make. `AgentBookOptions` is unchanged; `rpcUrl` and
    `contractAddress` still work, now with "custom World Chain RPC" and "custom
    AgentBook contract on World Chain" semantics.
