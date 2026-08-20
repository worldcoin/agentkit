# AgentKit x402 Extension

Add proof-of-personhood access policies to x402 resources. A registered agent signs its request with an RFC 9421 HTTP message signature, the server verifies the signature through the canonical AgentBook on World Chain, and the access policy is applied per human.

## Install

```bash
npm install @worldcoin/agentkit
```

For local agent registration:

```bash
npx @worldcoin/agentkit-cli register
```

## Access modes

| Mode         | Behavior                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `free`       | Registered agents bypass payment.                                                                 |
| `free-trial` | The first N requests per human and endpoint bypass payment.                                       |
| `discount`   | Registered agents may pay a configured percentage less, optionally for only the first N requests. |

`free-trial` and `discount` require an `AgentKitStorage` implementation. Usage is keyed by the AgentBook nullifier, so multiple registered agents belonging to one human share the same allowance.

## Request flow

1. The client calls the protected resource normally.
2. The server returns `402 Payment Required` with `extensions.agentkit`.
3. The client signs the request under the AgentKit RFC 9421 profile — binding the method, host, path, query string, a digest of the normalized body, a five-minute validity window, and a single-use nonce — then retries with the `Signature-Input`, `Signature`, and `Content-Digest` headers.
4. The server calls Core's `verify(request)`, which rebuilds the signature base from the request it actually received, recovers the signer, and resolves its human nullifier from AgentBook on World Chain.
5. The hooks record the nonce, then grant access, consume a trial use, or prepare a discounted payment according to the configured mode.

The `agentkit` string is the lowercase x402 extension key. The request carries the standard RFC 9421 headers `Signature-Input` and `Signature` (labeled `agentkit`) plus `Content-Digest`.

## Client

`createAgentkitClient` wraps `fetch`. It tries AgentKit once when a 402 response advertises the extension, then returns the retry response to the caller. It does not create or settle x402 payments.

```typescript
import { createAgentkitClient } from '@worldcoin/agentkit'

const agentkit = createAgentkitClient({
	signer: {
		address: agentWallet.address,
		signMessage: message => agentWallet.signMessage({ message }),
	},
})

const response = await agentkit.fetch('https://api.example.com/data', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({ query: 'weather', city: 'Lisbon' }),
})
```

For JSON, the wrapper parses and serializes the body once, signs that compact representation, and transmits the same representation on the retry. Bodyless requests sign the empty string.

The built-in x402 adapters expose parsed JSON rather than raw request bytes. The portable hooks path therefore supports bodyless and JSON requests. For text, form, multipart, binary, or any route that must authenticate the original wire representation, call `verify(request)` in framework-level middleware while the original Web `Request` is available.

### Custom clients

`createHeaders({ method, url, body })` returns the three signature headers to place on the request:

```typescript
const body = { query: 'weather', city: 'Lisbon' }
const signatureHeaders = await agentkit.createHeaders({ method: 'POST', url, body })

const response = await fetch(url, {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		...signatureHeaders,
	},
	body: JSON.stringify(body),
})
```

When using `createHeaders` directly, the request must use the exact method and URL that were signed, and the sent body must match `normalizeAgentkitBody(body)` exactly. Signed headers expire after five minutes and are single-use — create fresh headers for every request.

## Server hooks

The hooks integrate with `x402HTTPResourceServer` and, for discounts, the facilitator client.

```typescript
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { HTTPFacilitatorClient } from '@x402/core/http'
import { ExactEvmScheme } from '@x402/evm/exact/server'
import { paymentMiddlewareFromHTTPServer, x402HTTPResourceServer, x402ResourceServer } from '@x402/hono'
import {
	InMemoryAgentKitStorage,
	agentkitResourceServerExtension,
	createAgentkitHooks,
	declareAgentkitExtension,
} from '@worldcoin/agentkit'

const NETWORK = 'eip155:8453'
const facilitator = new HTTPFacilitatorClient({ url: 'https://x402.org/facilitator' })
const resourceServer = new x402ResourceServer(facilitator)
	.register(NETWORK, new ExactEvmScheme())
	.registerExtension(agentkitResourceServerExtension)

const hooks = createAgentkitHooks({
	mode: { type: 'free-trial', uses: 3 },
	storage: new InMemoryAgentKitStorage(),
})

if (hooks.verifyFailureHook) facilitator.onVerifyFailure(hooks.verifyFailureHook)

const routes = {
	'GET /data': {
		accepts: [
			{
				scheme: 'exact',
				price: '$0.01',
				network: NETWORK,
				payTo: '0xYourAddress',
			},
		],
		extensions: declareAgentkitExtension({
			mode: { type: 'free-trial', uses: 3 },
		}),
	},
}

const httpServer = new x402HTTPResourceServer(resourceServer, routes).onProtectedRequest(hooks.requestHook)
const app = new Hono()

app.use(paymentMiddlewareFromHTTPServer(httpServer))
app.get('/data', c => c.json({ message: 'Protected content' }))

serve({ fetch: app.fetch, port: 4021 })
```

The payment network can be any network supported by the configured x402 scheme and facilitator. AgentBook lookup is independent of it and always uses the canonical World Chain deployment.

### Free access

```typescript
const hooks = createAgentkitHooks({ mode: { type: 'free' } })
```

No storage is required.

### Free trial

```typescript
const hooks = createAgentkitHooks({
	mode: { type: 'free-trial', uses: 5 },
	storage: new InMemoryAgentKitStorage(),
})
```

Use persistent, atomic storage in production. `InMemoryAgentKitStorage` is intended for examples and single-process development.

### Discount

