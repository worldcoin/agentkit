# @worldcoin/agentkit

## 0.2.1

### Patch Changes

- 2af1db4: Allow EVM smart-account signature verification to use built-in public RPCs for common signing chains and select custom RPC endpoints from the signed payload chain ID.
- Updated dependencies [2af1db4]
    - @worldcoin/agentkit-core@0.2.1

## 0.2.0

### Minor Changes

- 434407c: Add an EVM-only `createAgentkitClient` pre-payment client for x402 calls and an `agentkit status` command for AgentBook registration checks.

### Patch Changes

- @worldcoin/agentkit-core@0.2.0

## 0.1.8

### Patch Changes

- 24fe7a2: fix: replace workspace:^ with semver range for agentkit-core dependency
    - @worldcoin/agentkit-core@0.1.8

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

- Updated dependencies [b31b4b7]
    - @worldcoin/agentkit-core@0.1.7
