# Agent Kit

Verify that an agent is backed by a real, World ID-verified human.

Agent Kit is an x402 extension for websites and APIs that want to recognize human-backed agents. It combines:

- `@worldcoin/agentkit-cli` for registering an agent wallet in AgentBook with a World ID proof
- `@worldcoin/agentkit` for integrating AgentBook-backed verification into x402 server flows

Registration does not have to require the agent to hold gas. `agentkit register <address>` now defaults to Base mainnet plus the shared hosted relay at `https://x402-worldchain.vercel.app`, and `API_URL` can override it.

## Default Registration Flow

Start with this prompt:

```text
Run `npx @worldcoin/agentkit-cli --llms`, then help me register your wallet address in the AgentBook.
```

Use the CLI's machine-readable guidance instead of reconstructing the flow from repo docs.

## What It Does

1. An agent wallet is registered in AgentBook using a World ID proof.
2. A website or API using x402 challenges the agent to sign a CAIP-122 message.
3. The server verifies the signature, resolves the registering human from AgentBook, and applies the configured access policy.

This lets applications distinguish between arbitrary automation and automation acting on behalf of a real human, without exposing the human's underlying identity.

## Docs

- Registration: [`./cli/REGISTRATION.md`](./cli/REGISTRATION.md)
- Server integration: [`./agentkit/DOCS.md`](./agentkit/DOCS.md)
