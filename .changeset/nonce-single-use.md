---
'@worldcoin/agentkit-core': minor
'@worldcoin/agentkit': minor
'@worldcoin/agentkit-cli': minor
---

Make signatures single-use with a nonce. Every signature now carries a random `nonce` parameter in `Signature-Input`, generated automatically by `createSignatureHeaders` and the CLI. Servers enforce single use through the new atomic `tryRecordNonce(nonce, expiresAt)` storage method (implemented by `InMemoryAgentKitStorage` with expiry pruning) or the equivalent `tryRecordNonce` dependency on core's `verifyRequest`; without a nonce store, replay of a byte-identical request remains bounded by the five-minute validity window.
