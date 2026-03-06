# Agent Instructions

This repository includes agent-readable skills for the two main workflows:

- registering an agent wallet in AgentBook
- integrating `@worldcoin/agentkit` into an x402 server for human-backed agent verification

## Available Skills

### `agentkit-register-agent`

- Use when the task involves the CLI registration flow, World ID verification, QR/deep-link flows, `--auto`, or the `AgentBook.register(...)` payload.
- Skill file: `./skills/agentkit-register-agent/SKILL.md`

### `agentkit-x402-integration`

- Use when the task involves integrating `@worldcoin/agentkit` into a server, adding hooks, configuring free/free-trial/discount modes, verifying signatures, or looking up humans in AgentBook.
- Skill file: `./skills/agentkit-x402-integration/SKILL.md`

## Usage Notes

- Start with the matching `SKILL.md` and only read the linked reference docs when needed.
- Prefer the documented public APIs in `agentkit/src/index.ts` and the CLI behavior in `cli/src/index.ts`.
- Do not invent contract addresses, payload shapes, or registration endpoints. Use the values documented in this repo.
