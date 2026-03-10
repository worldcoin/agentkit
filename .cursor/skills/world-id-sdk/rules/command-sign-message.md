---
title: Sign Message Command
category: commands
tags: sign-message, signature, authentication, wallet
---

## Sign Message Command

Sign personal messages with the user's wallet. Used for message authentication and proving wallet ownership.

## When to Use

- Proving wallet ownership
- Message authentication
- Non-repudiation of messages
- Custom authentication flows
- Verifying user identity via signed messages

**Example Use Cases:**

- "Sign in with wallet" flows
- Proving ownership of wallet address
- Authenticating API requests
- Message verification
- Custom authentication schemes

## API

### Input

```tsx
export type SignMessageCommandInput = {
  message: string // Message to sign
}
```

### Output

```tsx
type MiniAppSignMessageSuccessPayload = {
  status: 'success'
  signature: string
  message: string
  address: string
}

type MiniAppSignMessageErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Verify signature in backend before trusting it
- **DO**: Use clear, meaningful messages
- **DO**: Include context in message (e.g., timestamp, nonce)
- **DO**: Verify signature matches message and address
- **DO**: Handle user cancellations gracefully

## DONTs

- **DON'T**: Trust frontend signature responses - always verify in backend
- **DON'T**: Use signatures without verification
- **DON'T**: Accept signatures for different messages
- **DON'T**: Skip signature validation

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSignMessage = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const message = `Sign in to MyApp\nTimestamp: ${Date.now()}`

  const { finalPayload } = await MiniKit.commandsAsync.signMessage({
    message,
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    toast.error('Signing failed')
    return
  }

  // Verify signature in backend
  const verifyResponse = await fetch('/api/auth/verify-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature: finalPayload.signature,
      message: finalPayload.message,
      address: finalPayload.address,
    }),
  })

  const verifyResult = await verifyResponse.json()
  if (verifyResult.valid) {
    // Signature verified - authenticate user
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppSignMessagePayload } from '@worldcoin/minikit-js'

// Send command
const handleSignMessage = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.signMessage({
    message: 'Sign in to MyApp',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppSignMessage,
    async (response: MiniAppSignMessagePayload) => {
      if (response.status === 'error') {
        return
      }

      // Verify signature
      await fetch('/api/auth/verify-signature', {
        method: 'POST',
        body: JSON.stringify({
          signature: response.signature,
          message: response.message,
          address: response.address,
        }),
      })
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppSignMessage)
  }
}, [])
```

## References

- [World Mini Apps - Sign Message](https://docs.world.org/mini-apps/commands/sign-message)
