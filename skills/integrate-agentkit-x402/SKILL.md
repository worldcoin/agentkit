---
name: integrate-agentkit-x402
description: "Use this skill when integrating @worldcoin/agentkit into an x402 server or facilitator flow: choose free/free-trial/discount mode, wire payments on any supported EVM chain, handle ExactEvmScheme money parsing, or finish an integration end-to-end."
---

# Integrate AgentKit with x402

Use this skill for end-to-end server-side integration work with `@worldcoin/agentkit`.

## Start by clarifying the integration

If the developer has not already answered these, ask before choosing an implementation:

1. Which access mode do they want: `free`, `free-trial`, or `discount`?
2. Which payment network should the protected route use?
3. Do they control the facilitator path, or are they using a hosted facilitator?
4. Do they also need agent registration, or only request-time verification?

## Default recommendation

For most production integrations:

- Put paid routes on whichever network the developer's facilitator already supports (commonly World Chain `eip155:480` or Base `eip155:8453`).
- Leave AgentBook lookup alone — `createAgentkitHooks()` resolves against the canonical World Chain deployment automatically. The developer does not need to create a verifier or think about which chain the registry lives on.
- Start with `free-trial` unless the developer explicitly wants `free` or `discount`.
- Only choose `discount` when you can wire `hooks.verifyFailureHook` into the facilitator flow you control.

## Key pieces

- x402 resource server: the protected HTTP route and 402 retry flow
- facilitator: verifies and settles payment payloads; required for `discount`
- AgentKit extension: advertises AgentKit support and verifies the request's RFC 9421 signature (`Signature-Input`, `Signature`, and `Content-Digest` headers)
- AgentBook: on-chain registry on World Chain that maps the agent wallet to a lookup ID. Lookup is always against World Chain regardless of the payment chain — the caller side is chain-agnostic.
- storage: per-human usage tracking for `free-trial` and `discount`
- registration path: separate from request-time verification; use `npx @worldcoin/agentkit-cli --llms` if the developer also needs registration help

## Workflow

1. Read [`../../x402/DOCS.md`](../../x402/DOCS.md) first. It should be the primary integration playbook.
2. Confirm exported APIs in [`../../core/src/index.ts`](../../core/src/index.ts) and [`../../x402/src/index.ts`](../../x402/src/index.ts) before adding imports.
3. Prefer the hooks-based path:
    - `declareAgentkitExtension`
    - `agentkitResourceServerExtension`
    - `createAgentkitHooks`
4. If the payment network is World Chain (`eip155:480`), add a custom `ExactEvmScheme().registerMoneyParser(...)` for World Chain USDC. Do not assume the server scheme has a working default stablecoin for World Chain.
5. Do not construct or inject an AgentBook verifier, chain selector, RPC selector, or contract override. The hooks call Core's fixed World Chain verifier.
6. If the mode is `free-trial` or `discount`, add persistent `AgentKitStorage`. `InMemoryAgentKitStorage` is only for demos.
7. If the mode is `discount`, wire `hooks.verifyFailureHook` into the facilitator. Without it, discounted underpayments will fail verification.
8. Verify the whole path end-to-end:
    - 402 response includes the `agentkit` extension
    - registered agent gets the intended behavior
    - unregistered agent falls back to normal payment
    - the client signs the request and retries with the `Signature-Input`, `Signature`, and `Content-Digest` headers
    - usage storage behaves as expected

## Ground rules

- Prefer the hooks-based integration unless the user explicitly needs the low-level flow.
- Use the portable hooks path for bodyless and JSON requests. For other bodies, verify the original Web `Request` in framework-level middleware before x402 parses it.
- Use [`../../x402/DOCS.md`](../../x402/DOCS.md) as the primary reference for examples and mode behavior.
- Do not introduce any "pin AgentBook to chain X" language — lookup is always against the canonical World Chain deployment. The payment chain and the AgentBook lookup chain are decoupled on purpose, and callers should never have to think about the lookup chain.
- Do not add an `agentBook`, RPC, chain, or contract override. The hooks own the canonical World Chain lookup.
- Do not document World Chain with bare `new ExactEvmScheme()` only. Include the World Chain money parser.
- Do not choose `discount` unless the facilitator hook can actually be registered.
- Confirm exports in [`../../core/src/index.ts`](../../core/src/index.ts) and [`../../x402/src/index.ts`](../../x402/src/index.ts) before adding or documenting imports.

## Constants to keep handy

- World Chain payment network: `eip155:480`
- World Chain AgentBook contract: `0xA23aB2712eA7BBa896930544C7d6636a96b944dA`
- World Chain USDC: `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`

## Reference files

- Integration docs: [`../../x402/DOCS.md`](../../x402/DOCS.md)
- Core public exports: [`../../core/src/index.ts`](../../core/src/index.ts)
- x402 public exports: [`../../x402/src/index.ts`](../../x402/src/index.ts)
- Hooks: [`../../x402/src/hooks.ts`](../../x402/src/hooks.ts)
- AgentBook lookup: [`../../core/src/agent-book.ts`](../../core/src/agent-book.ts)
- Request verification: [`../../core/src/verify.ts`](../../core/src/verify.ts)
- x402 body normalization and header constants: [`../../x402/src/protocol.ts`](../../x402/src/protocol.ts)
