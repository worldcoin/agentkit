# @worldcoin/agentkit-cli

Register agent wallet addresses with World ID-verified humans via the [AgentBook](../contracts/src/AgentBook.sol) smart contract.

## Quick Start

Prompt your agent:

```
Run `npx @worldcoin/agentkit-cli --llms`, then help me register your wallet address in the AgentBook.
```

## Installation

```bash
bun add -g @worldcoin/agentkit-cli
```

## Usage

```bash
agentkit register <address> [options]
```

### Options

| Flag              | Default | Description                                                              |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| `--network`, `-n` | `base`  | Target network (`base` or `base-sepolia`)                                |
| `--auto`, `-a`    |         | Submit on-chain registration automatically instead of printing call data |

### Examples

```bash
# Register on Base mainnet (prints call data for on-chain submission)
agentkit register 0x1234...5678

# Register on Base Sepolia
agentkit register 0x1234...5678 --network base-sepolia

# End-to-end registration via API
agentkit register 0x1234...5678 --auto
```
