---
title: Security Best Practices
category: best-practices
tags: security, verification, backend, validation
---

## Security Best Practices

Critical security guidelines for using MiniKit commands safely in production.

## When to Apply

- Implementing verification flows
- Processing payments
- Handling authentication
- Verifying proofs or signatures
- Building production mini-apps

## DOs

- **MUST**: Always verify sensitive operations in your backend
  - Verify proofs from `verify` command
  - Verify payment confirmations from `pay` command
  - Verify signatures from `walletAuth`, `signMessage`, `signTypedData`
- **MUST**: Use environment variables for sensitive data (APP_ID, secrets)
- **MUST**: Validate all user inputs before sending commands
- **DO**: Use HTTPS for all API communications
- **DO**: Implement rate limiting on backend verification endpoints
- **DO**: Log security events for audit purposes
- **DO**: Use nonces for authentication flows to prevent replay attacks

## DONTs

- **DON'T**: Trust frontend responses for sensitive operations
- **DON'T**: Store sensitive data (secrets, private keys) in frontend code
- **DON'T**: Skip backend verification for verify, pay, or auth commands
- **DON'T**: Expose APP_ID or secrets in client-side code
- **DON'T**: Accept proofs without verifying nullifier_hash uniqueness
- **DON'T**: Process payments without backend confirmation

## Examples

### Backend Verification (Verify Command)

```tsx
// Frontend - app/page.tsx
const { finalPayload } = await MiniKit.commandsAsync.verify({
  action: 'voting-action',
})

if (finalPayload.status === 'error') {
  return
}

// MUST verify in backend
const verifyResponse = await fetch('/api/verify', {
  method: 'POST',
  body: JSON.stringify({
    payload: finalPayload,
    action: 'voting-action',
  }),
})

// Backend - app/api/verify/route.ts
import { verifyCloudProof } from '@worldcoin/minikit-js'

export async function POST(req: NextRequest) {
  const { payload, action } = await req.json()
  const app_id = process.env.APP_ID // From environment, not frontend

  const verifyRes = await verifyCloudProof(payload, app_id, action)

  if (!verifyRes.success) {
    return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
  }

  // Only now perform the protected action
  // e.g., record vote, grant access, etc.
  return NextResponse.json({ success: true })
}
```

### Secure Environment Variables

```tsx
// ❌ DON'T - Exposing secrets in frontend
const APP_ID = 'app_staging_12345' // Visible in client bundle

// ✅ DO - Use environment variables
// .env.local (server-side only)
APP_ID = app_staging_12345
WLD_CLIENT_SECRET = your_secret_here

// app/api/verify/route.ts
const app_id = process.env.APP_ID // Only accessible server-side
```

### Nonce for Authentication

```tsx
// ✅ DO - Use nonces to prevent replay attacks
const { nonce } = await fetchNonce() // Get unique nonce from backend

const { finalPayload } = await MiniKit.commandsAsync.walletAuth({
  nonce, // Include nonce in signature
})

// Backend verifies nonce hasn't been used before
```

## References

- [World Mini Apps - Verify Command](https://docs.world.org/mini-apps/commands/verify)
- [World ID Verification](https://docs.world.org/world-id/verify-proofs)
