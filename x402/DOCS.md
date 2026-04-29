# AgentKit Extension

Verify that an agent is backed by a real, World ID-verified human.

## Install

Install the library from npm:

```bash
npm install @worldcoin/agentkit
```

or:

```bash
bun add @worldcoin/agentkit
```

If you also need the registration CLI, install:

```bash
npm install -g @worldcoin/agentkit-cli
```

or run it with:

```bash
npx @worldcoin/agentkit-cli register <agent-address>
```

For the end-user registration flow, see [`../cli/REGISTRATION.md`](../cli/REGISTRATION.md).

## Overview

Services that deal with automated traffic increasingly need to distinguish between "random bot" and "bot acting on behalf of a human". AgentKit solves this by combining the wallet every x402 agent already has with World ID's proof-of-personhood and an on-chain agent registry (the AgentBook).

- Agents register in the AgentBook smart contract using a World ID proof, tying their wallet address to an anonymous human identifier
- When accessing a protected resource, agents sign a CAIP-122 challenge with their wallet
- The server verifies the signature, looks up the agent's human identifier in the AgentBook, and applies the configured access policy
- Usage limits are tracked per human, not per agent, allowing for multiple agents to share a single human-backed identity

This is a **Server ↔ Client** extension. The Facilitator is not involved in identity verification itself, but `discount` mode still requires wiring `verifyFailureHook` into the payment flow.

## Access Modes

AgentKit supports three configurable modes that control what happens when a human-backed agent is identified:

| Mode         | Behavior                                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------- |
| `free`       | Human-backed agents always bypass payment.                                                                 |
| `free-trial` | Human-backed agents bypass payment the first N times (default: 1). After that, normal payment is required. |
| `discount`   | Human-backed agents get a N% discount (optionally, only for the first N times).                            |

Usage counters are tracked per **human** per **endpoint** — so two agents backed by the same human share the same counter.

## How It Works

1. Client requests a protected resource
2. Server responds with `402 Payment Required`, including the `agentkit` extension with a CAIP-122 challenge (nonce, domain, supported chains, mode)
3. Client signs the challenge with their wallet and sends it via the `agentkit` HTTP header
4. Server validates the signature, recovers the wallet address, and looks up the human identifier in the AgentBook
5. If the agent is registered and the access mode allows it, access is granted or a discount is applied. Otherwise, the standard payment flow continues.

## Agent Client Usage

If you are building an agent that calls paid x402 APIs, wrap the agent's HTTP client with `createAgentkitFetch`. The wrapper retries AgentKit-enabled 402 responses with a signed `agentkit` header before your normal x402 payment fallback runs.

```typescript
import { createAgentkitFetch } from '@worldcoin/agentkit'

const fetchWithAgentkit = createAgentkitFetch({
	signer: {
		address: agentWallet.address,
		chainId: 'eip155:8453',
		type: 'eip191',
		signMessage: message => agentWallet.signMessage(message),
	},
})

const response = await fetchWithAgentkit('https://api.example.com/data')
```

The wrapper does not create payments. If AgentKit is unavailable, fails, or is exhausted, it returns the original 402 response so your existing x402 client can pay normally.

### Framework Examples

You do not need separate framework packages for V1. Use the same helper where your framework makes HTTP calls:

```typescript
// Vercel AI SDK / OpenAI Agents SDK tool body
const response = await fetchWithAgentkit(url, requestInit)
```

```typescript
// LangChain or LangGraph tool
const callPaidApi = tool(async ({ url }) => fetchWithAgentkit(url), {
	name: 'call_paid_api',
	description: 'Call paid APIs; AgentKit verification is attempted before x402 payment.',
})
```

```typescript
// Coinbase AgentKit custom action
const action = async ({ url }) => fetchWithAgentkit(url)
```

For Hermes, Codex, Claude Code, and other local agents, either call code that uses `createAgentkitFetch` or install the `agentkit-x402` skill so the agent knows to attempt AgentKit before payment when it cannot change the HTTP client.

