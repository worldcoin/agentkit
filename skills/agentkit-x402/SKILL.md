---
name: agentkit-x402
description: Use when an HTTP 402 Payment Required response contains an `agentkit` extension. Sign the request body with the AgentKit CLI, retry with the hexadecimal signature in `AgentKit`, interpret free, free-trial, and discount modes, and fall back to x402 payment only when AgentKit access is unavailable.
---

# Authenticate to x402 with AgentKit

## Always try AgentKit before paying

When an HTTP request returns `402 Payment Required`, inspect the response's `extensions` object. Attempt AgentKit authentication whenever `extensions.agentkit` is present.

Fall back to the normal x402 payment flow only when:

- the response has no `agentkit` extension;
- `agentkit prove` cannot authenticate this agent;
- the service rejects the signature; or
- free-trial or discount access is exhausted.

The lowercase `agentkit` name is only the x402 extension key. Never send it as the authentication header. The request header is `AgentKit`.

Do not read or request a private key. Do not construct signatures manually. The AgentKit CLI loads the managed identity, confirms that it is registered, and signs the body.

## Authenticate the request

### 1. Prepare the body that will be retried

The signature covers the request body, so the body passed to `agentkit prove` and the body sent on the retry must be identical UTF-8 text.

- For a request with no body, use the empty string.
- For JSON, parse it and serialize it once as compact JSON. Use that exact compact JSON for both signing and the retry. Do not pretty-print or reorder it afterward.
- The portable x402 hooks flow supports bodyless and JSON requests. Use plain text only when the service explicitly documents exact-body AgentKit support outside the standard x402 hooks.
- Do not use the CLI flow for arbitrary text, binary, multipart, or form-encoded bodies when the service's body handling is unknown. Use an AgentKit-aware framework integration or continue with the normal x402 payment flow.

Example compact JSON body:

```text
{"query":"weather","city":"Lisbon"}
```

### 2. Ask the CLI to sign that exact body

Pass the body as the single argument:

```bash
agentkit prove '<exact-request-body>'
```

For a bodyless request:

```bash
agentkit prove ''
```

If the CLI is not installed globally:

```bash
npx @worldcoin/agentkit-cli prove '<exact-request-body>'
```

The command:

- loads the existing AgentKit identity without creating a key;
- checks that its address is registered in AgentBook; and
- returns a `signature` field containing a hexadecimal EIP-191 signature.

Use the returned `signature` directly. It is already the complete `AgentKit` header value. Do not encode, decode, wrap, or edit it.

### 3. Retry the original request

Repeat the request with the same method, URL, prepared body, and other headers, adding:

```text
AgentKit: <signature returned by agentkit prove>
```

The retried body must be byte-for-byte identical to the body given to `prove`. In particular, if JSON was compacted before signing, send that compact form on the retry.

If the service grants access, return the resource without paying. If it responds with another 402, interpret the access mode before deciding whether to pay.

## Handle access modes

Read `extensions.agentkit.mode` when present:

| Mode         | Behavior                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `free`       | Retry with `AgentKit` and no payment.                                                                                                       |
| `free-trial` | Retry with `AgentKit` and no payment until the service reports that the per-human allowance is exhausted. Then use the normal payment flow. |
| `discount`   | Keep `AgentKit` on the request and use the normal x402 payment flow with the discounted amount advertised by the service.                   |

If no mode is present, try `AgentKit` without payment first.

## Recover from errors

### `KEY_NOT_FOUND`

No local AgentKit identity exists. Run:

```bash
agentkit register
```

Registration creates the local identity, checks AgentBook, and starts World ID verification only when needed. Human action may be required. After registration completes, retry `prove` with the same prepared request body.

### `AGENT_NOT_REGISTERED`

The existing identity has not been registered. Run `agentkit register`, complete World ID verification, then run `prove` again.

### `IDENTITY_LOAD_FAILED`

The local key is inaccessible or invalid. Report the error. Do not replace, regenerate, expose, or repair the key unless the user explicitly asks; replacing it changes the agent identity.

### `REGISTRATION_LOOKUP_FAILED`

The CLI could not check AgentBook. Retry when connectivity is available. If authentication remains unavailable and the service requires payment, continue with the normal x402 payment flow.

### `SIGNING_FAILED`

Report the signing failure and retry once. Never ask the user to paste the private key.

### Server rejects the signature

First verify that the retry used `AgentKit`, not `agentkit`, and that its body exactly matches the body passed to `prove`. Recreate the signature after any body change. If a second correctly signed retry is rejected and the service still requires payment, continue with the normal x402 payment flow.
