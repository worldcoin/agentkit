---
title: Pay Command
category: commands
tags: pay, payment, wld, usdc, transaction
---

## Pay Command

Request a payment from the user. Supports WLD (Worldcoin) and USDC payments.

## When to Use

- Processing payments in your mini-app
- Accepting WLD or USDC payments
- In-app purchases
- Subscription payments
- Donations or tips
- Payment for services or goods

**Example Use Cases:**

- Pay for premium features
- Purchase in-app items
- Tip creators
- Donate to causes
- Pay for services

## API

### Input

```tsx
export type PayCommandInput = {
  amount: string // Amount as string (e.g., "10.5")
  currency: 'WLD' | 'USDC' // Currency type
  recipient: string // Recipient address
  memo?: string // Optional payment memo
}
```

### Output

```tsx
type MiniAppPaySuccessPayload = {
  status: 'success'
  transaction_hash: string
  amount: string
  currency: 'WLD' | 'USDC'
  recipient: string
}

type MiniAppPayErrorPayload = {
  status: 'error'
  error_code: string
}
```

## DOs

- **MUST**: Verify payment confirmation in backend before fulfilling order
- **MUST**: Check transaction_hash on blockchain to confirm payment
- **DO**: Display clear payment amount and recipient to user
- **DO**: Include memo for payment context if helpful
- **DO**: Handle user cancellations gracefully
- **DO**: Show payment status to user
- **DO**: Verify transaction on blockchain before completing order

## DONTs

- **DON'T**: Trust frontend payment responses - always verify in backend
- **DON'T**: Fulfill orders before blockchain confirmation
- **DON'T**: Skip transaction verification
- **DON'T**: Process payments without backend confirmation
- **DON'T**: Accept payments without verifying transaction_hash

## Examples

### Async Pattern

```tsx
import { MiniKit } from '@worldcoin/minikit-js'

const handlePayment = async () => {
  if (!MiniKit.isInstalled()) {
    return
  }

  const { finalPayload } = await MiniKit.commandsAsync.pay({
    amount: '10.5',
    currency: 'WLD',
    recipient: '0x1234567890123456789012345678901234567890',
    memo: 'Payment for premium feature',
  })

  if (finalPayload.status === 'error') {
    if (finalPayload.error_code === 'user_cancelled') {
      return // User cancelled payment
    }
    toast.error('Payment failed')
    return
  }

  // Verify payment in backend
  const verifyResponse = await fetch('/api/payment/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transaction_hash: finalPayload.transaction_hash,
      amount: finalPayload.amount,
      currency: finalPayload.currency,
    }),
  })

  const verifyResult = await verifyResponse.json()
  if (verifyResult.confirmed) {
    // Payment confirmed - fulfill order
    toast.success('Payment successful!')
  }
}
```

### Event-Based Pattern

```tsx
import { MiniKit, ResponseEvent, MiniAppPayPayload } from '@worldcoin/minikit-js'

// Send command
const handlePayment = () => {
  if (!MiniKit.isInstalled()) return

  MiniKit.commands.pay({
    amount: '10.5',
    currency: 'WLD',
    recipient: '0x1234567890123456789012345678901234567890',
  })
}

// Listen for response
useEffect(() => {
  if (!MiniKit.isInstalled()) return

  MiniKit.subscribe(ResponseEvent.MiniAppPay, async (response: MiniAppPayPayload) => {
    if (response.status === 'error') {
      return
    }

    // Verify payment in backend
    const verifyResponse = await fetch('/api/payment/verify', {
      method: 'POST',
      body: JSON.stringify({
        transaction_hash: response.transaction_hash,
      }),
    })
  })

  return () => {
    MiniKit.unsubscribe(ResponseEvent.MiniAppPay)
  }
}, [])
```

### Backend Verification

```tsx
// app/api/payment/verify/route.ts
export async function POST(req: NextRequest) {
  const { transaction_hash, amount, currency } = await req.json()

  // Verify transaction on blockchain
  const transaction = await verifyTransactionOnChain(transaction_hash)

  if (!transaction || transaction.amount !== amount) {
    return NextResponse.json({ confirmed: false }, { status: 400 })
  }

  // Mark payment as confirmed in database
  // Fulfill order
  return NextResponse.json({ confirmed: true })
}
```

## References

- [World Mini Apps - Pay Command](https://docs.world.org/mini-apps/commands/pay)
