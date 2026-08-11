---
name: agentkit-x402
description: Use when an HTTP 402 Payment Required response contains an `agentkit` extension. Use the AgentKit CLI to prove the local agent is registered, attach the returned base64 authorization as the `agentkit` header, interpret free, free-trial, and discount modes, and fall back to x402 payment only when AgentKit access is unavailable.
---

# Authenticate to x402 with AgentKit

## Always try AgentKit before paying

When an HTTP request returns `402 Payment Required`, inspect the response for an `agentkit` extension before authorizing payment. Attempt AgentKit authentication whenever the extension is present.

Fall back to the normal x402 payment flow only when:

- the response has no `agentkit` extension;
- `agentkit prove` cannot authenticate this agent; or
- the service rejects the proof or reports that free-trial access is exhausted.

Do not construct or sign SIWE messages manually. Do not read or request a private key. The AgentKit CLI owns identity loading, registration checks, challenge formatting, chain selection, signing, and authorization encoding.

## Authenticate the request

### 1. Extract the complete extension

Pass a JSON object with the top-level `agentkit` key to the CLI. If the 402 body nests the extension under an `extensions` object, wrap the extension value as `{ "agentkit": extensionValue }`.

Example payload:

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
    "schema": {}
  }
}
```

Preserve every `info` field exactly. Do not change the nonce, timestamps, URI, statement, resources, or supported chains.

Before signing, confirm that `info.domain` and `info.uri` describe the service and request you intended to access. Treat a mismatch as an invalid or suspicious challenge.

### 2. Ask the CLI to prove the agent

Pass the serialized JSON payload as one argument:

```bash
agentkit prove '<agentkit-extension-json>'
```

If the CLI is not installed globally, use:

```bash
npx @worldcoin/agentkit-cli prove '<agentkit-extension-json>'
```

The command:

- loads the existing identity from the AgentKit XDG key file without creating a key;
- verifies that the derived address is registered in AgentBook;
- selects the first supported `eip155:*` chain with type `eip191`;
- constructs and signs the required SIWE message; and
- returns a `signature` field containing the complete base64 AgentKit authorization value.

Use the returned `signature` value directly as the HTTP header value. It is already an encoded JSON authorization containing the challenge information, public address, CAIP-2 chain ID, `eip191` type, and EIP-191 signature.

Do not decode, edit, or re-encode it. Do not confuse it with the inner hexadecimal EIP-191 signature.

### 3. Retry the original request

Repeat the original request with the same method, URI, body, and non-AgentKit headers, adding:

```text
agentkit: <signature returned by agentkit prove>
```

Send the authorization only to the original challenge URI and domain. Treat it as an ephemeral credential: do not persist it, print it unnecessarily, or reuse it for another request or challenge.

If the service grants access, return the resource without paying. If it responds with another 402, interpret the access mode and error before deciding whether to pay.

## Handle access modes

Read the extension's `mode` when present:

| Mode | Behavior |
|---|---|
| `free` | Retry with only the `agentkit` header. Human-backed agents receive free access. |
| `free-trial` | Retry with only the `agentkit` header until the service reports that the per-human trial is exhausted. Then use the normal payment flow. |
| `discount` | Send both the `agentkit` header and the x402 payment header, paying the discounted amount specified by the service. |

If no mode is present, try the `agentkit` header without payment first.

## Recover from errors

### `KEY_NOT_FOUND`

No local AgentKit identity exists. Run:

```bash
agentkit register
```

Registration creates the local identity, checks AgentBook, and starts World ID verification only when needed. Human action may be required. After registration completes, fetch a new 402 challenge and run `prove` again.

### `AGENT_NOT_REGISTERED`

The existing identity has not been registered. Run `agentkit register`, complete World ID verification, then fetch a fresh challenge and retry.

### `IDENTITY_LOAD_FAILED`

The local key is inaccessible or invalid. Report the error. Do not replace, regenerate, expose, or repair the key unless the user explicitly asks; replacing it changes the agent identity.

### `REGISTRATION_LOOKUP_FAILED`

The CLI could not check AgentBook. Retry when connectivity is available. If authentication remains unavailable and the service requires payment, continue with the normal x402 payment flow.

### `INVALID_AGENTKIT_PAYLOAD`

Confirm that the complete top-level `{ "agentkit": ... }` wrapper was passed unchanged. The managed CLI identity is an EOA and requires at least one supported `eip155:*`/`eip191` entry; an `eip1271`-only challenge cannot be used by this CLI.

Fetch a fresh 402 challenge if the nonce, timestamps, or payload may be stale. Do not attempt to recreate the SIWE message manually.

### `SIGNING_FAILED`

Report the signing failure and retry once with a fresh challenge. Never ask the user to paste the private key.

### Server rejects the authorization

Fetch a new 402 response and retry once with its new AgentKit payload. Challenges are short-lived and must not be cached or reused. If the fresh proof is also rejected and the service still requires payment, continue with the normal x402 payment flow.
