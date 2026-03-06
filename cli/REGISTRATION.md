# Register an Agent Wallet with AgentBook

This guide explains how to register an agent wallet address in AgentBook using a World ID proof.

AgentBook links an agent wallet to an anonymous human identifier derived from World ID. The registration is written on-chain and can then be checked by apps and servers using `@worldcoin/agentkit`.

## Default Flow for AI Agents

```text
Run `npx @worldcoin/agentkit-cli --llms`, then help me register your wallet address in the AgentBook.
```

Use this by default. Only fall back to the steps below if you need the explicit manual flow.

## What You Need

- A wallet address for the agent you want to register
- World App on a mobile device to complete the World ID verification step
- Bun or npm installed locally
- Optional: an API endpoint that can submit the on-chain transaction for you

## Install the CLI

```bash
npm install -g @worldcoin/agentkit-cli
```

You can also run it directly without a global install:

```bash
npx @worldcoin/agentkit-cli register <agent-address>
```

## Supported Networks

- `base`
- `base-sepolia`

Current AgentBook deployments used by the CLI:

- Base: `0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4`
- Base Sepolia: `0xA23aB2712eA7BBa896930544C7d6636a96b944dA`

## Registration Flow

When you run the CLI:

1. The CLI reads the next required nonce for the agent address from AgentBook.
2. It creates a World ID verification request for the tuple `(agent address, nonce)`.
3. It shows a QR code and deep link for World App.
4. After verification completes, it returns the proof payload needed for `register(...)`.
5. You either submit the transaction yourself or let your backend submit it with `--auto`.

## Option 1: Manual Registration

Use this when you want the CLI to produce the registration payload and contract call inputs, but you will send the transaction yourself.

```bash
agentkit register 0x1234567890abcdef1234567890abcdef12345678
```

For Base Sepolia:

```bash
agentkit register 0x1234567890abcdef1234567890abcdef12345678 --network base-sepolia
```

After the World ID check succeeds, the CLI returns:

- `agent`
- `root`
- `nonce`
- `nullifierHash`
- `proof`
- `contract`
- `network`

Submit those values to:

```solidity
register(address agent, uint256 root, uint256 nonce, uint256 nullifierHash, uint256[8] proof)
```

## Option 2: Automatic Registration via API

Use this when you have a backend that accepts the registration payload and submits the transaction.

Set `API_URL` and run:

```bash
API_URL=https://your-api.example.com agentkit register 0x1234567890abcdef1234567890abcdef12345678 --auto
```

The CLI will `POST` the registration payload to:

```text
POST {API_URL}/register
Content-Type: application/json
```

Example request body:

```json
{
  "agent": "0x1234567890abcdef1234567890abcdef12345678",
  "root": "123456789",
  "nonce": "0",
  "nullifierHash": "987654321",
  "proof": ["0x...", "0x...", "0x...", "0x...", "0x...", "0x...", "0x...", "0x..."],
  "contract": "0xE1D1D3526A6FAa37eb36bD10B933C1b77f4561a4",
  "network": "base"
}
```

On success, the API can return a transaction hash:

```json
{
  "txHash": "0x..."
}
```

## Example User Experience

```bash
agentkit register 0x1234567890abcdef1234567890abcdef12345678
```

The CLI will:

- look up the next nonce
- print a World App QR code
- wait for verification
- output the registration payload

## Notes

- The agent address must be a valid EVM address.
- Registration is nonce-based. Re-registering the same agent requires the next nonce from the contract.
- The World ID proof is bound to both the agent address and the current nonce, so you cannot reuse an old proof for a later registration.
- `--auto` requires `API_URL`.

## Troubleshooting

### Invalid Ethereum address

Make sure the agent address is a 20-byte hex EVM address such as `0x1234...`.

### Verification timed out

Retry the command and complete the World App step within the session window.

### `API_URL environment variable is required with --auto`

Set the environment variable before running the command:

```bash
API_URL=https://your-api.example.com agentkit register 0x1234567890abcdef1234567890abcdef12345678 --auto
```

### Transaction reverted

Check that:

- you submitted to the correct AgentBook contract for the selected network
- you used the exact `nonce` returned by the CLI
- the proof and root were submitted unchanged
