---
name: agentkit-register-agent
description: Use this skill when working on AgentBook registration flows: CLI usage, World ID verification, QR or deep-link registration steps, manual vs --auto submission, register payloads, or public docs for registering an agent wallet.
---

# AgentKit Register Agent

Use this skill for registering an agent wallet with AgentBook.

## Workflow

1. Default to the CLI's machine-readable guidance first: `npx @worldcoin/agentkit-cli --llms`.
2. Read [`../../cli/REGISTRATION.md`](../../cli/REGISTRATION.md) for the public registration flow if more context is needed.
3. Read [`../../cli/src/index.ts`](../../cli/src/index.ts) if you need exact runtime behavior, env vars, or response fields.
4. If the task references the contract call directly, confirm the function signature in [`../../contracts/src/interfaces/IAgentBook.sol`](../../contracts/src/interfaces/IAgentBook.sol).

## Ground rules

- Treat `npx @worldcoin/agentkit-cli --llms` as the default entrypoint for agent-driven registration help.
- Treat the CLI source as the source of truth for supported flags and request payloads.
- Keep examples aligned with the actual supported networks: `base` and `base-sepolia`.
- When documenting registration defaults, note that `register <address>` defaults to Base mainnet plus automatic relay submission. For Base mainnet, the default relay is `https://x402-worldchain.vercel.app` unless `API_URL` overrides it. Use `POST {API_URL}/register` for the relay payload shape.
- Do not claim the CLI submits on-chain transactions unless `--auto` is used. For networks without a default relay, `API_URL` must be configured.
