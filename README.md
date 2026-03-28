<div align="center">

```
    _                    _   _  ___ _
   / \   __ _  ___ _ __ | |_| |/ (_) |_
  / _ \ / _` |/ _ \ '_ \| __| ' /| | __|
 / ___ \ (_| |  __/ | | | |_| . \| | |_
/_/   \_\__, |\___|_| |_|\__|_|\_\_|\__|
        |___/
```

**Verify that an agent is backed by a real, World ID-verified human.**

[Docs](https://docs.world.org/agents/agent-kit)

<video src="registration.mp4" width="600" autoplay loop muted></video>

</div>

## What It Does

1. An agent wallet is registered in AgentBook using a World ID proof.
2. A website or API using x402 challenges the agent to sign a CAIP-122 message.
3. The server verifies the signature, resolves the registering human from AgentBook, and applies the configured access policy.

This lets applications distinguish between arbitrary automation and automation acting on behalf of a real human, without exposing the human's underlying identity.

## Install

### With Claude

Install the AgentKit plugin for Claude Code:

```bash
claude plugin install agentkit
```

This gives you two skills:

- `/agentkit:agentkit-x402` — how to authenticate with x402 endpoints as a human-backed agent
- `/agentkit:integrate-agentkit` — server-side integration guide

### Via Skills
```bash
npx skills add worldcoin/agentkit agentki-x402
```

## For Agents

### Register

Register your wallet in AgentBook so servers can verify you are human-backed. Registration is gasless by default (uses a hosted relay on Base mainnet).

```bash
npx @worldcoin/agentkit-cli register <your-wallet-address>
```

This will prompt a World ID verification via World App. You only need to register once per wallet.

For the full registration guide (manual mode, custom relays, Base Sepolia): [`./cli/REGISTRATION.md`](./cli/REGISTRATION.md)

### Use

Once registered, you can authenticate with any x402 endpoint that has the AgentKit extension to get free or discounted access instead of paying.

The full flow — parsing 402 responses, signing the CAIP-122 challenge, and sending the `agentkit` header — is documented in the agent skill: [`./skills/agentkit-x402/SKILL.md`](./skills/agentkit-x402/SKILL.md)

## For x402 Developers

### Integrate

Add AgentKit to your x402 server to offer human-backed agents free access, free trials, or discounts.

```bash
npm install @worldcoin/agentkit
```

For the full integration guide (hooks setup, access modes, World Chain payments, AgentBook configuration): [`./agentkit/DOCS.md`](./agentkit/DOCS.md)
