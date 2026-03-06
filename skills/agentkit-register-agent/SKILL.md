---
name: agentkit-register-agent
description: Use this skill when working on AgentBook registration flows: CLI usage, World ID verification, QR or deep-link registration steps, manual vs --auto submission, register payloads, or public docs for registering an agent wallet.
---

# AgentKit Register Agent

Use this skill for any task about registering an agent wallet with AgentBook.

## What this skill covers

- Explaining or documenting the CLI registration flow
- Updating examples for `agentkit register <address>`
- Describing manual transaction submission vs `--auto`
- Reusing the exact registration payload and contract function signature

## Workflow

1. Read [`../../cli/REGISTRATION.md`](../../cli/REGISTRATION.md) for the public registration flow.
2. Read [`../../cli/src/index.ts`](../../cli/src/index.ts) if you need exact runtime behavior, env vars, or response fields.
3. If the task references the contract call directly, confirm the function signature in [`../../contracts/src/interfaces/IAgentBook.sol`](../../contracts/src/interfaces/IAgentBook.sol).

## Ground rules

- Treat the CLI source as the source of truth for supported flags and request payloads.
- Keep examples aligned with the actual supported networks: `base` and `base-sepolia`.
- When documenting `--auto`, use `POST {API_URL}/register` and the JSON payload emitted by the CLI.
- Do not claim the CLI submits on-chain transactions unless `--auto` is used and `API_URL` is configured.

## Reference files

- Public guide: [`../../cli/REGISTRATION.md`](../../cli/REGISTRATION.md)
- CLI behavior: [`../../cli/src/index.ts`](../../cli/src/index.ts)
- CLI package summary: [`../../cli/README.md`](../../cli/README.md)
- Contract interface: [`../../contracts/src/interfaces/IAgentBook.sol`](../../contracts/src/interfaces/IAgentBook.sol)