## Server Usage

AgentKit is published as `@worldcoin/agentkit` and is intended to be consumed as a normal npm package in your server application.

### Hooks (Recommended)

The hooks-based approach handles challenge generation, signature verification, and AgentBook lookups automatically.

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import { HTTPFacilitatorClient, RouteConfig } from '@x402/core/http'
import { paymentMiddlewareFromHTTPServer, x402ResourceServer, x402HTTPResourceServer } from '@x402/hono'
import {
	declareAgentkitExtension,
	agentkitResourceServerExtension,
	createAgentkitHooks,
	createAgentBookVerifier,
	InMemoryAgentKitStorage,
} from '@worldcoin/agentkit'

const NETWORK = 'eip155:8453' // Base
const payTo = '0xYourAddress'

const agentBook = createAgentBookVerifier()
const storage = new InMemoryAgentKitStorage()

const hooks = createAgentkitHooks({
	storage,
	agentBook,
	mode: { type: 'free-trial', uses: 3 },
})

const facilitatorClient = new HTTPFacilitatorClient({
	url: 'https://x402.org/facilitator',
})

const resourceServer = new x402ResourceServer(facilitatorClient)
	.register(NETWORK, new ExactEvmScheme())
	.registerExtension(agentkitResourceServerExtension)

// Register the verify failure hook on the facilitator (required for discount mode)
if (hooks.verifyFailureHook) {
	facilitatorClient.onVerifyFailure(hooks.verifyFailureHook)
}

const routes = {
	'GET /data': {
		accepts: [
			{
				scheme: 'exact',
				price: '$0.01',
				network: NETWORK,
				payTo,
			},
		],
		extensions: declareAgentkitExtension({
			statement: 'Verify your agent is backed by a real human',
			mode: { type: 'free-trial', uses: 3 },
		}),
	},
}

const httpServer = new x402HTTPResourceServer(resourceServer, routes).onProtectedRequest(hooks.requestHook)

const app = new Hono()
app.use(paymentMiddlewareFromHTTPServer(httpServer))

app.get('/data', c => {
	return c.json({ message: 'Protected content' })
})

serve({ fetch: app.fetch, port: 4021 })
```

If your paid route runs on World Chain (`eip155:480`), add a custom `registerMoneyParser(...)` for World Chain USDC on `ExactEvmScheme`. AgentBook lookup always resolves against the canonical World Chain deployment — your paid route can run on any EVM chain, but the registry check happens on World Chain.

### Mode Examples

In **Free access** mode, human-backed agents never pay:

```typescript
const hooks = createAgentkitHooks({
	agentBook,
	mode: { type: 'free' },
})
```

No storage is needed for this mode.

In **Free trial** mode, the first N uses are free per human per endpoint:

```typescript
const hooks = createAgentkitHooks({
	agentBook,
	mode: { type: 'free-trial', uses: 5 },
	storage: new InMemoryAgentKitStorage(),
})
```

If Alice has two agents and uses 3 of her 5 free uses with Agent A, Agent B gets 2 remaining.

In **Discount** mode, human-backed agents get N% off the first N times:

```typescript
const hooks = createAgentkitHooks({
	agentBook,
	mode: { type: 'discount', percent: 50, uses: 10 },
	storage: new InMemoryAgentKitStorage(),
})

