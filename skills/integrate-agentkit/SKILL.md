---
name: integrate-agentkit
description: Protect one HTTP endpoint with @worldcoin/agentkit-core. Use this skill when an application must validate AgentKit RFC 9421 request signatures, identify a registered human, or add AgentKit authentication to an API route.
---

# Integrate AgentKit

Protect one HTTP endpoint with AgentKit. Use `@worldcoin/agentkit-core`.

## Select the endpoint

1. Use the endpoint that the user specifies.
2. If the user does not specify an endpoint, inspect the application routes.
3. Select one endpoint that handles the protected action or data.
4. Tell the user which endpoint you selected.

Do not protect all endpoints unless the user requests this change.

Prefer an endpoint that receives a Web `Request`. AgentKit must read the original body bytes.

## Add verification

Install the Core package if the application does not have it:

```bash
npm install @worldcoin/agentkit-core
```

Import `verify` from the package. Call `verify(request)` before you read or change the request body.

```typescript
import { verify } from '@worldcoin/agentkit-core'

const agentkitError = {
	error: 'AGENTKIT_VALIDATION_FAILED',
	message: 'AgentKit validation failed. Read your AgentKit skill for instructions. Then retry this request.',
}

export async function POST(request: Request) {
	let humanId: string

	try {
		humanId = await verify(request)
	} catch {
		return Response.json(agentkitError, { status: 401 })
	}

	const body = await request.json()
	return createReport(body, { humanId })
}
```

Replace `createReport` with the current endpoint logic.

Use the returned nullifier hash as an internal human ID when the access policy needs it. Do not return the nullifier unless the API contract requires it. Do not expose the signer address or private key.

`verify` clones the request. The endpoint can read the body after successful verification.

## Return one safe error

Return status `401` when AgentKit validation fails. Return this message:

```text
AgentKit validation failed. Read your AgentKit skill for instructions. Then retry this request.
```

Use a stable machine code such as `AGENTKIT_VALIDATION_FAILED`.

Do not return the internal verification error. The internal error can contain an address or a network detail. If the application has a server logger, record the internal error there.

## Preserve the signed request

Pass the original request to `verify`. Do not parse, format, or rebuild the body first, and do not rewrite the method, path, query string, or host — the signature binds all of them.

If the framework does not use Web `Request`, capture the exact body before a body parser changes it. Build one Web `Request` with the original method and full URL, those exact body bytes, and the original `Signature-Input`, `Signature`, and `Content-Digest` headers.

Behind a proxy, the URL that `verify` sees must reflect the public host the client signed. Make sure the framework applies `X-Forwarded-Host` (or equivalent) first.

Do not use a parsed JSON object as a replacement for the original body bytes.

For endpoints where a five-minute replay window is unacceptable, use `verifyRequest(request, { checkNonce })` instead of `verify` and back `checkNonce` with a store that records each nonce once (TTL of at least 300 seconds).

## Keep the change local

- Change only the selected endpoint and its direct tests.
- Keep the endpoint's current success response unless the user requests a change.
- Keep all other authentication checks.
- Decide if AgentKit replaces or supplements the existing authentication.
- State that decision in the handoff.

## Verify the result

Test these cases:

1. A request without the `Signature-Input`, `Signature`, and `Content-Digest` headers returns status `401` and the required message.
2. A malformed signature returns the same safe error.
3. An unregistered signer returns the same safe error.
4. A registered signer can use the endpoint.
5. A changed body invalidates the signature.
6. A signature created for a different method, URL, or query string is rejected.
7. An expired signature (older than five minutes) is rejected.
8. The endpoint can read the body after `verify` succeeds.
9. An endpoint outside the selected route stays unchanged.

Run the normal formatter, type checker, and relevant tests for the application.

## Confirm the package contract

Before implementation, confirm that [`../../core/src/index.ts`](../../core/src/index.ts) exports `verify`. Read [`../../core/src/verify.ts`](../../core/src/verify.ts) if the framework needs an adapter.

Do not add a chain option, contract option, or AgentBook client. Core always checks the canonical AgentBook on World Chain.
