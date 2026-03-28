---
name: agentkit-x402
description: Use this skill when you receive a 402 Payment Required response that contains an `agentkit` extension. Covers checking 402 responses for the AgentKit extension before paying, constructing and signing a CAIP-122 challenge (SIWE for EVM, SIWS for Solana), sending the signed `agentkit` HTTP header, and interpreting access modes (free, free-trial, discount). Supports both EOA wallets (EIP-191) and Smart Contract Wallets (ERC-1271, e.g. Coinbase Smart Wallet, Safe).
---

# Using AgentKit as an Agent

This skill is for AI agents that interact with websites and APIs protected by x402 + AgentKit. It tells you how to prove you are backed by a real human so you can get free or discounted access instead of paying.

## Critical Rule: Always Check for AgentKit Before Paying

When you receive a `402 Payment Required` response, **do not immediately proceed to payment**. First inspect the response for an `agentkit` extension. If one is present, attempt the AgentKit authentication flow below. Only fall back to payment if:

- There is no `agentkit` extension in the 402 response
- Your AgentKit authentication attempt fails and the server requires payment
- You have exhausted your free-trial uses

## Wallet Types

Your wallet determines how you sign the challenge. There are two types:

### EOA (Externally Owned Account)

A standard wallet where you directly hold the private key (e.g. a raw private key, a mnemonic-derived wallet).

- **Signature type:** `eip191`
- **How to sign:** Use `personal_sign` (EIP-191) to sign the SIWE message
- **Example:** `wallet.signMessage(siweMessage)`

### Smart Contract Wallet (SCW)

A wallet where the "account" is a smart contract and signing is done by an underlying owner key. The server verifies your signature on-chain via the contract's `isValidSignature` method (ERC-1271).

Examples: Coinbase Smart Wallet, Safe, any ERC-4337 account.

- **Signature type:** `eip1271`
- **How to sign:** Sign the SIWE message using the wallet's SDK or internal signer. The signature format depends on the wallet implementation — use whatever the wallet SDK provides.
- **Example (Coinbase CDP):** `account.signMessage({ message: siweMessage })`

If you are unsure which type your wallet is: if you created it from a private key or mnemonic, it is an EOA. If you created it through a wallet SDK (Coinbase CDP, Safe SDK, etc.), it is likely an SCW.

## The AgentKit Flow

### Step 1: Parse the 402 Response

When you receive a `402 Payment Required`, look for the `agentkit` extension in the response body. The 402 response contains `x402` data with extensions. The `agentkit` extension looks like:

```json
{
  "agentkit": {
    "info": {
      "domain": "api.example.com",
      "uri": "https://api.example.com/data",
      "version": "1",
      "nonce": "abc123",
      "issuedAt": "2025-01-01T00:00:00.000Z",
      "statement": "Verify your agent is backed by a real human"
    },
    "supportedChains": [
      { "chainId": "eip155:8453", "type": "eip191" },
      { "chainId": "eip155:8453", "type": "eip1271" }
    ],
    "schema": { ... }
  }
}
```

Key fields to extract:

- **`info`** — the challenge data you must sign
- **`supportedChains`** — which chains and signature types the server accepts
- **`mode`** (if present) — tells you the access policy: `free`, `free-trial`, or `discount`

### Step 2: Pick a Chain and Signature Type

Match your wallet to one of the `supportedChains` entries:

| Your wallet       | Match `chainId`      | Use `type`  |
|--------------------|----------------------|-------------|
| EVM EOA            | `eip155:*`           | `eip191`    |
| EVM Smart Contract | `eip155:*`           | `eip1271`   |

Pick the entry that matches both your chain and wallet type.

### Step 3: Construct and Sign the SIWE/SIWS Message

Construct a SIWE (EIP-4361) message string from the challenge `info` fields. The format is a plain text string with this exact structure:

```
{domain} wants you to sign in with your Ethereum account:
{address}

{statement}

URI: {uri}
Version: {version}
Chain ID: {numericChainId}
Nonce: {nonce}
Issued At: {issuedAt}
```