// IMPORTANT: register the verify failure hook on the facilitator for discount mode
facilitatorClient.onVerifyFailure(hooks.verifyFailureHook!)
```

The client pays the discounted price. Payment verification fails (amount too low), but the `onVerifyFailure` hook on the facilitator recovers it by confirming the agent is human-backed with remaining discount uses, then adjusting the required amount so settlement re-verification passes.

### Smart Wallet Support (EIP-1271 / EIP-6492)

Signature verification automatically handles both smart contract wallets (ERC-1271) and EOA wallets (ecrecover). Smart wallets like Safe, Coinbase Smart Wallet, and CDP wallets work out of the box with no additional configuration. A public client is created internally from the chain ID to make the on-chain `isValidSignature` call when needed.

To use a custom RPC endpoint instead of the chain's default public RPC:

```typescript
const hooks = createAgentkitHooks({
	agentBook,
	mode: { type: 'free' },
	rpcUrl: 'https://your-rpc-endpoint.com',
})
```

### Custom AgentBook Configuration

`createAgentBookVerifier()` always resolves against the canonical AgentBook deployment on World Chain (`eip155:480`). You do not need to pass a chain ID — the registry lives on one chain and lookup happens there regardless of which chain the agent signed on or which chain your paid route runs on. The caller side stays fully chain‑agnostic.

```typescript
// Default — queries the canonical AgentBook on World Chain
const agentBook = createAgentBookVerifier()

// Use a custom World Chain RPC endpoint
const agentBook = createAgentBookVerifier({
	rpcUrl: 'https://your-world-chain-rpc.example',
})

// Point at a custom contract (e.g. staging/testnet), still on World Chain RPC
const agentBook = createAgentBookVerifier({
	contractAddress: '0xYourCustomContract',
})

// Advanced: inject a fully custom viem client (useful for tests or non-standard setups)
import { worldchain } from 'viem/chains'
import { createPublicClient, http } from 'viem'

const agentBook = createAgentBookVerifier({
	client: createPublicClient({ chain: worldchain, transport: http() }),
})
```

### Manual Usage (Advanced)

For custom flows, use the low-level functions directly:

```typescript
import {
	declareAgentkitExtension,
	parseAgentkitHeader,
	validateAgentkitMessage,
	verifyAgentkitSignature,
	createAgentBookVerifier,
	AGENTKIT,
} from '@worldcoin/agentkit'

// Include in 402 response
const extensions = declareAgentkitExtension({
	domain: 'api.example.com',
	resourceUri: 'https://api.example.com/data',
	network: 'eip155:8453',
	statement: 'Verify your agent is backed by a real human',
})

const agentBook = createAgentBookVerifier()