```typescript
const hooks = createAgentkitHooks({
	mode: { type: 'discount', percent: 50, uses: 10 },
	storage: new InMemoryAgentKitStorage(),
})

facilitator.onVerifyFailure(hooks.verifyFailureHook!)
```

The payment must come from the same address that signed the AgentKit body. Discount mode requires control of the facilitator hook path; it cannot be implemented only at the resource server.

## Direct framework verification

When the framework exposes the original Fetch `Request`, use Core directly for exact-byte verification:

```typescript
import { verify } from '@worldcoin/agentkit-core'

export async function POST(request: Request) {
	const humanId = await verify(request)
	const body = await request.json()

	return Response.json({ humanId, body })
}
```

`verify` clones the request, so the handler can still read the original body. This is the preferred path for non-JSON bodies and for applications that cannot accept JSON normalization.

## API reference

### `declareAgentkitExtension(options?)`

Creates the `agentkit` extension declaration for a route.

| Option | Type           | Description                               |
| ------ | -------------- | ----------------------------------------- |
| `mode` | `AgentkitMode` | Access mode included in the 402 response. |

### `agentkitResourceServerExtension`

Register this with `x402ResourceServer.registerExtension(...)`. It adds the public AgentKit extension data to 402 responses and removes the declaration's private options.

### `createAgentkitClient(options)`

| Option    | Type                                                                  | Description                                     |
| --------- | ---------------------------------------------------------------------- | ------------------------------------------------ |
| `signer`  | `{ address: string; signMessage(message: string): Promise<string> }` | Agent address and EIP-191 signer.               |
| `fetch`   | `typeof fetch`                                                        | Optional underlying fetch implementation.       |
| `onEvent` | `(event: AgentkitFetchEvent) => void`                                 | Optional client event callback.                 |

Returns:

| Field                                | Description                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `fetch`                              | Fetch-compatible function that retries AgentKit-enabled 402 responses once.                     |
| `createHeaders({ method, url, body })` | Signs the request under the AgentKit RFC 9421 profile and returns the three signature headers. |

### `createAgentkitHooks(options)`

| Option    | Type                                 | Description                               |
| --------- | ------------------------------------ | ----------------------------------------- |
| `mode`    | `AgentkitMode`                       | Defaults to `{ type: "free" }`.           |
| `storage` | `AgentKitStorage`                    | Required for `free-trial` and `discount`. |
| `onEvent` | `(event: AgentkitHookEvent) => void` | Optional server event callback.           |

Returns `requestHook` and, only for discount mode, `verifyFailureHook`.

### `AgentKitStorage`

```typescript
interface AgentKitStorage {
	tryIncrementUsage(endpoint: string, humanId: string, limit: number): Promise<boolean>

	hasUsedNonce?(nonce: string): Promise<boolean>
	recordNonce?(nonce: string): Promise<void>
}
```

The check and increment must be atomic. When both nonce methods are implemented, the hooks reject any signature whose nonce was already recorded, making every signed request single-use. Production implementations should make the nonce check-and-record atomic (e.g. Redis `SET NX EX 300`) and expire entries with a TTL of at least the 300-second signature window. Without nonce storage, replays of a captured signature are only bounded by the five-minute validity window.

### Body helpers

- `normalizeAgentkitBody(body)` converts a parsed body to the UTF-8 text used for signing.
- `normalizeAgentkitRequestBody(request)` reads and normalizes a client's Fetch request body.
- `AGENTKIT` is the x402 extension key, `agentkit`.
- `AGENTKIT_SIGNATURE_INPUT_HEADER`, `AGENTKIT_SIGNATURE_HEADER`, and `AGENTKIT_CONTENT_DIGEST_HEADER` are the request header names `Signature-Input`, `Signature`, and `Content-Digest`.

## Security considerations

- The signature binds the method, host, path, query string, a digest of the normalized body, a five-minute validity window, and a nonce. The server rebuilds every covered component from the request it actually received, so a signature cannot be replayed against a different service, endpoint, or payload.
- Provide storage with nonce methods to make signatures single-use. Without it, an identical request can be replayed for up to five minutes.
- Core uses recoverable EIP-191 EOA signatures over the RFC 9421 signature base, and the recovered signer must match the `keyid` address. Smart-contract and counterfactual-wallet signatures are not yet supported.
- The signature binds `@authority`, so the URL the server verifies against must reflect the public host. Behind a proxy, make sure the framework applies `X-Forwarded-Host` (or equivalent) before the hook reads the request URL.
- AgentBook is queried on World Chain for every verification, so registration state is not selected by the x402 payment network.
- JSON normalization is part of the x402 hooks contract. A custom client must sign and send the same normalized representation.
- Trial and discount storage must be atomic and persistent in production.

## Troubleshooting

### Signature verification fails

- Confirm all three headers are present: `Signature-Input`, `Signature`, and `Content-Digest`.
- Confirm the headers were copied unmodified and the signature has not expired (five-minute window) or been used before.
- Confirm the retry uses the exact method and URL (including the query string) that were signed.
- Confirm the retried body is the same normalized body that was signed.
- Behind a proxy, confirm the server sees the public host the client signed, not an internal one.
- For the hooks path, use an empty or JSON request body.

### AgentBook lookup fails

- Confirm the signing identity completed `agentkit register`.
- Confirm the service can reach World Chain.
- Confirm the identity is registered in the canonical AgentBook deployment.

### AgentKit retry still returns 402

- Check whether the free-trial or discount allowance is exhausted.
- Check the hook event callback for `agent_not_verified` or `validation_failed`.
- If AgentKit is unavailable, continue with the normal x402 payment flow.
