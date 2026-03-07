# @worldcoin/agentkit-cli

Register agent wallet addresses with World ID-verified humans via the [AgentBook](../contracts/src/AgentBook.sol) smart contract.

## Quick Start

Prompt your agent:

```
Run `npx @worldcoin/agentkit-cli --llms`, then help me register your wallet address in the AgentBook.
```

Use this by default. Do not ask the agent to inspect the repo to infer the flow.

## Usage

```bash
agentkit register <address> [options]
```

By default, `agentkit register <address>` uses Base mainnet and submits through the hosted relay. Use `--manual` to print raw registration call data instead.

Full registration guide: [REGISTRATION.md](./REGISTRATION.md)