Where `{numericChainId}` is extracted from the CAIP-2 chain ID (e.g. `eip155:8453` becomes `8453`), and `{address}` must be EIP-55 checksummed.

If the challenge includes optional fields, append them in this order (only include lines for fields that are present):

```
Expiration Time: {expirationTime}
Not Before: {notBefore}
Request ID: {requestId}
Resources:
- {resources[0]}
- {resources[1]}
```

Full example:

```
api.example.com wants you to sign in with your Ethereum account:
0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045

Verify your agent is backed by a real human

URI: https://api.example.com/data
Version: 1
Chain ID: 8453
Nonce: abc123def
Issued At: 2025-01-01T00:00:00.000Z
Expiration Time: 2025-01-01T00:05:00.000Z
Request ID: req-456
Resources:
- https://api.example.com/tos
```

**Important formatting rules:**
- There must be a blank line before and after the `{statement}` line
- If there is no statement, there must be a single blank line between the address and `URI:`
- Each line ends with `\n` (LF, not CRLF)
- No trailing newline after the last line

Then sign the message string:

```typescript
// EOA — use personal_sign (EIP-191)
const signature = await wallet.signMessage(messageToSign)

// SCW — use the wallet SDK's signMessage
const signature = await smartWallet.signMessage({ message: messageToSign })
```

### Step 4: Send the Request

Base64-encode a JSON object containing the challenge `info` fields plus your `address`, `type`, and `signature`, and send it as the `agentkit` HTTP header:

```typescript
const header = btoa(JSON.stringify({
  ...info,                               // all fields from the challenge
  address: walletAddress,
  chainId: "eip155:8453",               // from the supportedChains entry you picked
  type: "eip191",                        // "eip191" for EOA, "eip1271" for SCW
  signature: signature,                  // hex string from signing
}))

const response = await fetch("https://api.example.com/data", {
  headers: {
    "agentkit": header,
  },
})
```

If the server grants access (based on the mode), you will receive the resource directly — no payment needed.

If the server responds with another 402 or an error, fall back to the normal x402 payment flow.

## Access Modes

The `mode` field in the AgentKit extension tells you what to expect:

| Mode         | What it means                                                  |
|--------------|----------------------------------------------------------------|
| `free`       | Human-backed agents always get free access                     |
| `free-trial` | First N requests are free, then you must pay (N is per human, not per agent) |
| `discount`   | You get N% off the price (pay the discounted amount via x402)  |

For `discount` mode: send **both** the `agentkit` header and the x402 payment header, but pay the discounted price. The server will reconcile the underpayment using your human-backed status.

## Common Errors and How to Handle Them

### "Agent is not registered in the AgentBook"

Your wallet address is not registered. You need to register first using the AgentKit CLI:

```bash
npx @worldcoin/agentkit-cli register <your-wallet-address>
```

This opens a World ID verification flow that ties your wallet to an anonymous human identifier on-chain. Registration only needs to happen once per wallet.

### "Signature verification failed"

- **Wrong signature type:** Make sure `type` matches your wallet. Use `eip191` for EOA, `eip1271` for SCW.
- **Wrong message format:** The SIWE message must follow the exact format described in Step 3. Pay close attention to blank lines around the statement and field ordering.
- **Wrong chain ID:** The `chainId` in the payload must be CAIP-2 format (`eip155:8453`), but the SIWE message `chainId` field must be the numeric chain ID (`8453`).

### "Invalid agentkit header: not valid base64"

Your header is not properly base64-encoded. Ensure you are encoding the full JSON string: `btoa(JSON.stringify(payload))`.

### "Message validation failed" / "issuedAt is too old"

The challenge has expired. Re-fetch the 402 response to get a fresh challenge (new nonce, new `issuedAt`) and sign again. Challenges expire after 5 minutes by default.

### "Unsupported chain namespace"

You are using a chain that the server does not support. Check `supportedChains` in the 402 response and pick a chain/type pair that matches your wallet.
