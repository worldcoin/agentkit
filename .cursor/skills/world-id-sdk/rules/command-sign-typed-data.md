---
title: Sign Typed Data Command
category: commands
tags: sign-typed-data, eip-712, typed-data, signature
---

## Sign Typed Data Command

Sign EIP-712 typed data payloads with the user's wallet. Used for structured data signing with type safety.

## When to Use

- Signing structured data (EIP-712)
- Type-safe message signing
- Complex authentication flows
- DeFi protocol interactions
- Smart contract interactions requiring typed data

**Example Use Cases:**

- Signing orders for DEX
- Authenticating structured requests
- DeFi protocol interactions
- Complex authentication schemes
- Type-safe message signing

## API

### Input

```tsx
export type SignTypedDataCommandInput = {
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: string
  }
  types: Record<string, Array<{ name: string; type: string }>>
  primaryType: string
  message: Record<string, unknown>
}
```

### Output

```tsx
type MiniAppSignTypedDataSuccessPayload = {
  status: 'success'
  signature: string
  address: string
}

type MiniAppSignTypedDataErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Verify signature in backend before trusting it
- **DO**: Use proper EIP-712 domain structure
- **DO**: Define types correctly
- **DO**: Verify signature matches typed data and address
- **DO**: Handle user cancellations gracefully

## DONTs

- **DON'T**: Trust frontend signature responses - always verify in backend
- **DON'T**: Use signatures without verification
- **DON'T**: Skip signature validation
- **DON'T**: Modify typed data after signing

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleSignTypedData = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const typedData = {
    domain: {
      name: 'MyApp',
      version: '1',
      chainId: 1,
      verifyingContract: '0x...',
    },
    types: {
      Message: [
        { name: 'content', type: 'string' },
        { name: 'timestamp', type: 'uint256' },
      ],
    },
    primaryType: 'Message',
    message: {
      content: 'Hello World',
      timestamp: Date.now(),
    },
  }

  const { finalPayload } = await MiniKit.commandsAsync.signTypedData(typedData)

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    toast.error('Signing failed')
    return
  }

  // Verify signature in backend
  const verifyResponse = await fetch('/api/auth/verify-typed-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      signature: finalPayload.signature,
      typedData,
      address: finalPayload.address,
    }),
  })
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppSignTypedDataPayload } from '@worldcoin/minikit-js'

// Send command
const handleSignTypedData = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.signTypedData({
    domain: {
      /* ... */
    },
    types: {
      /* ... */
    },
    primaryType: 'Message',
    message: {
      /* ... */
    },
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppSignTypedData,
    async (response: MiniAppSignTypedDataPayload) => {
      if (response.status === 'error') {
        return
      }

      // Verify signature
      await fetch('/api/auth/verify-typed-data', {
        method: 'POST',
        body: JSON.stringify({
          signature: response.signature,
          address: response.address,
        }),
      })
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppSignTypedData)
  }
}, [])
```

## References

- [World Mini Apps - Sign Typed Data](https://docs.world.org/mini-apps/commands/sign-typed-data)
- [EIP-712 Specification](https://eips.ethereum.org/EIPS/eip-712)
