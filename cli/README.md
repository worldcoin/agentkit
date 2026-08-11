# @worldcoin/agentkit-cli

Register an agent with a World ID-verified human through AgentBook.

## Usage

```bash
agentkit register
```

That is the entire registration command. On its first run, the CLI creates a local identity, checks whether it is already registered, and only starts World ID verification when registration is still needed. Successful registrations are submitted through the hosted relay.

The private key is stored at:

```text
$XDG_CONFIG_HOME/agentkit/key
```

When `XDG_CONFIG_HOME` is not set to an absolute path, the CLI uses:

```text
~/.config/agentkit/key
```

Keep this file private and back it up. It is the durable identity for this agent. The private key never leaves the machine; registration sends the derived public address and World ID proof to the hosted relay.

Full registration guide: [REGISTRATION.md](./REGISTRATION.md)

## Prove this agent is registered

Pass the `agentkit` extension from an x402 response as JSON:

```bash
agentkit prove '{"agentkit":{"info":{"domain":"api.example.com","uri":"https://api.example.com/data","version":"1","nonce":"abc123","issuedAt":"2025-01-01T00:00:00.000Z","statement":"Verify your agent is backed by a real human"},"supportedChains":[{"chainId":"eip155:8453","type":"eip191"}],"schema":{}}}'
```

The command requires the local key created by `agentkit register` and confirms that its derived address is registered before signing. It selects the first supported EVM `eip191` chain, constructs the documented SIWE message, and returns a `signature` field containing the complete base64 value for the `agentkit` HTTP header.

The encoded value contains the public challenge response and EIP-191 signature. The private key remains in the local key file.
