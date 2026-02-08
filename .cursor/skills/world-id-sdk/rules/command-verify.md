---
title: Verify Command
category: commands
tags: verify, world-id, proof, incognito-action, verification
---

## Verify Command

Request a World ID proof using incognito actions. This command lets you gate functionality behind a unique human check, ensuring only verified humans can perform actions.

## When to Use

- Gating features behind human verification
- Preventing bot abuse (e.g., voting, submissions, access)
- Limiting actions per verified user (using action limits)
- Ensuring unique human participation
- Building anti-bot mechanisms

**Example Use Cases:**

- Voting systems that require one vote per human
- Access control for premium features
- Submission limits (e.g., one submission per verified human)
- Bot-free gaming experiences

## API

### Input

```tsx
export type VerifyCommandInput = {
  action: string // Action ID from Developer Portal
  signal?: string // Optional additional data
  verification_level?: VerificationLevel // Default: Orb
}
```

### Output

```tsx
type MiniAppVerifyActionSuccessPayload = {
  status: 'success'
  proof: string
  merkle_root: string
  nullifier_hash: string
  verification_level: VerificationLevel
  version: number
}

type MiniAppVerifyActionErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Create incognito action in Developer Portal first
- **MUST**: Verify the proof in your backend before trusting it
- **MUST**: Check `nullifier_hash` uniqueness to prevent double-use
- **DO**: Use meaningful action IDs (e.g., 'voting-action', 'access-premium')
- **DO**: Include signal data for additional context if needed
- **DO**: Handle user cancellations gracefully
- **DO**: Set appropriate action limits in Developer Portal

## DONTs

- **DON'T**: Trust frontend proof responses - always verify in backend
- **DON'T**: Skip nullifier_hash uniqueness checks
- **DON'T**: Use the same action ID for different features
- **DON'T**: Process actions before backend verification succeeds
- **DON'T**: Expose APP_ID in frontend code

## Examples

### Async Pattern

```tsx
import { MiniKit, VerifyCommandInput, VerificationLevel } from '@worldcoin/minikit-js'

const handleVerify = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const verifyPayload: VerifyCommandInput = {
    action: 'voting-action', // From Developer Portal
    signal: '0x12312', // Optional
    verification_level: VerificationLevel.Orb, // Orb | Device
  }

  const { finalPayload } = await MiniKit.commandsAsync.verify(verifyPayload)

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled
    }
    console.error('Verify error:', finalPayload.error_code)
    return
  }

  // MUST verify in backend
  const verifyResponse = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: finalPayload,
      action: 'voting-action',
      signal: '0x12312',
    }),
  })

  const verifyResponseJson = await verifyResponse.json()
  if (verifyResponseJson.status === 200) {
    // Verification successful - proceed with action
    console.log('Verification success!')
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppVerifyActionPayload } from '@worldcoin/minikit-js'

// Send command
const handleVerify = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.verify({
    action: 'voting-action',
    verification_level: VerificationLevel.Orb,
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(
    ResponseEvent.MiniAppVerifyAction,
    async (response: MiniAppVerifyActionPayload) => {
      if (response.status === 'error') {
        return
      }

      // Verify in backend
      const verifyResponse = await fetch('/api/verify', {
        method: 'POST',
        body: JSON.stringify({
          payload: response,
          action: 'voting-action',
        }),
      })

      const verifyResponseJson = await verifyResponse.json()
      if (verifyResponseJson.status === 200) {
        // Handle success
      }
    }
  )

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppVerifyAction)
  }
}, [])
```

### Backend Verification

```tsx
// app/api/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCloudProof, ISuccessResult } from '@worldcoin/minikit-js'

export async function POST(req: NextRequest) {
  const { payload, action, signal } = await req.json()
  const app_id = process.env.APP_ID as `app_${string}`

  const verifyRes = await verifyCloudProof(payload, app_id, action, signal)

  if (verifyRes.success) {
    // Check nullifier_hash uniqueness in your database
    // Perform the protected action
    return NextResponse.json({ status: 200 })
  } else {
    return NextResponse.json({ verifyRes, status: 400 })
  }
}
```

## References

- [World Mini Apps - Verify Command](https://docs.world.org/mini-apps/commands/verify)
- [World ID Verification](https://docs.world.org/world-id/verify-proofs)
