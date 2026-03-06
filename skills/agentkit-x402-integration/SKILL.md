---
name: agentkit-x402-integration
description: Use this skill when integrating @worldcoin/agentkit into a server or x402 flow: hooks setup, free/free-trial/discount modes, manual agentkit header verification, AgentBook lookups, storage, supported chains, or integration docs and examples.
---

# AgentKit x402 Integration

Use this skill for server-side integration work with `@worldcoin/agentkit`.

## What this skill covers

- Adding `@worldcoin/agentkit` to an x402 resource server
- Using `createAgentkitHooks`, `declareAgentkitExtension`, and `createAgentBookVerifier`
- Implementing free, free-trial, or discount access modes
- Manual `agentkit` header parsing, validation, signature verification, and AgentBook lookup

## Workflow

1. Read [`../../agentkit/DOCS.md`](../../agentkit/DOCS.md) for the supported integration patterns and examples.
2. Read [`../../agentkit/src/index.ts`](../../agentkit/src/index.ts) to confirm exported APIs.
3. Read the specific implementation file only if you need exact runtime behavior:
   - hooks: [`../../agentkit/src/hooks.ts`](../../agentkit/src/hooks.ts)
   - verifier: [`../../agentkit/src/agent-book.ts`](../../agentkit/src/agent-book.ts)
   - parsing/validation/verification: [`../../agentkit/src/parse.ts`](../../agentkit/src/parse.ts), [`../../agentkit/src/validate.ts`](../../agentkit/src/validate.ts), [`../../agentkit/src/verify.ts`](../../agentkit/src/verify.ts)

## Ground rules

- Prefer the hooks-based integration unless the user explicitly needs the low-level flow.
- Use `agentkit/DOCS.md` as the primary reference for examples and mode behavior.
- Confirm exports in `agentkit/src/index.ts` before adding or documenting imports.
- Do not claim a network is supported unless it is documented in this repo or configurable by explicit user input.

## Reference files

- Integration docs: [`../../agentkit/DOCS.md`](../../agentkit/DOCS.md)
- Public exports: [`../../agentkit/src/index.ts`](../../agentkit/src/index.ts)
- Hooks: [`../../agentkit/src/hooks.ts`](../../agentkit/src/hooks.ts)
- AgentBook verifier: [`../../agentkit/src/agent-book.ts`](../../agentkit/src/agent-book.ts)
