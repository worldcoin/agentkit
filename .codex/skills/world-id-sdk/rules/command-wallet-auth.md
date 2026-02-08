---
title: Wallet Auth Command
category: commands
tags: wallet-auth, authentication, siwe, sign-in-with-ethereum
---

## Wallet Auth Command

Authenticate users via Sign in with Ethereum (SIWE). This command allows users to sign a message with their wallet to authenticate.

## When to Use

- Implementing wallet-based authentication
- Sign in with Ethereum flows
- User authentication with crypto wallets
- Linking wallet addresses to user accounts
- Building decentralized authentication

**Example Use Cases:**

- Login with wallet
- Connect wallet to account
- Verify wallet ownership
- Decentralized identity authentication

## API

### Input

```tsx
export type WalletAuthCommandInput = {
  nonce: string // Unique nonce from your backend
}
```

### Output

```tsx
type MiniAppWalletAuthSuccessPayload = {
  status: 'success'
  address: string
  signature: string
  message: string
  version: number
}

type MiniAppWalletAuthErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Generate unique nonce from backend for each auth attempt
- **MUST**: Verify signature in backend before authenticating user
- **MUST**: Check nonce hasn't been used before (prevent replay attacks)
- **DO**: Use secure nonce generation (cryptographically random)
- **DO**: Include expiration time in SIWE message
- **DO**: Verify message format matches expected structure
- **DO**: Handle user cancellations gracefully

## DONTs

- **DON'T**: Trust frontend signature responses - always verify in backend
- **DON'T**: Reuse nonces across authentication attempts
- **DON'T**: Skip signature verification
- **DON'T**: Accept signatures without validating message content
- **DON'T**: Store sensitive auth data in frontend

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handleWalletAuth = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  // Get nonce from backend
  const { nonce } = await fetchNonce()
  if (!nonce) {
    console.error('No nonce found')
    return
  }

  const { finalPayload: walletAuthPayload } = await MiniKit.commandsAsync.walletAuth({
    nonce,
  })

  if (walletAuthPayload.status === 'error') {
    if (walletAuthPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    console.warn(`walletAuth: ${walletAuthPayload.error_code}`)
    return
  }

  // Verify signature in backend
  const authResponse = await fetch('/api/auth/siwe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...walletAuthPayload,
      nonce,
    }),
  })

  const authResult = await authResponse.json()
  if (authResult.success) {
    // User authenticated
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppWalletAuthPayload } from '@worldcoin/minikit-js'

// Send command
const handleWalletAuth = async () => {
  if (!MiniKit.isInstalled()) return

  const { nonce } = await fetchNonce()
  MiniKit.commands.walletAuth({ nonce })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppWalletAuth,
    async (response: MiniAppWalletAuthPayload) => {
      if (response.status === 'error') {
        return
      }

      // Verify in backend
      const authResponse = await fetch('/api/auth/siwe', {
        method: 'POST',
        body: JSON.stringify({
          ...response,
          nonce: await fetchNonce(),
        }),
      })
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppWalletAuth)
  }
}, [])
```

### Backend Verification

```tsx
// app/api/auth/siwe/route.ts
import { completeSiwe } from '@/utils/complete-siwe'

export async function POST(req: NextRequest) {
  const { nonce, address, signature, message, version } = await req.json()

  const { isValid, siweMessageData } = await completeSiwe({
    payload: { address, signature, message, version },
    nonce,
  })

  if (!isValid || !siweMessageData.address) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // Create or update user session
  // Return auth token
  return NextResponse.json({ success: true, address: siweMessageData.address })
}
```

## References

- [World Mini Apps - Wallet Authentication](https://docs.world.org/mini-apps/commands/wallet-auth)
- [Sign in with Ethereum](https://docs.world.org/world-id/sign-in-with-ethereum)
