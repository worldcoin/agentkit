---
'@worldcoin/agentkit-core': minor
'@worldcoin/agentkit': minor
---

Make AgentBook lookup chain-agnostic from the caller side.

`createAgentBookVerifier()` now always resolves against the canonical AgentBook
deployment on World Chain (`eip155:480`), regardless of which chain the agent's
signature was produced on or which chain your paid route runs on.

**Breaking change (0.x minor):** `lookupHuman(address)` no longer takes a
`chainId` parameter. The previous signature ignored `chainId` in the default
path anyway, but the type change will require updating call sites.

The `AgentBookOptions` shape is unchanged — `rpcUrl`, `contractAddress`, and
`client` still work, but their semantics are now "custom World Chain RPC" and
"custom AgentBook contract on World Chain" rather than chain-switching knobs.
