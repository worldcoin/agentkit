---
name: integrate-agentkit
description: Use this skill when integrating @worldcoin/agentkit into an x402 server or facilitator flow: choose free/free-trial/discount mode, wire World Chain payments, pin AgentBook lookup to Base when needed, handle ExactEvmScheme money parsing, or finish an integration end-to-end.
---

# Integrate AgentKit

Use this skill for end-to-end server-side integration work with `@worldcoin/agentkit`.

## Start by clarifying the integration

If the developer has not already answered these, ask before choosing an implementation:

1. Which access mode do they want: `free`, `free-trial`, or `discount`?
2. Which payment network should the protected route use?
3. If they want World Chain payments, should AgentBook lookup stay on Base mainnet?
4. Do they control the facilitator path, or are they using a hosted facilitator?
5. Do they also need agent registration, or only request-time verification?

## Default recommendation

For most production integrations:

- Put paid routes on World Chain (`eip155:480`).
- Keep AgentBook registration and lookup on Base mainnet (`eip155:8453`).
- Start with `free-trial` unless the developer explicitly wants `free` or `discount`.
- Only choose `discount` when you can wire `hooks.verifyFailureHook` into the facilitator flow you control.

## Key pieces

- x402 resource server: the protected HTTP route and 402 challenge flow
- facilitator: verifies and settles payment payloads; required for `discount`
- AgentKit extension: adds the CAIP-122 challenge and verifies the signed `agentkit` header
- AgentBook: on-chain registry that maps the agent wallet to an anonymous human ID
- storage: per-human usage tracking for `free-trial` and `discount`
- registration path: separate from request-time verification; use `npx @worldcoin/agentkit-cli --llms` if the developer also needs registration help

## Workflow

1. Read [`../../agentkit/DOCS.md`](../../agentkit/DOCS.md) first. It should be the primary integration playbook.
2. Confirm exported APIs in [`../../agentkit/src/index.ts`](../../agentkit/src/index.ts) before adding imports.
3. Prefer the hooks-based path:
   - `declareAgentkitExtension`
   - `agentkitResourceServerExtension`
   - `createAgentkitHooks`
   - `createAgentBookVerifier`
4. If the payment network is World Chain (`eip155:480`), add a custom `ExactEvmScheme().registerMoneyParser(...)` for World Chain USDC. Do not assume the server scheme has a working default stablecoin for World Chain.
5. If the product should keep AgentBook on Base, configure `createAgentBookVerifier` with an explicit Base client and Base AgentBook address instead of relying on the request chain.
6. If the mode is `free-trial` or `discount`, add persistent `AgentKitStorage`. `InMemoryAgentKitStorage` is only for demos.
7. If the mode is `discount`, wire `hooks.verifyFailureHook` into the facilitator. Without it, discounted underpayments will fail verification.
8. Verify the whole path end-to-end:
   - 402 response includes the `agentkit` extension
   - registered agent gets the intended behavior
   - unregistered agent falls back to normal payment
   - replay protection and storage behavior work as expected

## Ground rules

- Prefer the hooks-based integration unless the user explicitly needs the low-level flow.
- Use [`../../agentkit/DOCS.md`](../../agentkit/DOCS.md) as the primary reference for examples and mode behavior.
- Be explicit about the payment chain and the AgentBook lookup chain. They can be different.
- World Chain payments plus Base AgentBook lookup is a supported pattern when you pin the verifier to Base.
- Do not document World Chain with bare `new ExactEvmScheme()` only. Include the World Chain money parser.
- Do not choose `discount` unless the facilitator hook can actually be registered.
- Confirm exports in [`../../agentkit/src/index.ts`](../../agentkit/src/index.ts) before adding or documenting imports.

## Constants to keep handy

- World Chain payment network: `eip155:480`
- Base mainnet AgentBook network: `eip155:8453`
- Base mainnet AgentBook contract: `0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4`
- World Chain USDC: `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`

## Reference files

- Integration docs: [`../../agentkit/DOCS.md`](../../agentkit/DOCS.md)
- Public exports: [`../../agentkit/src/index.ts`](../../agentkit/src/index.ts)
- Hooks: [`../../agentkit/src/hooks.ts`](../../agentkit/src/hooks.ts)
- AgentBook verifier: [`../../agentkit/src/agent-book.ts`](../../agentkit/src/agent-book.ts)
- Header parsing and verification: [`../../agentkit/src/parse.ts`](../../agentkit/src/parse.ts), [`../../agentkit/src/validate.ts`](../../agentkit/src/validate.ts), [`../../agentkit/src/verify.ts`](../../agentkit/src/verify.ts)