// Process incoming authentication
async function handleRequest(request: Request) {
	const header = request.headers.get('agentkit')
	if (!header) return

	const payload = parseAgentkitHeader(header)

	const validation = await validateAgentkitMessage(payload, 'https://api.example.com/data')
	if (!validation.valid) {
		return { error: validation.error }
	}

	const verification = await verifyAgentkitSignature(payload)
	if (!verification.valid) {
		return { error: verification.error }
	}

	// Look up the human behind this agent (always resolves against World Chain AgentBook)
	const humanId = await agentBook.lookupHuman(verification.address!)
	if (!humanId) {
		return { error: 'Agent is not registered in the AgentBook' }
	}

	// humanId is the anonymous human identifier
	// Apply your own access policy based on this
}
```

## EVM Network Support

Servers can accept authentication on any EVM network expressed as a CAIP-2 chain ID:

```typescript
const routes = {
	'GET /data': {
		accepts: [
			{
				scheme: 'exact',
				price: '$0.01',
					network: 'eip155:8453', // Base
					payTo: '0xYourEVMAddress',
				},
			],
			extensions: declareAgentkitExtension({
				network: 'eip155:8453',
				statement: 'Verify your agent is backed by a real human',
			}),
		},
}
```

## Supported Chains

- **Chain ID format:** `eip155:*` (e.g., `eip155:8453` for Base)
- **Signature type:** `eip191`
- **Signature schemes:** `eip191` (EOA, default), `eip1271` (smart contract), `eip6492` (counterfactual)
- **Message format:** EIP-4361 (SIWE)

## API Reference

### `declareAgentkitExtension(options?)`

Configures the extension for 402 responses. Most parameters are auto-derived from request context when using `agentkitResourceServerExtension`.

| Parameter           | Type                 | Description                                               |
| ------------------- | -------------------- | --------------------------------------------------------- |
| `domain`            | `string`             | Server's domain. Auto-derived from request URL.           |
| `resourceUri`       | `string`             | Full resource URI. Auto-derived from request URL.         |
| `network`           | `string \| string[]` | CAIP-2 network(s). Auto-derived from `accepts[].network`. |
| `statement`         | `string`             | Human-readable purpose for signing.                       |
| `version`           | `string`             | CAIP-122 version (default: `"1"`).                        |
| `expirationSeconds` | `number`             | Challenge TTL in seconds.                                 |
| `mode`              | `AgentkitMode`       | Access mode (included in 402 response for clients).       |

### `createAgentkitFetch(options)`

Creates a fetch wrapper that tries AgentKit verification before normal x402 payment.

| Option    | Type                                     | Description                                         |
| --------- | ---------------------------------------- | --------------------------------------------------- |
| `signer`  | `AgentkitSigner`                         | Agent wallet identity and `signMessage` function.   |
| `fetch`   | `typeof fetch`                           | Optional base fetch implementation.                 |
| `onEvent` | `(event: AgentkitFetchEvent) => void`    | Optional callback for logging and debugging.        |

The returned function has the same shape as `fetch`. It only retries when the first response is a 402 with `extensions.agentkit`.

### `createAgentkitHeader(options)`

Creates the base64 `agentkit` HTTP header from an AgentKit extension and signer. Use this for custom HTTP clients that cannot use `createAgentkitFetch`.

### `createAgentkitHooks(options)`

Creates hooks for `x402HTTPResourceServer` and optionally `x402ResourceServer`.

| Option      | Type                                 | Description                                                                                    |
| ----------- | ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `agentBook` | `AgentBookVerifier`                  | AgentBook verifier instance (required).                                                        |
| `mode`      | `AgentkitMode`                       | Access mode (default: `{ type: "free" }`).                                                     |
| `storage`   | `AgentKitStorage`                    | Storage for usage tracking (required for `free-trial` and `discount`).                         |
| `rpcUrl`    | `string`                             | Custom RPC URL for EVM signature verification. Uses the chain's default public RPC if omitted. |
| `onEvent`   | `(event: AgentkitHookEvent) => void` | Callback for logging/debugging.                                                                |

**Returns:**

| Field               | Type                  | Description                                                                      |
| ------------------- | --------------------- | -------------------------------------------------------------------------------- |
| `requestHook`       | function              | Register with `httpServer.onProtectedRequest()`.                                 |
| `verifyFailureHook` | function \| undefined | Register with `facilitator.onVerifyFailure()`. Only present for `discount` mode. |

### `AgentkitMode`

| Mode         | Fields                                                 | Description                                    |
| ------------ | ------------------------------------------------------ | ---------------------------------------------- |
| `free`       | `{ type: "free" }`                                     | Always bypass payment for human-backed agents. |
| `free-trial` | `{ type: "free-trial"; uses?: number }`                | Bypass payment the first N times (default: 1). |
| `discount`   | `{ type: "discount"; percent: number; uses?: number }` | N% discount the first N times.                 |

### `createAgentBookVerifier(options?)`

Creates a verifier that looks up agent wallet addresses in the canonical AgentBook contract on World Chain (`eip155:480`). Lookup always resolves against World Chain — the verifier is chain‑agnostic from the caller's perspective, regardless of which chain the agent's signature was produced on or which chain your paid route runs on.

| Option            | Type                | Description                                                                                                  |
| ----------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| `rpcUrl`          | `string`            | Custom World Chain RPC URL. Defaults to the chain's default public RPC. Ignored if `client` is provided.     |
| `contractAddress` | `` `0x${string}` `` | Custom AgentBook contract address on World Chain. Defaults to the canonical deployment.                      |
| `client`          | `PublicClient`      | Advanced override — inject a fully custom viem public client (useful for tests or non-standard deployments). |

Returns an object with `lookupHuman(address: string): Promise<string | null>`. Returns the anonymous human identifier (hex string) or `null` if the agent is not registered.

### `AgentKitStorage` / `InMemoryAgentKitStorage`

Storage interface for tracking per-human usage counts.

| Method                                        | Description                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `tryIncrementUsage(endpoint, humanId, limit)` | Atomically increment usage if below `limit`. Returns `true` if incremented, `false` if limit already reached. |
| `hasUsedNonce?(nonce)`                        | Optional: check for replay attacks.                                                                           |
| `recordNonce?(nonce)`                         | Optional: record a used nonce.                                                                                |

`InMemoryAgentKitStorage` is the reference in-memory implementation. For production, implement `AgentKitStorage` with a persistent backend (e.g. using a database transaction with row-level locking).

### `parseAgentkitHeader(header)`

Parses a base64-encoded `agentkit` header into a structured payload object. Throws if the header is malformed or missing required fields.

### `validateAgentkitMessage(payload, resourceUri, options?)`

Validates message fields including domain binding, URI, timestamps, and nonce.

| Option       | Type                         | Description                                        |
| ------------ | ---------------------------- | -------------------------------------------------- |
| `maxAge`     | `number`                     | Max age for `issuedAt` in ms (default: 5 minutes). |
| `checkNonce` | `(nonce: string) => boolean` | Custom nonce validation function.                  |

Returns `{ valid: boolean; error?: string }`.

### `verifyAgentkitSignature(payload, options?)`

Verifies the cryptographic signature and recovers the signer address. EVM verification uses ERC-1271 (smart wallets) with ecrecover fallback (EOA) automatically.

| Option   | Type     | Description                                                                                    |
| -------- | -------- | ---------------------------------------------------------------------------------------------- |
| `rpcUrl` | `string` | Custom RPC URL for EVM signature verification. Uses the chain's default public RPC if omitted. |

Returns `{ valid: boolean; address?: string; error?: string }`.

**Hook events:**

| Event                | Fields                           | Description                                            |
| -------------------- | -------------------------------- | ------------------------------------------------------ |
| `agent_verified`     | `resource`, `address`, `humanId` | Agent is human-backed, access granted.                 |
| `agent_not_verified` | `resource`, `address`            | Valid signature but agent not registered in AgentBook. |
| `validation_failed`  | `resource`, `error`              | Signature or message validation failed.                |
| `discount_applied`   | `resource`, `address`, `humanId` | Discount mode: payment recovered at discounted rate.   |
| `discount_exhausted` | `resource`, `address`, `humanId` | Discount mode: no more discounted uses remaining.      |

## Security Considerations

- **Domain binding**: The signed message includes the server's domain, preventing signature reuse across services.
- **Nonce uniqueness**: A fresh nonce is generated per request to prevent replay attacks.
- **Temporal bounds**: `issuedAt` must be recent (default: 5 minutes) and `expirationTime` must be in the future.
- **Chain-specific verification**: Signatures are verified using chain-appropriate methods, preventing cross-chain reuse.
- **Smart wallet support**: EVM verification automatically supports both smart contract wallets (ERC-1271) and EOA wallets via RPC calls to the chain.
- **On-chain verification**: AgentBook lookups happen at request time, so revoked registrations take effect immediately.
- **Per-human tracking**: Usage limits are tracked by anonymous human identifier, not by wallet address. Multiple agents controlled by one person share a single counter.

## Troubleshooting

### Signature verification fails

- Verify the client is signing with the correct wallet
- Check the signature scheme matches (EIP-191 for EOA, EIP-1271 for smart wallets)
- If using a custom `rpcUrl`, ensure it points to the correct chain
- Confirm the chain ID is consistent between client and server

### Message validation fails

- Check that `issuedAt` is recent (within 5 minutes by default)
- Verify `expirationTime` is in the future
- Ensure the `domain` matches the server's hostname
- Confirm the `uri` starts with the server's origin

### AgentBook lookup returns null

- Verify the agent wallet has been registered in the AgentBook with a valid World ID proof
- Ensure the World Chain RPC endpoint is reachable (or your custom `rpcUrl` if one was provided)
- If you overrode `contractAddress`, confirm the deployment you're pointing at is the one holding your registration
