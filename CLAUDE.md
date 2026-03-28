# CLAUDE.md

## Project Overview

Monorepo for the Worldcoin AgentKit — a toolkit for building AI agents that integrate with World ID and World Chain.

- `agentkit/` — Core TypeScript library (`@worldcoin/agentkit`). Handles signature verification, x402 payments, AgentBook lookups, and agent registration validation.
- `cli/` — CLI tool (`@worldcoin/agentkit-cli`) for agent registration via World ID.
- `contracts/` — Solidity smart contracts (AgentBook registry). Built with Foundry.
- `skills/` — Claude AI integration skills for agentkit.

## Dev Commands

```bash
# Install dependencies
bun install

# Build the library
bun run build:agentkit

# Run TypeScript tests (from agentkit/)
cd agentkit && bun test

# Run Solidity checks (from contracts/)
cd contracts && forge build && forge test -vvv

# Format code
npx prettier --write .
```

## Pre-PR Checklist

CI only runs Solidity checks — TypeScript issues must be caught locally.

1. `bun run build:agentkit` — must compile cleanly
2. `cd agentkit && bun test` — all tests must pass
3. `npx prettier --write .` — format all files
4. If touching contracts: `cd contracts && forge fmt && forge build && forge test -vvv`

## Code Style

Prettier handles formatting (config in root `package.json`), but know the conventions:

- **Tabs** for indentation, **no semicolons**, **single quotes**
- 120 character line width
- Trailing commas in ES5 positions
- Imports sorted descending via `prettier-plugin-sort-imports-desc`

### Naming

- `camelCase` for functions and variables
- `PascalCase` for types and interfaces
- `kebab-case` for file names
- `SCREAMING_SNAKE_CASE` for constants

### Exports

- Named exports only — no default exports
- Barrel file at `agentkit/src/index.ts` grouped by category (constants, types, server, chain utilities, etc.)
- New public exports must be added to the barrel file

### TypeScript

- Strict mode is enabled — do not weaken it
- Use the `type` keyword for type-only imports: `import type { Foo } from './bar'`
- Zod schemas co-located with their types, derive types via `z.infer<typeof Schema>`
- Bun native test runner (`bun:test`) — not Jest, not Vitest

## Architecture Constraints

- **Viem** for all Ethereum interactions — never ethers.js
- **World Chain** is the only supported chain — do not add other chains
- **Zod** for runtime validation at system boundaries
- **Dual ESM/CJS** output from tsup — do not break either format
- **Bun** is the package manager and test runner

## Commit Conventions

Follow conventional commits with short imperative descriptions:

```
fix: correct signature validation for empty payloads
feat(agent-book): add batch lookup support
chore: bump @worldcoin/agentkit to 0.1.7
```

Use scopes when the change is isolated to a specific module (e.g., `agent-book`, `cli`, `evm`, `solana`).
